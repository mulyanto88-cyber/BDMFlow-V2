// =============================================================================
// src/lib/gemini.ts
// Google Gemini API Client & Financial Market AI Engine for BDMFlow
// =============================================================================

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

const DEFAULT_MODEL = 'gemini-1.5-flash'

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

const IDX_ANALYST_SYSTEM_INSTRUCTION = `
Anda adalah "BDMFlow Master AI Intelligence" — Asisten Analis Pasar Modal & Bandarmologi Senior khusus Bursa Efek Indonesia (IDX / BEI).
Gaya analisis Anda:
1. Lugas, tajam, objektif, berbasis data nyata (Tanpa jargon kosong).
2. Ahli dalam sintesa multi-dimensi:
   - Bandarmologi & Smart Money Flow (Aktivitas Whale, Broksum Konsentrasi, AOV Ratio)
   - Foreign Flow (Aliran dana asing semalam & tren mingguan)
   - Analisa Teknikal & Momentum (Support, Resistance, Volume vs MA20, MA20 breakout)
   - Fundamental & Valuasi (PER, PBV, ROE, Pertumbuhan Laba, Kesehatan Utang)
3. Memberikan "Trading Plan" yang jelas untuk Scalper (Day Trader) maupun Swing Trader:
   - Area Buy / Entry Zone
   - Target Profit (TP1 & TP2)
   - Cut Loss / Stop Loss level
   - Tingkat Risiko (Low / Medium / High / Speculative)
4. Format output menggunakan Markdown yang rapi dengan bullet points, bold text, dan ikon visual yang menarik.
5. Selalu sertakan Disclaimer singkat di akhir bahwa analisa ini adalah panduan data & keputusan tetap di tangan trader.
`

export async function callGemini({
  prompt,
  systemInstruction = IDX_ANALYST_SYSTEM_INSTRUCTION,
  history = [],
  model = DEFAULT_MODEL,
  temperature = 0.4,
}: {
  prompt: string
  systemInstruction?: string
  history?: GeminiMessage[]
  model?: string
  temperature?: number
}): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const contents: GeminiMessage[] = [
    ...history,
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ]

  const payload: any = {
    contents,
    generationConfig: {
      temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  }

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[Gemini API Error]', response.status, errorBody)
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const candidate = data?.candidates?.[0]
  const text = candidate?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No content returned from Gemini API.')
  }

  return text
}
