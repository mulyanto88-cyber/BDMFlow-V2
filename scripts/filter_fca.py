import json

with open('scratch_fca_analysis_results.json', 'r') as f:
    data = json.load(f)

stocks_map = {}
for row in data:
    code = row['stock_code']
    if code not in stocks_map:
        stocks_map[code] = row

stocks = list(stocks_map.values())

for s in stocks:
    s['aov_ratio_ma20'] = float(s.get('aov_ratio_ma20') or 0)
    s['vol_spike_ratio'] = float(s.get('vol_spike_ratio') or 0)
    s['composite_score'] = float(s.get('composite_score') or 0)
    s['smart_money_miliar'] = float(s.get('smart_money_miliar') or 0)
    s['retail_miliar'] = float(s.get('retail_miliar') or 0)
    s['insider_conviction'] = float(s.get('insider_conviction') or 0)
    s['return_5d'] = float(s.get('return_5d') or 0)
    s['return_20d'] = float(s.get('return_20d') or 0)
    s['change_percent'] = float(s.get('change_percent') or 0)

active_stocks = [s for s in stocks if s['is_currently_in']]

print(f"Total Unique Stocks in Excel: {len(stocks)}")
print(f"Total Currently Active in Pemantauan Khusus: {len(active_stocks)}")

# Anomaly scoring
def get_score(x):
    sc = 0
    if x['aov_ratio_ma20'] > 2.0: sc += 30
    elif x['aov_ratio_ma20'] > 1.3: sc += 15
    if x['vol_spike_ratio'] > 3.0: sc += 30
    elif x['vol_spike_ratio'] > 1.5: sc += 15
    if x['whale_signal']: sc += 25
    if x['big_player_anomaly']: sc += 25
    if x['smart_money_miliar'] > 10.0: sc += 30
    elif x['smart_money_miliar'] > 1.0: sc += 15
    if x['insider_conviction'] > 100: sc += 40
    elif x['insider_conviction'] > 10: sc += 20
    if x['smart_retail_divergence'] == 'DIVERGENT_BULLISH': sc += 25
    if x['composite_score'] >= 40: sc += 20
    return sc

for s in stocks:
    s['custom_anomaly_score'] = get_score(s)

sorted_active = sorted(active_stocks, key=lambda x: (x['custom_anomaly_score'], x['smart_money_miliar'], x['aov_ratio_ma20']), reverse=True)
sorted_all = sorted(stocks, key=lambda x: (x['custom_anomaly_score'], x['smart_money_miliar'], x['aov_ratio_ma20']), reverse=True)

print("\n" + "="*80)
print("TOP ANOMALIES DI SAHAM AKTIF PAPAN PEMANTAUAN KHUSUS (Status: Belum Keluar)")
print("="*80)
for s in sorted_active[:10]:
    print(f"[{s['stock_code']}] {s['company_name']}")
    print(f"   Harga: Rp {s['close']} ({s['change_percent']:+.2f}%) | Ret 20D: {s['return_20d']:+.2f}% | Comp Score: {s['composite_score']}")
    print(f"   AOV Ratio: {s['aov_ratio_ma20']:.2f}x | Vol Spike: {s['vol_spike_ratio']:.2f}x | Whale: {s['whale_signal']} | BigPlayer: {s['big_player_anomaly']}")
    print(f"   KSEI Smart Money: +Rp {s['smart_money_miliar']:.2f}M | Retail: {s['retail_miliar']:.2f}M | Divergence: {s['smart_retail_divergence']}")
    print(f"   Insider Conviction: {s['insider_conviction']} ({s['insider_signal']})")
    print(f"   Kriteria FCA: {s['criteria']} | Tgl Masuk: {s['entry_date']}")
    print("-" * 60)

print("\n" + "="*80)
print("TOP ANOMALIES DARI SELURUH LIST EXCEL (Termasuk Re-rating / Turnaround)")
print("="*80)
for s in sorted_all[:10]:
    status = "AKTIF DALAM PEMANTAUAN" if s['is_currently_in'] else f"Exited ({s['exit_date']})"
    print(f"[{s['stock_code']}] {s['company_name']}")
    print(f"   Harga: Rp {s['close']} ({s['change_percent']:+.2f}%) | Ret 20D: {s['return_20d']:+.2f}% | Comp Score: {s['composite_score']}")
    print(f"   AOV Ratio: {s['aov_ratio_ma20']:.2f}x | Vol Spike: {s['vol_spike_ratio']:.2f}x | Whale: {s['whale_signal']} | BigPlayer: {s['big_player_anomaly']}")
    print(f"   KSEI Smart Money: +Rp {s['smart_money_miliar']:.2f}M | Retail: {s['retail_miliar']:.2f}M | Divergence: {s['smart_retail_divergence']}")
    print(f"   Insider Conviction: {s['insider_conviction']} ({s['insider_signal']})")
    print(f"   Kriteria FCA: {s['criteria']} | Status: {status}")
    print("-" * 60)
