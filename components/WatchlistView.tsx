
import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { WatchlistItem } from '../types';

interface WatchlistViewProps {
  items: WatchlistItem[];
  onAdd: (symbol: string) => void;
  onRemove: (id: string) => void;
}

const WatchlistView: React.FC<WatchlistViewProps> = ({ items, onAdd, onRemove }) => {
  const [newSymbol, setNewSymbol] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    onAdd(newSymbol);
    setNewSymbol('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Market Watchlist</h2>
          <p className="text-sher-muted text-sm">Real-time tracking of potential opportunities.</p>
        </div>
        
        <form onSubmit={handleAddSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add Symbol (e.g. INFY)"
            className="bg-sher-card border border-gray-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-sher-accent w-48"
          />
          <button type="submit" className="bg-sher-accent hover:bg-blue-600 text-white rounded-lg p-2 transition-colors">
            <Plus size={20} />
          </button>
        </form>
      </div>

      <div className="bg-sher-card border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-sher-muted text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Instrument</th>
              <th className="px-6 py-4">Sector</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Change</th>
              <th className="px-6 py-4 text-right">Volume</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{item.symbol}</span>
                    <span className="text-xs text-sher-muted">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-gray-700">
                    {item.sector}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-white">
                  ₹{item.price.toFixed(2)}
                </td>
                <td className={`px-6 py-4 text-right font-medium ${item.changePercent >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {item.changePercent >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                    {item.changePercent.toFixed(2)}%
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sher-muted text-sm">
                  {item.volume}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="text-gray-600 hover:text-sher-danger transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sher-muted">
                        No symbols in watchlist. Add one to start tracking.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WatchlistView;
