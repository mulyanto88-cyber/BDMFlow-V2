"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  foreign?: number;
  vwma?: number;
  whale?: boolean;
  signal?: string;
  compositeScore?: number;
}

interface StockChartProps {
  data: OHLCVData[];
  height?: number;
}

const SIGNAL_COLORS: Record<string, string> = {
  STRONG_BUY: "#16a34a",
  BUY: "#22c55e",
  ACCUMULATE: "#84cc16",
  DISTRIBUTION: "#ef4444",
};

export function StockChart({ data, height = 500 }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e1e2e" },
        horzLines: { color: "#1e1e2e" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#3b82f6", style: 2, width: 1, labelBackgroundColor: "#3b82f6" },
        horzLine: { color: "#3b82f6", style: 2, width: 1, labelBackgroundColor: "#3b82f6" },
      },
      rightPriceScale: {
        borderColor: "#1e1e2e",
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "#1e1e2e",
        timeVisible: false,
      },
      width: container.clientWidth,
      height,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const vwmaSeries = chart.addLineSeries({
      color: "#eab308",
      lineWidth: 1,
      lineStyle: 2,
      priceFormat: { type: "price" },
    });

    const foreignSeries = chart.addHistogramSeries({
      color: "#22c55e80",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      visible: false,
    });

    const candles: any[] = [];
    const vwmas: any[] = [];
    const foreigns: any[] = [];

    const sorted = [...data].sort((a, b) => a.time.localeCompare(b.time));

    for (const d of sorted) {
      const t = d.time.replace(/-/g, "/");
      candles.push({
        time: t,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      });

      if (d.vwma && d.vwma > 0) {
        vwmas.push({ time: t, value: d.vwma });
      }

      if (d.foreign !== undefined) {
        foreigns.push({
          time: t,
          value: d.foreign,
          color: d.foreign >= 0 ? "#22c55e60" : "#ef444460",
        });
      }
    }

    candleSeries.setData(candles);
    if (vwmas.length > 0) vwmaSeries.setData(vwmas);
    if (foreigns.length > 0) foreignSeries.setData(foreigns);

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };

    window.addEventListener("resize", handleResize);

    chartRef.current = chart;

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, height]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    />
  );
}
