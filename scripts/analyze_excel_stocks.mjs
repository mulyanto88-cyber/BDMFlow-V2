import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const req = createRequire(import.meta.url)
const { Pool } = req('pg')

// Load token from .env.local
const rawEnv = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
let token = ''
for (const line of rawEnv.split(/\r?\n/)) {
  const m = line.match(/^\s*MOTHERDUCK_TOKEN\s*=\s*(.*?)\s*$/)
  if (m) token = m[1].replace(/^["']|["']$/g, '')
}

const pool = new Pool({
  host: 'pg.us-east-1-aws.motherduck.com',
  port: 5432,
  user: 'postgres',
  password: token,
  database: 'my_db',
  ssl: { rejectUnauthorized: true },
  max: 4,
})

async function run() {
  const excelStocks = JSON.parse(readFileSync('scratch_fca_stocks.json', 'utf8'))
  const codes = excelStocks.map(s => s.code)
  const excelMap = new Map(excelStocks.map(s => [s.code, s]))

  console.log(`Analyzing ${codes.length} stocks from Excel against database...`)

  const query = `
    WITH latest_tx AS (
      SELECT *
      FROM market.daily_transactions
      WHERE trading_date = (SELECT MAX(trading_date) FROM market.daily_transactions)
    )
    SELECT 
      t.stock_code,
      t.trading_date,
      t.close,
      t.change_percent,
      t.volume,
      t.ma20_volume,
      (CAST(t.volume AS DOUBLE) / NULLIF(CAST(t.ma20_volume AS DOUBLE), 0)) AS vol_spike_ratio,
      t.aov_ratio_ma20,
      t.whale_signal,
      t.big_player_anomaly,
      t.signal AS dt_signal,
      s.sector,
      s.composite_score,
      s.composite_tier,
      s.foreign_score,
      s.broker_score,
      s.price_score,
      s.return_5d,
      s.return_20d,
      k.ksei_score,
      k.smart_money_miliar,
      k.retail_miliar,
      k.smart_retail_divergence,
      k.sm_trend,
      i.conviction_score AS insider_conviction,
      i.insider_signal
    FROM latest_tx t
    LEFT JOIN market.tb_broker_screener s ON t.stock_code = s.stock_code
    LEFT JOIN ksei.tb_ksei_screener k ON t.stock_code = k.stock_code
    LEFT JOIN main.vw_insider_conviction_score i ON t.stock_code = i.stock_code
    WHERE t.stock_code IN (${codes.map(c => `'${c}'`).join(',')})
  `

  const res = await pool.query(query)
  const results = res.rows.map(row => {
    const meta = excelMap.get(row.stock_code) || {}
    return {
      ...row,
      company_name: meta.name,
      entry_date: meta.entry_date,
      exit_date: meta.exit_date,
      criteria: meta.criteria,
      is_currently_in: !meta.exit_date
    }
  })

  writeFileSync('scratch_fca_analysis_results.json', JSON.stringify(results, null, 2))
  console.log(`Successfully matched ${results.length} stocks. Saved to scratch_fca_analysis_results.json`)

  await pool.end()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
