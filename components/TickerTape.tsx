
import React from 'react';
import { MarketTick } from '../types';
import { TrendingUp, TrendingDown, Circle } from 'lucide-react';

interface TickerTapeProps {
  indices: { [key: string]: MarketTick };
}

const TickerItem: React.FC<{ tick: MarketTick }> = ({ tick }) => {
  const isPositive = tick.change >= 0;
  return (
    <div className="flex items-center gap-3 px-6 border-r border-gray-800/50 min-w-max">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-sher-muted tracking-wider uppercase">{tick.symbol}</span>
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
                {tick.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-sher-success' : 'text-sher-danger'}`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{tick.change.toFixed(2)} ({tick.changePercent.toFixed(2)}%)</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const TickerTape: React.FC<TickerTapeProps> = ({ indices }) => {
  return (
    <div className="h-12 bg-sher-card/50 border-b border-gray-800 flex items-center overflow-hidden relative">
      <div className="absolute left-0 h-full w-4 bg-gradient-to-r from-sher-card to-transparent z-10"></div>
      
      {/* Status Indicator */}
      <div className="flex items-center gap-2 px-4 border-r border-gray-800 bg-sher-card/80 z-20 h-full">
        <Circle size={8} className="fill-sher-success text-sher-success animate-pulse" />
        <span className="text-[10px] font-bold text-sher-muted uppercase">Live Market</span>
      </div>

      {/* Marquee Content */}
      <div className="flex animate-scroll whitespace-nowrap">
        {Object.values(indices).map((tick) => (
            <TickerItem key={tick.symbol} tick={tick} />
        ))}
        {/* Duplicate for seamless loop */}
        {Object.values(indices).map((tick) => (
            <TickerItem key={`${tick.symbol}-dup`} tick={tick} />
        ))}
        {Object.values(indices).map((tick) => (
            <TickerItem key={`${tick.symbol}-dup2`} tick={tick} />
        ))}
      </div>
       <div className="absolute right-0 h-full w-12 bg-gradient-to-l from-sher-card to-transparent z-10"></div>
    </div>
  );
};

export default TickerTape;
