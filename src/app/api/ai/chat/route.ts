import { NextRequest, NextResponse } from 'next/server'
import { getViewer, getAdmin } from '@/lib/auth-server'
import { run } from '@/lib/db'
import { callGemini, getGeminiApiKey, GeminiMessage } from '@/lib/gemini'

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

    // 2. Check API Key
    if (!getGeminiApiKey()) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY belum dikonfigurasi di file .env.local.',
          isConfigError: true,
        },
        { status: 503 }
      )
    }

    // 3. Parse Request
    const body = await req.json()
    const messages = body.messages || []
    const currentTicker = String(body.current_ticker || '').trim().toUpperCase()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Pesan chat tidak boleh kosong.' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    const userPrompt = lastMessage.content || ''

    // Convert previous chat history to Gemini format
    const history: GeminiMessage[] = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }))

    // Optional: Fetch ticker context if available
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
    console.error('[API /api/ai/chat error]', err)
    return NextResponse.json(
      { error: err.message || 'Gagal memproses pesan AI.' },
      { status: 500 }
    )
  }
}
