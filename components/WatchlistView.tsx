
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, X, Activity, Globe } from 'lucide-react';
import { WatchlistItem } from '../types';
import { scripMasterService, ScripMasterItem } from '../lib/services/scripMasterService';

interface WatchlistViewProps {
  items: WatchlistItem[];
  onAdd: (symbol: string) => void;
  onRemove: (id: string) => void;
  onSelect?: (symbol: string) => void;
}

const WatchlistView: React.FC<WatchlistViewProps> = ({ items, onAdd, onRemove, onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ScripMasterItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      const results = scripMasterService.search(query, 8);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = (item: ScripMasterItem) => {
    // Logic to add scrip to local watchlist state
    // In real app, we send the token to the hook
    onAdd(item.symbol.split('-')[0]); 
    setQuery('');
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Asset Watchlist</h2>
          <p className="text-sher-muted text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Neural Node Monitoring</p>
        </div>
        
        <div className="relative w-full md:w-80" ref={containerRef}>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sher-muted group-focus-within:text-sher-accent transition-colors" size={18} />
            <input 
              type="text" 
              value={query}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Scrips (NSE/BSE)..."
              className="w-full bg-slate-900 border border-border text-white text-xs font-black uppercase tracking-widest rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-sher-accent transition-all placeholder:text-slate-800"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-sher-muted hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          {isFocused && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-panel border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-2">
              <div className="p-2 border-b border-border bg-slate-900/50 flex justify-between items-center px-4">
                 <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Master Instrument Nodes</p>
                 <Globe size={10} className="text-sher-accent animate-pulse" />
              </div>
              {suggestions.map(s => (
                <button 
                  key={s.token}
                  onClick={() => handleAdd(s)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-sher-accent/10 text-left transition-colors group"
                >
                  <div>
                    <span className="text-sm font-black text-white group-hover:text-sher-accent">{s.symbol}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-[8px] text-sher-muted uppercase font-bold">{s.name}</p>
                       <span className="text-[7px] font-black bg-slate-800 text-slate-500 px-1.5 rounded">{s.exch_seg}</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-slate-800 rounded-lg text-sher-muted group-hover:text-sher-accent">
                    <Plus size={14} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-panel border border-border rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-sher-muted text-[10px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Node Identity</th>
                <th className="px-8 py-5">Sector Unit</th>
                <th className="px-8 py-5 text-right">LTP Node</th>
                <th className="px-8 py-5 text-right">Session Delta</th>
                <th className="px-8 py-5 text-right">Liquidity</th>
                <th className="px-8 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-white/5 transition-all group cursor-pointer"
                  onClick={() => onSelect?.(item.symbol)}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-8 rounded-full bg-sher-accent group-hover:shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all" />
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white group-hover:text-sher-accent transition-colors">{item.symbol}</span>
                        <span className="text-[10px] text-sher-muted font-bold uppercase truncate max-w-[120px]">{item.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">
                      {item.sector}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-white tabular-nums">
                    ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-8 py-5 text-right font-black tabular-nums ${item.changePercent >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
                    <div className="flex items-center justify-end gap-1.5">
                      {item.changePercent >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                      {item.changePercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right text-sher-muted text-[10px] font-black uppercase tracking-tighter">
                    {item.volume} Units
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                      className="text-slate-700 hover:text-sher-danger transition-all p-2 rounded-xl hover:bg-sher-danger/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                            <Activity size={48} className="text-sher-muted animate-pulse" />
                            <p className="text-xs font-black text-sher-muted uppercase tracking-[0.3em]">Watchlist Empty. Scan to Initialize.</p>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WatchlistView;
