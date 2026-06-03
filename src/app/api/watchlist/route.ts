import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars are not configured')
  return createClient(url, key)
}

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stock_code, alert_score, notes } = await req.json()
  if (!stock_code) return NextResponse.json({ error: 'stock_code required' }, { status: 400 })

  const supabase = getSupabase()
  // Check plan limits (free = max 20)
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (profile?.plan !== 'pro') {
    const { count } = await supabase.from('watchlists').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((count ?? 0) >= 20) {
      return NextResponse.json({ error: 'Free plan limit 20 saham. Upgrade ke PRO untuk unlimited.' }, { status: 403 })
    }
  }

  const { data, error } = await supabase.from('watchlists').upsert(
    { user_id: user.id, stock_code: stock_code.toUpperCase(), alert_score, notes },
    { onConflict: 'user_id,stock_code' }
  ).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stock_code = searchParams.get('stock_code')
  if (!stock_code) return NextResponse.json({ error: 'stock_code required' }, { status: 400 })

  const supabase = getSupabase()
  const { error } = await supabase.from('watchlists')
    .delete()
    .eq('user_id', user.id)
    .eq('stock_code', stock_code.toUpperCase())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
