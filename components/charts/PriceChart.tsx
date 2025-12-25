
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, ISeriesApi, IChartApi } from 'lightweight-charts';

interface PriceChartProps {
  data: { time: string; open: number; high: number; low: number; close: number }[];
  symbol?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelBackgroundColor: '#3B82F6' },
        horzLine: { labelBackgroundColor: '#3B82F6' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // 🛡️ Indicator Layer (Visual Simulation)
    const sma20 = chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.5)', lineWidth: 1 });
    
    // Seed with mock trend data if empty
    const candles = data.length > 0 ? data : Array.from({ length: 60 }, (_, i) => {
      const base = 24000 + Math.sin(i / 10) * 500;
      return {
        time: (Math.floor(Date.now() / 1000) - (60 - i) * 60) as any,
        open: base, high: base + 50, low: base - 50, close: base + 10
      };
    });

    candlestickSeries.setData(candles as any);
    sma20.setData(candles.map(c => ({ time: c.time, value: (c.close as any) - 20 })));

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="relative w-full h-full group">
      <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sher-accent" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">EMA 20 Node</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Bullish Signal Node</span>
         </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default PriceChart;
