// ============================================================
// src/lib/ksei-constants.ts
// Shared KSEI display constants (color / glossary / buckets).
//
// Previously copy-pasted verbatim in ksei-monthly and ksei1persen
// pages — keep ONE definition so a palette or glossary change
// can't drift between the two screens.
// ============================================================

// Warna per tipe investor individual (Local = solid, Foreign = lebih terang/teal-shift)
export const TIPE_COLOR: Record<string, string> = {
  'Local CP': '#16a34a', 'Local PF': '#22c55e', 'Local IB': '#4ade80', 'Local MF': '#86efac',
  'Local ID': '#ef4444', 'Local IS': '#3b82f6', 'Local SC': '#64748b', 'Local FD': '#94a3b8', 'Local OT': '#cbd5e1',
  'Foreign CP': '#0d9488', 'Foreign PF': '#14b8a6', 'Foreign IB': '#2dd4bf', 'Foreign MF': '#5eead4',
  'Foreign ID': '#f87171', 'Foreign IS': '#60a5fa', 'Foreign SC': '#475569', 'Foreign FD': '#78716c', 'Foreign OT': '#a8a29e',
}

// Glossary tipe KSEI
export const TIPE_GLOSS: Record<string, string> = {
  CP: 'Corporate', PF: 'Pension Fund', IB: 'Insurance/Bank', MF: 'Mutual Fund',
  ID: 'Individual', IS: 'Insurance', SC: 'Securities', FD: 'Foundation', OT: 'Others',
}

// 18 investor-type buckets (Local/Foreign × 9 KSEI types) for the global-flow tab.
// kat mirrors the route: Smart = CP/PF/IB/MF, Retail = ID, Inst = IS, Other = SC/FD/OT.
const BUCKET_KAT: Record<string, string> = {
  CP: 'Smart', PF: 'Smart', IB: 'Smart', MF: 'Smart',
  ID: 'Retail', IS: 'Inst', SC: 'Other', FD: 'Other', OT: 'Other',
}

export type KseiBucket = {
  key: string
  label: string
  code: string
  side: 'Local' | 'Foreign'
  kat: string
}

export const KSEI_BUCKETS: KseiBucket[] = (['Local', 'Foreign'] as const).flatMap(side =>
  ['CP', 'PF', 'IB', 'MF', 'ID', 'IS', 'SC', 'FD', 'OT'].map(code => ({
    key: `${side}_${code}`, label: `${side} ${code}`, code, side, kat: BUCKET_KAT[code],
  }))
)
