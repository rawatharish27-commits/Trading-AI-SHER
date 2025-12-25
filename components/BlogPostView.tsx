
import React from 'react';
import { BlogPost } from '../types';
import { ArrowLeft, Clock, Calendar, User, Share2, Bookmark, CheckCircle2, Globe, Zap, ShieldCheck } from 'lucide-react';

interface BlogPostViewProps {
  post: BlogPost;
  onBack: () => void;
}

const BlogPostView: React.FC<BlogPostViewProps> = ({ post, onBack }) => {
  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700 pt-8 selection:bg-sher-accent/30">
      <header className="space-y-8">
        <button 
          onClick={onBack}
          className="group flex items-center gap-3 text-sher-muted hover:text-white transition-all bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Library</span>
        </button>

        <div className="space-y-4">
           <div className="flex items-center gap-3 text-[10px] font-black text-sher-accent uppercase tracking-widest">
              <span className="px-3 py-1 bg-sher-accent/10 border border-sher-accent/20 rounded-lg">{post.category}</span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-sher-muted flex items-center gap-1.5"><Clock size={12}/> {post.readTime} Reading Protocol</span>
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter italic">
              {post.title}
           </h1>
           <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-xs border border-white/10">SR</div>
                 <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{post.author}</p>
                    <p className="text-[8px] text-sher-muted uppercase font-bold">Master Node Core</p>
                 </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                 <Calendar size={14} className="text-sher-muted" />
                 <span className="text-[10px] font-black text-sher-muted uppercase">{post.date}</span>
              </div>
           </div>
        </div>
      </header>

      {/* Hero Visual Node */}
      <div className="aspect-video bg-panel border-2 border-border rounded-[48px] shadow-2xl relative overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 bg-gradient-to-br from-sher-accent/10 to-purple-600/10" />
         <Globe size={180} className="text-white opacity-5 animate-pulse" />
         <div className="relative z-10 text-center space-y-4">
            <Zap size={80} className="text-sher-accent mx-auto" fill="currentColor" />
            <p className="text-[10px] font-black text-sher-muted uppercase tracking-[0.4em]">ALPHA CORE INFRASTRUCTURE</p>
         </div>
      </div>

      {/* Content Shards */}
      <div className="prose prose-invert prose-sher max-w-none space-y-8">
         <p className="text-xl text-gray-300 leading-relaxed font-medium first-letter:text-5xl first-letter:font-black first-letter:text-sher-accent first-letter:mr-2 first-letter:float-left uppercase tracking-tight">
            The evolution of trading intelligence has moved beyond static rules. Institutional quants now leverage ensemble neural sharding to ensure capital preservation across diverse market topology. 
         </p>
         
         <div className="space-y-6">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic border-l-4 border-sher-accent pl-6 py-2">01. The Neural Shift</h2>
            <p className="text-base text-sher-muted leading-loose font-medium">
               Static indicators like RSI or MACD often lag in high-frequency environments. Our approach uses Gemini 3 Pro reasoning to validate these technical triggers against order-flow depth. If the "Smart Money" isn't moving with the signal, the node enters a standby state.
            </p>
         </div>

         <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
               <ShieldCheck size={20} className="text-emerald-500" /> Executive Summary of Node Logic
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[
                 'Real-time Market Entropy Reduction',
                 'Probabilistic Path Calibration',
                 'Institutional Liquidity Discovery',
                 'Automated Capital Guardrails'
               ].map(point => (
                 <div key={point} className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{point}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-6">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic border-l-4 border-sher-accent pl-6 py-2">02. Distributed Sharding</h2>
            <p className="text-base text-sher-muted leading-loose font-medium">
               By sharding execution across multiple account nodes, we ensure zero market impact. This allows for larger capital distribution without triggering the very institutional traps we scan for. Each node acts as an independent execution unit, governed by the Master Brain's risk matrix.
            </p>
         </div>
      </div>

      <footer className="pt-12 mt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase text-sher-muted hover:text-white transition-all">
               <Share2 size={14} /> Distribute Alpha
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase text-sher-muted hover:text-white transition-all">
               <Bookmark size={14} /> Vault Article
            </button>
         </div>
         <div className="flex items-center gap-3">
            <div className="text-right">
               <p className="text-[8px] font-black text-sher-muted uppercase">Verified By</p>
               <p className="text-[10px] font-black text-white uppercase tracking-widest">SHER COMPLIANCE CORE</p>
            </div>
            <ShieldCheck size={28} className="text-emerald-500" />
         </div>
      </footer>
      
      <style>{`
        .prose-sher p {
            letter-spacing: -0.01em;
        }
      `}</style>
    </article>
  );
};

export default BlogPostView;
