import { useQuery } from '@tanstack/react-query'

async function fetchStockDetail(code: string, days: number) {
  const res = await fetch(`/api/stock-detail?code=${code}&days=${days}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch stock detail')
  
  // Format history data upfront
  if (json.historyData) {
    json.historyData = json.historyData.map((d: any) => ({
      time: String(d.trading_date).split('T')[0],
      open: Number(d.open_price) || Number(d.previous) || Number(d.close) || 0,
      high: Number(d.high) || Number(d.close) || 0,
      low: Number(d.low) || Number(d.close) || 0,
      close: Number(d.close) || 0,
      volume: Number(d.volume) || 0,
      net_foreign: Number(d.net_foreign_value) || 0,
      aov_ratio: Number(d.aov_ratio_ma20) || 1,
      vwma: Number(d.vwma_20d) || 0,
      whale_signal: !!d.whale_signal,
      big_player_anomaly: !!d.big_player_anomaly,
    }))
  }
  
  if (json.ownershipDetails) {
    json.ownershipDetails = json.ownershipDetails.map((d: any) => ({
      investor_name: d.investor_name, investor_type: d.investor_type,
      local_foreign: d.local_foreign, percentage: Number(d.percentage),
      shares: Number(d.total_holding_shares || 0),
    }))
  }

  return json
}

export function useStockOverview(code: string | null, days: number) {
  return useQuery({
    queryKey: ['stock-detail', code, days],
    queryFn: () => fetchStockDetail(code!, days),
    enabled: !!code,
  })
}
