// =============================================================================
// src/lib/gemini.ts
// Fallback Gemini Client & Re-exports from DeepSeek AI Engine
// =============================================================================

export {
  callDeepSeek,
  callAI,
  callGemini,
  getDeepSeekApiKey,
  getGeminiApiKey,
  getAIApiKey,
  IDX_ANALYST_SYSTEM_INSTRUCTION,
} from './deepseek'
export type { AIMessage as GeminiMessage } from './deepseek'

const GEMINI_CANDIDATE_MODELS = [
  { model: 'gemini-1.5-flash-latest', apiVersion: 'v1beta' },
  { model: 'gemini-1.5-flash',        apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash',        apiVersion: 'v1beta' },
  { model: 'gemini-1.5-pro-latest',   apiVersion: 'v1beta' },
  { model: 'gemini-1.5-pro',          apiVersion: 'v1beta' },
  { model: 'gemini-1.5-flash',        apiVersion: 'v1' },
  { model: 'gemini-pro',              apiVersion: 'v1' },
]

export async function callGeminiLegacy({
  prompt,
  systemInstruction,
  history = [],
  temperature = 0.4,
}: {
  prompt: string
  systemInstruction?: string
  history?: any[]
  temperature?: number
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING')
  }

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
