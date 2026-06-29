import { useQuery } from '@tanstack/react-query'

// ─── Broker DNA (tab: broker) ─────────────────────────────────────────────
async function fetchBrokerDNA(code: string) {
  const res = await fetch(`/api/radar?action=broker_breakdown&code=${code}`)
  const json = await res.json().catch(() => ({}))
  return {
    rolling: json.rolling || null,
    topBuyers: json.topBuyers || [],
    topSellers: json.topSellers || [],
  }
}

export function useBrokerDNA(code: string | null) {
  return useQuery({
    queryKey: ['broker-dna', code],
    queryFn: () => fetchBrokerDNA(code!),
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5 minutes — broker data doesn't change fast
  })
}

// ─── KSEI Trend (tab: ksei) ───────────────────────────────────────────────
async function fetchKSEITrend(code: string) {
  const res = await fetch(`/api/ksei-monthly?action=stock_trend&code=${code}`)
  const json = await res.json().catch(() => ({}))
  return json.data || []
}

export function useKSEITrend(code: string | null) {
  return useQuery({
    queryKey: ['ksei-trend', code],
    queryFn: () => fetchKSEITrend(code!),
    enabled: !!code,
    staleTime: 10 * 60 * 1000, // 10 minutes — monthly data is very stable
  })
}

// ─── Insider Data (tab: insider) ──────────────────────────────────────────
async function fetchInsiderData(code: string) {
  const [feedRes, scoreRes] = await Promise.all([
    fetch(`/api/insider?action=feed&code=${code}&days=730&limit=25`).then(r => r.json()).catch(() => ({})),
    fetch(`/api/stock-detail?action=insider_signal&code=${code}`).then(r => r.json()).catch(() => ({})),
  ])
  return {
    feed: feedRes.data || [],
    score: scoreRes.score || null,
  }
}

export function useInsiderData(code: string | null) {
  return useQuery({
    queryKey: ['insider-data', code],
    queryFn: () => fetchInsiderData(code!),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  })
}
