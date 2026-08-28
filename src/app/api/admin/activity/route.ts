import { NextRequest, NextResponse } from 'next/server'
import { getViewer, getAdmin } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = [
  'mulyanto.my88@gmail.com',
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase()] : []),
]

export async function GET(req: NextRequest) {
  const viewer = await getViewer(req)
  if (!viewer.userId) {
    return NextResponse.json({ error: 'Unauthorized: Login required.' }, { status: 401 })
  }

  const admin = getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database service role unavailable.' }, { status: 500 })
  }

  // Verify that the user is the admin
  const { data: userRecord, error: userErr } = await admin.auth.admin.getUserById(viewer.userId)
  const email = userRecord?.user?.email?.toLowerCase()

  if (userErr || !email || !ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden: Admin access only.' }, { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const filterEmail = searchParams.get('email')
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 300)

  // 1. Fetch activities with user email
  let query = admin
    .from('user_activities')
    .select('id, user_id, path, page_title, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filterEmail) {
    // Look up user id by email
    const { data: targetUsers } = await admin.auth.admin.listUsers()
    const target = targetUsers?.users.find((u) => u.email?.toLowerCase() === filterEmail.toLowerCase())
    if (target) {
      query = query.eq('user_id', target.id)
    } else {
      return NextResponse.json({ activities: [], users: [], topPages: [] })
    }
  }

  const { data: activities, error: actErr } = await query

  if (actErr) {
    console.error('[admin-activity] error:', actErr.message)
    return NextResponse.json({ error: actErr.message }, { status: 500 })
  }

  // 2. Fetch all users map to enrich activity records
  const { data: allUsers } = await admin.auth.admin.listUsers()
  const userMap = new Map<string, { email: string; createdAt: string; lastSignIn: string | null }>()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, plan, trial_ends_at, plan_expires_at')

  const profileMap = new Map<string, { plan: string; trialEndsAt: string | null; planExpiresAt: string | null }>()
  profiles?.forEach((p) => {
    profileMap.set(p.id, {
      plan: p.plan,
      trialEndsAt: p.trial_ends_at,
      planExpiresAt: p.plan_expires_at,
    })
  })

  allUsers?.users.forEach((u) => {
    userMap.set(u.id, {
      email: u.email || 'unknown',
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at || null,
    })
  })

  const enrichedActivities = (activities || []).map((a) => {
    const u = userMap.get(a.user_id)
    const p = profileMap.get(a.user_id)
    const isPro = p?.plan === 'pro' && (!p?.planExpiresAt || new Date(p.planExpiresAt).getTime() > Date.now())
    const isTrial = !isPro && p?.trialEndsAt && new Date(p.trialEndsAt).getTime() > Date.now()

    return {
      id: a.id,
      userId: a.user_id,
      email: u?.email || 'Unknown User',
      path: a.path,
      pageTitle: a.page_title,
      createdAt: a.created_at,
      plan: isPro ? 'PRO' : isTrial ? 'TRIAL' : 'FREE',
    }
  })

  // 3. Aggregate top visited paths
  const pathCounts: Record<string, { count: number; uniqueUsers: Set<string> }> = {}
  enrichedActivities.forEach((a) => {
    if (!pathCounts[a.path]) {
      pathCounts[a.path] = { count: 0, uniqueUsers: new Set() }
    }
    pathCounts[a.path].count += 1
    pathCounts[a.path].uniqueUsers.add(a.userId)
  })

  const topPages = Object.entries(pathCounts)
    .map(([path, data]) => ({
      path,
      views: data.count,
      uniqueUsers: data.uniqueUsers.size,
    }))
    .sort((a, b) => b.views - a.views)

  // 4. Summarized list of users
  const userList = (allUsers?.users || []).map((u) => {
    const p = profileMap.get(u.id)
    const isPro = p?.plan === 'pro' && (!p?.planExpiresAt || new Date(p.planExpiresAt).getTime() > Date.now())
    const isTrial = !isPro && p?.trialEndsAt && new Date(p.trialEndsAt).getTime() > Date.now()

    return {
      id: u.id,
      email: u.email || '',
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at || null,
      status: isPro ? 'PRO' : isTrial ? 'TRIAL' : 'FREE',
    }
  })

  return NextResponse.json({
    activities: enrichedActivities,
    topPages,
    users: userList,
    totalActivities: enrichedActivities.length,
  })
}
