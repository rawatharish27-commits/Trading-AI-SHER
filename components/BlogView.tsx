
import React from 'react';
import { ViewState, BlogPost } from '../types';
import { BookOpen, Clock, ChevronRight, Zap, TrendingUp, BrainCircuit, Globe } from 'lucide-react';

const MOCK_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'ai-trading-in-india-2025',
    title: 'AI Trading in India: The 2025 Institutional Roadmap',
    excerpt: 'How neural market simulation and probabilistic sharding are reshaping the retail quant landscape in India.',
    content: '',
    author: 'SHER AI Labs',
    date: 'Jan 15, 2025',
    category: 'Institutional',
    readTime: '8 min'
  },
  {
    id: '2',
    slug: 'smart-money-orderflow-sharding',
    title: 'Detecting Smart Money via Depth Imbalance Sharding',
    excerpt: 'A deep dive into institutional order-flow analysis and how to detect high-fidelity accumulation zones.',
    content: '',
    author: 'Quant Node Alpha',
    date: 'Jan 12, 2025',
    category: 'Technical',
    readTime: '12 min'
  },
  {
    id: '3',
    slug: 'risk-first-capital-preservation',
    title: 'The Risk-First Philosophy: Protecting Capital in Volatile Regimes',
    excerpt: 'Why 1% account risk rule is the only edge that matters in the high-frequency era.',
    content: '',
    author: 'Ethics Guard',
    date: 'Jan 08, 2025',
    category: 'Risk',
    readTime: '6 min'
  }
];

interface BlogViewProps {
  onSelectPost: (post: BlogPost) => void;
}

const BlogView: React.FC<BlogViewProps> = ({ onSelectPost }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700 pt-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sher-accent/10 border border-sher-accent/20 text-[10px] font-black text-sher-accent uppercase tracking-widest">
           <Globe size={12} /> Institutional Intelligence Hub
        </div>
        <h1 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic">The <span className="text-sher-accent not-italic">Quant Blog.</span></h1>
        <p className="text-lg text-sher-muted max-w-2xl mx-auto font-medium leading-relaxed">
           Deep technical dives into neural architectures, market sharding, and institutional capital distribution logic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_POSTS.map((post, i) => (
          <div 
            key={post.id}
            onClick={() => onSelectPost(post)}
            className="bg-panel border border-border rounded-[40px] overflow-hidden group cursor-pointer hover:border-sher-accent/30 transition-all shadow-2xl flex flex-col"
          >
             <div className="h-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sher-accent/5 to-purple-500/5 group-hover:scale-110 transition-transform duration-700" />
                {post.category === 'Institutional' ? <Zap size={64} className="text-sher-accent opacity-20" /> : 
                 post.category === 'Technical' ? <BrainCircuit size={64} className="text-purple-400 opacity-20" /> :
                 <TrendingUp size={64} className="text-emerald-500 opacity-20" />}
                <span className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase text-white tracking-[0.2em] border border-white/5">{post.category}</span>
             </div>
             
             <div className="p-8 space-y-4 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-[9px] font-black text-sher-muted uppercase tracking-widest">
                   <span>{post.date}</span>
                   <div className="w-1 h-1 rounded-full bg-white/10" />
                   <span>{post.readTime} Read</span>
                </div>
                <h3 className="text-xl font-black text-white uppercase leading-tight tracking-tight group-hover:text-sher-accent transition-colors">{post.title}</h3>
                <p className="text-sm text-sher-muted font-medium leading-relaxed opacity-70">{post.excerpt}</p>
                
                <div className="pt-6 mt-auto border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-black text-[8px]">{post.author.slice(0,2)}</div>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">{post.author}</span>
                   </div>
                   <ChevronRight size={20} className="text-sher-muted group-hover:text-sher-accent group-hover:translate-x-1 transition-all" />
                </div>
             </div>
          </div>
        ))}
      </div>
      
      {/* Featured Insight */}
      <div className="bg-gradient-to-br from-panel to-slate-900 border border-sher-accent/20 rounded-[48px] p-12 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Zap size={240} className="text-sher-accent" /></div>
         <div className="relative z-10 max-w-2xl space-y-6">
            <span className="px-3 py-1 bg-sher-accent text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Editor's Choice</span>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Why Probabilistic Trading beats Algorithmic Hope.</h2>
            <p className="text-lg text-sher-muted leading-relaxed font-medium">
               Algorithms fail when market regimes shift. Probabilistic sharding allows the neural core to adjust weightings in real-time, preserving capital during high-entropy sessions.
            </p>
            <button className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95">
               Read Whitepaper
            </button>
         </div>
      </div>
    </div>
  );
};

export default BlogView;
