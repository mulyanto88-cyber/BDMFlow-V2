// =============================================================================
// src/lib/gemini.ts
// BDMFlow Gemini AI Engine - Primary AI provider for all AI features
// Models: gemini-flash-latest (fast/chat) | gemini-3.8-flash (deep analysis)
// =============================================================================

export interface AIMessage {
  role: 'user' | 'assistant' | 'model' | 'system'
  content?: string
  parts?: { text: string }[]
}

// Re-export type alias for backwards compat
export type GeminiMessage = AIMessage

// System Instruction
export const IDX_ANALYST_SYSTEM_INSTRUCTION = `
Anda adalah "BDMFlow Master AI Intelligence" - Asisten Analis Pasar Modal & Bandarmologi Senior khusus Bursa Efek Indonesia (IDX / BEI).

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

// Candidate Models - ordered by preference
// gemini-flash-latest: fast, perfect for chat
// gemini-3.8-flash: powerful, ideal for deep analysis
const GEMINI_MODELS = [
  { id: 'gemini-flash-latest',      label: 'Gemini Flash Latest',  apiVersion: 'v1beta' },
  { id: 'gemini-3.8-flash',         label: 'Gemini 3.8 Flash',     apiVersion: 'v1beta' },
  { id: 'gemini-3.7-flash',         label: 'Gemini 3.7 Flash',     apiVersion: 'v1beta' },
  { id: 'gemini-3.5-flash',         label: 'Gemini 3.5 Flash',     apiVersion: 'v1beta' },
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite',    apiVersion: 'v1beta' },
]

const GEMINI_ANALYSIS_MODELS = [
  { id: 'gemini-3.8-flash',         label: 'Gemini 3.8 Flash',     apiVersion: 'v1beta' },
  { id: 'gemini-flash-latest',      label: 'Gemini Flash Latest',  apiVersion: 'v1beta' },
  { id: 'gemini-3.7-flash',         label: 'Gemini 3.7 Flash',     apiVersion: 'v1beta' },
]

// Key helpers
export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

// Backwards compat aliases
export function getDeepSeekApiKey(): string | null { return null }
export function getAIApiKey(): string | null { return getGeminiApiKey() }

// Core Gemini caller - shared logic for all models
async function callGeminiWithModels(
  models: typeof GEMINI_MODELS,
  {
    prompt,
    systemInstruction = IDX_ANALYST_SYSTEM_INSTRUCTION,
    history = [],
    temperature = 0.4,
    maxOutputTokens = 4096,
  }: {
    prompt: string
    systemInstruction?: string
    history?: AIMessage[]
    temperature?: number
    maxOutputTokens?: number
  }
): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi. Tambahkan GEMINI_API_KEY di Environment Vercel.')
  }

  // Build Gemini contents from history
  const contents: { role: string; parts: { text: string }[] }[] = []

  for (const m of history) {
    const text = m.content || (m.parts?.[0]?.text) || ''
    if (!text.trim()) continue
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user'
    contents.push({ role, parts: [{ text }] })
  }

  contents.push({ role: 'user', parts: [{ text: prompt }] })

  let lastError: Error | null = null

  for (const { id, label, apiVersion } of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${id}:generateContent?key=${apiKey}`

      const payload: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }

      if (systemInstruction) {
        payload.system_instruction = { parts: [{ text: systemInstruction }] }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        console.warn(`[Gemini] ${label} returned HTTP ${response.status}:`, errText.slice(0, 200))

        // Model unavailable - try next
        if (response.status === 404 || response.status === 400) {
          lastError = new Error(`Model ${id} tidak tersedia (${response.status}).`)
          continue
        }

        // Rate-limited - surface immediately
        if (response.status === 429) {
          throw new Error('GEMINI_RATE_LIMIT: API Gemini sedang sibuk. Tunggu beberapa detik, lalu coba lagi.')
        }

        // Auth error
        if (response.status === 401 || response.status === 403) {
          throw new Error('GEMINI_AUTH_ERROR: GEMINI_API_KEY tidak valid atau tidak memiliki izin.')
        }

        lastError = new Error(`Gemini API error (${response.status}): ${errText.slice(0, 150)}`)
        continue
      }

      const data = await response.json()
      const candidate = data?.candidates?.[0]
      const text = candidate?.content?.parts?.[0]?.text

      if (text && text.trim()) {
        console.info(`[Gemini] OK via ${label} (${contents.length} turns, ${text.length} chars output)`)
        return text.trim()
      }

      // Safety block or empty
      const blockReason = candidate?.finishReason
      if (blockReason && blockReason !== 'STOP') {
        console.warn(`[Gemini] ${label} blocked: ${blockReason}`)
        lastError = new Error(`Gemini blocked: ${blockReason}`)
        continue
      }

      lastError = new Error(`${label} returned empty response.`)
    } catch (err: any) {
      // Re-throw fatal errors immediately
      if (err.message?.startsWith('GEMINI_RATE_LIMIT') || err.message?.startsWith('GEMINI_AUTH_ERROR')) {
        throw err
      }
      console.warn(`[Gemini] Exception with ${label}:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('Semua model Gemini gagal merespons. Coba lagi nanti.')
}

/**
 * Chat / general AI call - fast Flash models.
 * Drop-in replacement for the old callAI / callDeepSeek functions.
 */
export async function callGemini(params: {
  prompt: string
  systemInstruction?: string
  history?: AIMessage[]
  temperature?: number
  model?: string
}): Promise<string> {
  return callGeminiWithModels(GEMINI_MODELS, {
    ...params,
    maxOutputTokens: 4096,
  })
}

/**
 * Deep analysis call - more capable models, longer outputs.
 * Preferred for /api/ai/analyze endpoint.
 */
export async function callGeminiAnalysis(params: {
  prompt: string
  systemInstruction?: string
  temperature?: number
}): Promise<string> {
  return callGeminiWithModels(GEMINI_ANALYSIS_MODELS, {
    ...params,
    maxOutputTokens: 8192,
    temperature: params.temperature ?? 0.3,
  })
}

// Backwards-compat shims for old DeepSeek-era exports
export const callAI = callGemini
export const callDeepSeek = callGemini
export const callGeminiLegacy = callGemini
