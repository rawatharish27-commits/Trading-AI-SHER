import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  sector: string;
}

const MOCK_WATCHLIST: WatchlistItem[] = [
  { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', price: 2480.50, change: 12.50, changePercent: 0.51, volume: '2.4M', sector: 'Energy' },
  { id: '2', symbol: 'TCS', name: 'Tata Consultancy Svcs', price: 3890.00, change: -45.00, changePercent: -1.14, volume: '850K', sector: 'IT' },
  { id: '3', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1612.00, change: 8.00, changePercent: 0.50, volume: '5.1M', sector: 'Finance' },
  { id: '4', symbol: 'TATAMOTORS', name: 'Tata Motors', price: 810.25, change: 15.20, changePercent: 1.91, volume: '10M', sector: 'Auto' },
  { id: '5', symbol: 'ADANIENT', name: 'Adani Enterprises', price: 2400.00, change: -20.00, changePercent: -0.83, volume: '1.2M', sector: 'Metals' },
];

const WatchlistView: React.FC = () => {
  const [items, setItems] = useState<WatchlistItem[]>(MOCK_WATCHLIST);
  const [newSymbol, setNewSymbol] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    
    // Mock addition
    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      symbol: newSymbol.toUpperCase(),
      name: newSymbol.toUpperCase() + ' Ltd',
      price: 100.00,
      change: 0,
      changePercent: 0,
      volume: '0',
      sector: 'Unknown'
    };
    setItems([...items, newItem]);
    setNewSymbol('');
  };

  const handleRemove = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Market Watchlist</h2>
          <p className="text-sher-muted text-sm">Real-time tracking of potential opportunities.</p>
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-2">
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
                    onClick={() => handleRemove(item.id)}
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
