// =============================================================================
// src/lib/deepseek.ts
// DeepSeek AI Financial Market Engine for BDMFlow
// =============================================================================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'model'
  content?: string
  parts?: { text: string }[]
}

export function getDeepSeekApiKey(): string | null {
  return process.env.DEEPSEEK_API_KEY || null
}

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

export function getAIApiKey(): string | null {
  return getDeepSeekApiKey() || getGeminiApiKey() || null
}

export const IDX_ANALYST_SYSTEM_INSTRUCTION = `
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

/**
 * Call DeepSeek AI Official API (https://api.deepseek.com)
 */
export async function callDeepSeek({
  prompt,
  systemInstruction = IDX_ANALYST_SYSTEM_INSTRUCTION,
  history = [],
  temperature = 0.5,
  model = process.env.DEEPSEEK_MODEL || 'deepseek-chat',
}: {
  prompt: string
  systemInstruction?: string
  history?: AIMessage[]
  temperature?: number
  model?: string
}): Promise<string> {
  const apiKey = getDeepSeekApiKey()
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY belum dikonfigurasi di Environment Vercel.')
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')
  const endpoint = `${baseUrl}/chat/completions`

  // Candidate models: User specified model -> deepseek-chat -> deepseek-reasoner
  const candidateModels = Array.from(
    new Set([
      model,
      'deepseek-chat',
      'deepseek-reasoner',
    ])
  ).filter(Boolean)

  // Construct message sequence
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemInstruction },
  ]

  for (const m of history) {
    const text = m.content || (m.parts && m.parts[0]?.text) || ''
    if (text) {
      const role = m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user'
      messages.push({ role, content: text })
    }
  }

  messages.push({ role: 'user', content: prompt })

  let lastError: Error | null = null

  for (const targetModel of candidateModels) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature,
          max_tokens: 2048,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.warn(`[DeepSeek] Model ${targetModel} returned ${response.status}: ${errText.slice(0, 150)}`)

        if (response.status === 402 || errText.toLowerCase().includes('insufficient balance') || errText.toLowerCase().includes('insufficient_quota')) {
          throw new Error('INSUFFICIENT_BALANCE: Saldo token DeepSeek Anda telah habis. Silakan top up saldo di platform.deepseek.com.')
        }

        lastError = new Error(`DeepSeek API error (${response.status}): ${errText}`)
        continue
      }

      const data = await response.json()
      const answer = data?.choices?.[0]?.message?.content

      if (answer) {
        return answer
      }
    } catch (err: any) {
      console.warn(`[DeepSeek] Network/Execution error on ${targetModel}:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('DeepSeek API tidak memberikan respons.')
}

/**
 * Universal AI Caller (Prioritizes DeepSeek, with Gemini fallback if available)
 */
export async function callAI(params: {
  prompt: string
  systemInstruction?: string
  history?: AIMessage[]
  temperature?: number
  model?: string
}): Promise<string> {
  const deepseekKey = getDeepSeekApiKey()
  const geminiKey = getGeminiApiKey()

  if (deepseekKey) {
    try {
      return await callDeepSeek(params)
    } catch (err: any) {
      console.warn('[AI] DeepSeek failed:', err.message)
      if (!geminiKey) throw err
    }
  }

  if (geminiKey) {
    // If Gemini key exists, try Gemini
    const { callGeminiLegacy } = await import('./gemini')
    return await callGeminiLegacy(params)
  }

  throw new Error('DEEPSEEK_API_KEY belum dikonfigurasi di Environment Vercel.')
}

// Backwards compatibility alias
export const callGemini = callAI
