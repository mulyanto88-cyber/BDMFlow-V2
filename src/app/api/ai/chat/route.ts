import { NextRequest, NextResponse } from 'next/server'
import { getViewer, getAdmin } from '@/lib/auth-server'
import { run } from '@/lib/db'
import { callGemini, getAIApiKey, GeminiMessage } from '@/lib/gemini'
import { checkRateLimit } from '@/lib/ai-guardian'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = [
  'mulyanto.my88@gmail.com',
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase()] : []),
]

export async function POST(req: NextRequest) {
  try {
    // 1. VIP Guard
    const viewer = await getViewer(req)
    if (!viewer.userId) {
      return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu.' }, { status: 401 })
    }

    const admin = getAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database service role tidak tersedia.' }, { status: 500 })
    }

    const { data: userRecord, error: userErr } = await admin.auth.admin.getUserById(viewer.userId)
    const email = userRecord?.user?.email?.toLowerCase()

    if (userErr || !email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: 'Forbidden: Fitur BDMFlow AI Intelligence saat ini eksklusif untuk Master Account.' },
        { status: 403 }
      )
    }

    // 2. Rate Limiter (Max 25 chat messages/minute per user)
    const rateLimit = checkRateLimit(viewer.userId, 25, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak pesan chat dalam waktu singkat. Silakan tunggu ${rateLimit.retryAfterSeconds} detik.`,
          isRateLimited: true,
        },
        { status: 429 }
      )
    }

    // 3. Check API Key (DeepSeek or Gemini)
    if (!getAIApiKey()) {
      return NextResponse.json(
        {
          error: 'DEEPSEEK_API_KEY belum dikonfigurasi di Environment Vercel. Tambahkan DEEPSEEK_API_KEY=sk-... untuk mengaktifkan fitur AI.',
          isConfigError: true,
        },
        { status: 503 }
      )
    }

    // 4. Parse Request & Cap History (Token Saver)
    const body = await req.json()
    const rawMessages = body.messages || []
    const currentTicker = String(body.current_ticker || '').trim().toUpperCase()

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'Pesan chat tidak boleh kosong.' }, { status: 400 })
    }

    const lastMessage = rawMessages[rawMessages.length - 1]
    const userPrompt = String(lastMessage.content || '').slice(0, 1000)

    // Token Saver: Cap history to max 4 previous messages, max 500 chars each
    const recentHistory = rawMessages.slice(0, -1).slice(-4)
    const history: GeminiMessage[] = recentHistory.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: String(m.content || '').slice(0, 500),
    }))

    // 5. Optional: Fetch ticker context if available
    let tickerContextText = ''
    if (currentTicker && currentTicker.length <= 6) {
      try {
        const [latestRows, statsRows] = await Promise.all([
          run(`
            SELECT trading_date, close, change_percent, volume, value, net_foreign_value
            FROM market.daily_transactions
            WHERE stock_code = $1
            ORDER BY CAST(trading_date AS DATE) DESC
            LIMIT 5
          `, [currentTicker]),
          run(`
            SELECT pe_ratio_ttm, pbv_ratio, roe_ttm_pct, market_cap_b, debt_to_equity
            FROM market.company_keystats
            WHERE stock_code = $1
            LIMIT 1
          `, [currentTicker]),
        ])

        if (latestRows.length > 0) {
          const l = latestRows[0]
          const s = statsRows[0] || {}
          tickerContextText = `
Konteks Emiten Aktif (${currentTicker}):
- Harga Terakhir: Rp ${l.close} (${Number(l.change_percent || 0) > 0 ? '+' : ''}${Number(l.change_percent || 0).toFixed(2)}%)
- Nilai Transaksi: Rp ${(Number(l.value || 0) / 1e9).toFixed(2)} Miliar
- Net Foreign: Rp ${(Number(l.net_foreign_value || 0) / 1e9).toFixed(2)} Miliar
- PER: ${s.pe_ratio_ttm ?? '-'} | PBV: ${s.pbv_ratio ?? '-'} | ROE: ${s.roe_ttm_pct ? s.roe_ttm_pct + '%' : '-'}
`
        }
      } catch (e) {
        console.warn('[AI Chat] Context fetch ignored:', e)
      }
    }

    const fullPrompt = tickerContextText
      ? `${tickerContextText}\n\nPertanyaan User:\n${userPrompt}`
      : userPrompt

    const reply = await callGemini({
      prompt: fullPrompt,
      history,
      temperature: 0.5,
    })

    return NextResponse.json({
      success: true,
      message: reply,
    })
  } catch (err: any) {
    console.error('[API /api/ai/chat internal error]', err)
    if (err.message && err.message.includes('INSUFFICIENT_BALANCE')) {
      return NextResponse.json(
        { error: '⚠️ Saldo token DeepSeek telah habis. Silakan top-up saldo Anda di platform.deepseek.com.' },
        { status: 402 }
      )
    }
    return NextResponse.json(
      { error: 'Gagal memproses pesan AI saat ini. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    )
  }
}
