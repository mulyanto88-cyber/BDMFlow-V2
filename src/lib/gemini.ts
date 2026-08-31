// =============================================================================
// src/lib/gemini.ts
// Dual AI Engine for BDMFlow: DeepSeek (Primary) + Google Gemini (Fallback)
// =============================================================================

export interface GeminiMessage {
  role: 'user' | 'model' | 'assistant'
  parts?: { text: string }[]
  content?: string
}

export function getDeepSeekApiKey(): string | null {
  return process.env.DEEPSEEK_API_KEY || null
}

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

export function getActiveAIProvider(): 'deepseek' | 'gemini' | null {
  if (getDeepSeekApiKey()) return 'deepseek'
  if (getGeminiApiKey()) return 'gemini'
  return null
}

export function getAIApiKey(): string | null {
  return getDeepSeekApiKey() || getGeminiApiKey() || null
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

// Ordered fallback list of supported Gemini models
const GEMINI_CANDIDATE_MODELS = [
  { model: 'gemini-1.5-flash-latest', apiVersion: 'v1beta' },
  { model: 'gemini-1.5-flash',        apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash',        apiVersion: 'v1beta' },
  { model: 'gemini-1.5-pro-latest',   apiVersion: 'v1beta' },
  { model: 'gemini-1.5-pro',          apiVersion: 'v1beta' },
  { model: 'gemini-1.5-flash',        apiVersion: 'v1' },
  { model: 'gemini-pro',              apiVersion: 'v1' },
]

/**
 * Call DeepSeek AI (OpenAI-compatible REST API)
 */
async function callDeepSeekAPI({
  apiKey,
  prompt,
  systemInstruction,
  history = [],
  temperature = 0.5,
}: {
  apiKey: string
  prompt: string
  systemInstruction: string
  history?: GeminiMessage[]
  temperature?: number
}): Promise<string> {
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')
  const endpoint = `${baseUrl}/chat/completions`

  const candidateModels = Array.from(
    new Set([
      process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      'deepseek-chat',
      'deepseek-reasoner',
    ])
  )

  // Construct standard OpenAI/DeepSeek messages
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemInstruction },
  ]

  for (const m of history) {
    const text = m.content || (m.parts && m.parts[0]?.text) || ''
    if (text) {
      messages.push({
        role: m.role === 'model' ? 'assistant' : m.role === 'user' ? 'user' : 'assistant',
        content: text,
      })
    }
  }

  messages.push({ role: 'user', content: prompt })

  let lastError: Error | null = null

  for (const model of candidateModels) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 2048,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.warn(`[DeepSeek API] Model ${model} returned ${response.status}: ${errText.slice(0, 100)}`)
        lastError = new Error(`DeepSeek API error (${response.status}): ${errText}`)
        continue
      }

      const data = await response.json()
      const answer = data?.choices?.[0]?.message?.content

      if (answer) {
        return answer
      }
    } catch (err: any) {
      console.warn(`[DeepSeek API] Error with ${model}:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('DeepSeek API failed to respond.')
}

/**
 * Call Gemini AI
 */
async function callGeminiAPI({
  apiKey,
  prompt,
  systemInstruction,
  history = [],
  temperature = 0.4,
}: {
  apiKey: string
  prompt: string
  systemInstruction: string
  history?: GeminiMessage[]
  temperature?: number
}): Promise<string> {
  let lastError: Error | null = null

  for (const { model, apiVersion } of GEMINI_CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`

      const contents: any[] = history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: m.parts || [{ text: m.content || '' }],
      }))

      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      })

      const payload: any = {
        contents,
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }

      if (systemInstruction && apiVersion === 'v1beta') {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        }
      } else if (systemInstruction && apiVersion === 'v1') {
        if (contents.length > 0 && contents[contents.length - 1].parts.length > 0) {
          contents[contents.length - 1].parts[0].text = `[Instruksi Sistem: ${systemInstruction}]\n\n${contents[contents.length - 1].parts[0].text}`
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
        console.warn(`[Gemini Fallback] Model ${model} (${apiVersion}) returned ${response.status}: ${errorBody.slice(0, 100)}`)
        lastError = new Error(`Gemini API error (${response.status}): ${errorBody}`)
        continue
      }

      const data = await response.json()
      const candidate = data?.candidates?.[0]
      const text = candidate?.content?.parts?.[0]?.text

      if (text) {
        return text
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Exception with ${model}:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to respond.')
}

/**
 * Unified Main Entry Point: Call AI (DeepSeek preferred, Gemini fallback)
 */
export async function callAI({
  prompt,
  systemInstruction = IDX_ANALYST_SYSTEM_INSTRUCTION,
  history = [],
  temperature = 0.4,
}: {
  prompt: string
  systemInstruction?: string
  history?: GeminiMessage[]
  model?: string
  temperature?: number
}): Promise<string> {
  const deepseekKey = getDeepSeekApiKey()
  const geminiKey = getGeminiApiKey()

  if (!deepseekKey && !geminiKey) {
    throw new Error('AI_KEY_MISSING: Harap set DEEPSEEK_API_KEY atau GEMINI_API_KEY di environment variables.')
  }

  // 1. Try DeepSeek first if API key is provided
  if (deepseekKey) {
    try {
      return await callDeepSeekAPI({
        apiKey: deepseekKey,
        prompt,
        systemInstruction,
        history,
        temperature,
      })
    } catch (err: any) {
      console.warn('[AI Engine] DeepSeek call failed, attempting fallback...', err.message)
      if (!geminiKey) {
        throw err
      }
    }
  }

  // 2. Fallback to Gemini
  if (geminiKey) {
    return await callGeminiAPI({
      apiKey: geminiKey,
      prompt,
      systemInstruction,
      history,
      temperature,
    })
  }

  throw new Error('Semua AI provider gagal memproses respon.')
}

// Backwards compatibility alias
export const callGemini = callAI
