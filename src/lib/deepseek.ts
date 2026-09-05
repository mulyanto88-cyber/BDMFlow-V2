// =============================================================================
// src/lib/deepseek.ts
// Backwards-compatibility shim: all AI now goes through Gemini.
// =============================================================================

export {
  IDX_ANALYST_SYSTEM_INSTRUCTION,
  getGeminiApiKey,
  getDeepSeekApiKey,
  getAIApiKey,
  callGemini,
  callGeminiAnalysis,
  callGeminiLegacy,
} from './gemini'

export { callGemini as callAI } from './gemini'
export { callGemini as callDeepSeek } from './gemini'

export type { AIMessage } from './gemini'
export type { GeminiMessage } from './gemini'
export type { GeminiMessage as DeepSeekMessage } from './gemini'
