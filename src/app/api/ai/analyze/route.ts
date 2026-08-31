import { NextRequest, NextResponse } from 'next/server'
import { getViewer, getAdmin } from '@/lib/auth-server'
import { run } from '@/lib/db'
import { callGemini, getAIApiKey } from '@/lib/gemini'

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

    // 2. Check API Key (DeepSeek or Gemini)
    if (!getAIApiKey()) {
      return NextResponse.json(
        {
          error: 'DEEPSEEK_API_KEY atau GEMINI_API_KEY belum dikonfigurasi di Environment Vercel. Tambahkan DEEPSEEK_API_KEY=sk-... di Environment Settings untuk mengaktifkan AI Copilot.',
          isConfigError: true,
        },
        { status: 503 }
      )
    }

    // 3. Parse Request
    const body = await req.json()
    const rawStockCode = String(body.stock_code || '').trim().toUpperCase()
    const promptStyle = body.prompt_style || 'COMPREHENSIVE' // 'COMPREHENSIVE' | 'SCALPER' | 'BANDAR' | 'VALUATION'

    if (!rawStockCode || rawStockCode.length > 6) {
      return NextResponse.json({ error: 'Stock code tidak valid.' }, { status: 400 })
    }

    // 4. Query Market Data from MotherDuck
    const [priceDataRows, keyStatsRows, profileRows, brokerRows] = await Promise.all([
      // A. Recent 20 trading days
      run(`
        SELECT 
          trading_date, close, previous, change_percent, 
          volume, value, frequency, foreign_buy_value, foreign_sell_value, net_foreign_value,
          high, low, open_price, vwma_20d, ma20_volume, aov_ratio_ma20, whale_signal, signal
        FROM market.daily_transactions
        WHERE stock_code = $1
        ORDER BY CAST(trading_date AS DATE) DESC
        LIMIT 20
      `, [rawStockCode]).catch((err) => {
        console.error('[AI Analyze DB Error - daily_transactions]', err)
        return []
      }),

      // B. Fundamental Key Stats
      run(`
        SELECT *
        FROM market.company_keystats
        WHERE stock_code = $1
        LIMIT 1
      `, [rawStockCode]).catch((err) => {
        console.error('[AI Analyze DB Error - company_keystats]', err)
        return []
      }),

      // C. Company Profile
      run(`
        SELECT stock_code, company_name, sector, group_name, free_float
        FROM market.company_profile
        WHERE stock_code = $1
        LIMIT 1
      `, [rawStockCode]).catch(() => []),

      // D. Recent Broksum Activity
      run(`
        SELECT date, broker_code, side, value, lot, avg_price, freq
        FROM broker_activity
        WHERE stock_code = $1
          AND date = (SELECT MAX(date) FROM broker_activity WHERE stock_code = $1)
        ORDER BY value DESC
        LIMIT 15
      `, [rawStockCode]).catch(() => []),
    ])

    if (!priceDataRows || priceDataRows.length === 0) {
      return NextResponse.json(
        { error: `Data transaksi untuk saham ${rawStockCode} tidak ditemukan di database.` },
        { status: 404 }
      )
    }

    const latest = priceDataRows[0]
    const profile = profileRows?.[0] || {}
    const stats = keyStatsRows?.[0] || {}

    // Calculate MA20 & Volume Anomaly
    const avgVol20 = Number(latest.ma20_volume || 0) || (priceDataRows.reduce((acc, r) => acc + Number(r.volume || 0), 0) / priceDataRows.length)
    const avgVal20 = priceDataRows.reduce((acc, r) => acc + Number(r.value || 0), 0) / priceDataRows.length
    const volRatio = avgVol20 > 0 ? (Number(latest.volume || 0) / avgVol20) : 1
    const netForeignKemarinMiliar = Number(latest.net_foreign_value || 0) / 1_000_000_000

    // Top Brokers Accumulator vs Distributer
    const buyBrokers = brokerRows.filter((b: any) => b.side === 'BUY').slice(0, 5)
    const sellBrokers = brokerRows.filter((b: any) => b.side === 'SELL').slice(0, 5)

    // Build Context
    const stockContext = {
      stock_code: rawStockCode,
      company_name: profile.company_name || rawStockCode,
      sector: profile.sector || 'N/A',
      last_trading_date: latest.trading_date,
      close_price: latest.close,
      previous_price: latest.previous,
      change_percent: Number(latest.change_percent || 0).toFixed(2) + '%',
      volume_kemarin: Number(latest.volume || 0).toLocaleString(),
      avg_volume_20d: Math.round(avgVol20).toLocaleString(),
      volume_surge_ratio: volRatio.toFixed(2) + 'x',
      aov_whale_ratio: Number(latest.aov_ratio_ma20 || 1).toFixed(2) + 'x',
      whale_signal: latest.whale_signal ? 'YES (Whale Flow)' : 'Normal',
      smart_money_bandar_verdict: latest.signal || 'Neutral',
      vwma_20d: latest.vwma_20d ? Math.round(latest.vwma_20d) : 'N/A',
      value_kemarin_miliar: (Number(latest.value || 0) / 1_000_000_000).toFixed(2),
      avg_value_20d_miliar: (avgVal20 / 1_000_000_000).toFixed(2),
      net_foreign_kemarin_miliar: netForeignKemarinMiliar.toFixed(2),
      top_buyers: buyBrokers.map((b: any) => `${b.broker_code} (Rp ${(b.value / 1e9).toFixed(2)}M @ ${b.avg_price})`),
      top_sellers: sellBrokers.map((b: any) => `${b.broker_code} (Rp ${(b.value / 1e9).toFixed(2)}M @ ${b.avg_price})`),
      fundamental: {
        pe_ratio_ttm: stats.pe_ratio_ttm ?? 'N/A',
        pbv_ratio: stats.pbv_ratio ?? 'N/A',
        roe_ttm_pct: stats.roe_ttm_pct ? `${stats.roe_ttm_pct}%` : 'N/A',
        market_cap_b: stats.market_cap_b ? `Rp ${stats.market_cap_b} Miliar` : 'N/A',
        debt_to_equity: stats.debt_to_equity ?? 'N/A',
        current_ratio: stats.current_ratio ?? 'N/A',
        eps_ttm: stats.eps_ttm ?? 'N/A',
        revenue_growth_yoy_pct: stats.revenue_growth_yoy_pct ? `${stats.revenue_growth_yoy_pct}%` : 'N/A',
        net_income_growth_yoy: stats.net_income_growth_yoy ? `${stats.net_income_growth_yoy}%` : 'N/A',
      }
    }

    // Custom prompt based on style
    let promptGoal = 'Lakukan analisis komprehensif 360 derajat (Bandarmologi, Foreign Flow, Broksum, Teknikal & Fundamental).'
    if (promptStyle === 'SCALPER') {
      promptGoal = 'Fokus utama: Analisis Scalping & Day Trading Momentum untuk market buka besok pagi (Open=Low potential, Vol Surge, Risk/Reward cepat).'
    } else if (promptStyle === 'BANDAR') {
      promptGoal = 'Fokus utama: Bedah mendalam jejak Smart Money & Bandarmologi (Siapa broker pengendali, avg buy vs avg sell, fase akumulasi vs markup vs distribusi).'
    } else if (promptStyle === 'VALUATION') {
      promptGoal = 'Fokus utama: Bedah Fundamental & Valuasi Saham (Kesehatan keuangan, margin profit, kewajaran harga vs industri).'
    }

    const aiPrompt = `
Tolong lakukan analisa mendalam untuk saham berikut berdasarkan data pasar aktual yang terverifikasi di bawah ini:

### 📊 DATA PASAR SAHAM:
${JSON.stringify(stockContext, null, 2)}

### 🎯 INSTRUKSI KHUSUS:
${promptGoal}

Sajikan laporan dengan struktur berikut:
1. **⚡ EXECUTIVE VERDICT** (Status Bandarmologi: Akumulasi Masif / Normal / Netral / Distribusi, Sentiment: Bullish/Bearish/Neutral, Skor Potensi: 1-100)
2. **🐋 SMART MONEY & BROKSUM INTEL** (Analisa pergerakan broker dominan, perbandingan akumulasi vs distribusi, dan aliran dana Asing semalam)
3. **📊 VALUASI & KESEHATAN FINANSIAL** (Ringkasan singkat rasio PER, PBV, ROE, dan solvabilitas utang)
4. **🎯 ACTIONABLE TRADING PLAN** (Untuk scalper / swing trader: Area Beli / Buy Zone, Target Profit 1 & 2, Cut Loss Level ketat, dan Risk Level)
5. **⚠️ KEY WATCHLIST & RISIKO** (Katalis positif atau risiko yang harus diwaspadai besok)
`

    const analysis = await callGemini({ prompt: aiPrompt })

    return NextResponse.json({
      success: true,
      stock_code: rawStockCode,
      analysis,
      snapshot: stockContext,
      generated_at: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[API /api/ai/analyze error]', err)
    return NextResponse.json(
      { error: err.message || 'Gagal memproses analisa AI.' },
      { status: 500 }
    )
  }
}
