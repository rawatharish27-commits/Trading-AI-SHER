
import React from 'react';
import { Globe, ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, Landmark, Scale, Lock, Info } from 'lucide-react';
import { ComplianceRegion } from '../types';

const ComplianceMapView: React.FC = () => {
  const regions: ComplianceRegion[] = [
    { name: 'India', code: 'IN', status: 'COMPLIANT', notes: ['SEBI Circular 2022/23 Ready', 'CERT-In Data Residency Verified', 'No- PMS Status Confirmed'] },
    { name: 'European Union', code: 'EU', status: 'COMPLIANT', notes: ['GDPR Compliant', 'MIFID II Alignment Shard', 'Explicit Consent Node Active'] },
    { name: 'United States', code: 'US', status: 'WARNING', notes: ['FinCEN Mapping In-Progress', 'Civil Liability Shield Enabled', 'No Investment Advisory Shard'] }
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Globe size={180} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
            <Globe size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Global <span className="text-sher-accent not-italic">Compliance Map</span></h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 italic">Jurisdiction-Specific Strategy Gates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {regions.map(region => (
          <div key={region.code} className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl flex flex-col group hover:border-sher-accent/30 transition-all overflow-hidden relative">
             <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Landmark size={120} className="text-white" />
             </div>
             
             <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none italic">{region.name}</h3>
                   <p className="text-[9px] font-black text-sher-muted uppercase tracking-[0.2em] mt-2">Jurisdiction Code: {region.code}</p>
                </div>
                <div className={`p-3 rounded-2xl border ${region.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                   {region.status === 'COMPLIANT' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                </div>
             </div>

             <div className="flex-1 space-y-6 relative z-10">
                {region.notes.map((note, i) => (
                   <div key={i} className="flex gap-4 items-start border-l-2 border-white/5 pl-4 group-hover:border-sher-accent/30 transition-all">
                      <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-wider italic">"{note}"</p>
                   </div>
                ))}
             </div>

             <button className="mt-12 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-sher-accent transition-all flex items-center justify-center gap-2 group-hover:shadow-2xl">
                View Policy Shard <ChevronRight size={14} />
             </button>
          </div>
        ))}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-10 flex gap-8 items-start group">
         <Info size={32} className="text-amber-500 shrink-0 mt-1" />
         <div className="space-y-4">
            <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">Regulatory Isolation Shard</h4>
            <p className="text-sm text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-80">
               Sher AI dynamically adjusts its "Alpha Gates" based on the user's registered jurisdiction. Features like "Automated Execution" may be throttled or restricted to "Alert-Only" mode in regions with strict algorithmic-advisory laws to ensure the user remains the sole decision node.
            </p>
            <div className="pt-6 border-t border-amber-500/10 flex items-center justify-between">
               <div className="flex items-center gap-3 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                  <ShieldCheck size={14} /> COMPLIANCE VERSION: 4.2.0-STABLE
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ComplianceMapView;
