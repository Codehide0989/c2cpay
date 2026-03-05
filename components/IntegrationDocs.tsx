import React from 'react';
import { Copy, Code, Globe, Check, Zap } from 'lucide-react';

interface IntegrationDocsProps {
  baseUrl: string;
  exampleLink: string;
}

const IntegrationDocs: React.FC<IntegrationDocsProps> = ({ baseUrl, exampleLink }) => {
  const [copied, setCopied] = React.useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const htmlCode = `
<!-- ShopC2C Atomic Payment Button -->
<a href="${exampleLink}" 
   target="_blank" 
   style="background: linear-gradient(to right, #00f3ff, #d946ef); color: #000; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 900; font-family: 'Outfit', sans-serif; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 4px 15px rgba(0, 243, 255, 0.3);">
   SECURE UPI PAY
</a>`.trim();

  const apiCurl = `
# Backend Verification API
curl -X POST ${baseUrl}api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageBase64": "IMAGE_DATA_HERE",
    "expectedAmount": "100",
    "expectedVpa": "merchant@upi"
  }'`.trim();

  return (
    <div className="space-y-8 text-slate-400">
      <div className="bg-neon-blue/5 border border-neon-blue/20 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Globe className="w-16 h-16 text-neon-blue" />
        </div>
        <h4 className="flex items-center gap-3 text-neon-blue font-black uppercase tracking-[0.2em] text-sm mb-3">
          <Globe className="w-5 h-5" />
          Neural Link Integration
        </h4>
        <p className="text-sm leading-relaxed max-w-md">
          Integrate ShopC2C into any decentralized or legacy platform using atomic URL parameters or our high-performance verification API.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Universal Base Endpoint</label>
        <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-white/5 font-mono text-sm text-white group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="truncate flex-1 font-bold">{baseUrl}</span>
          <button
            onClick={() => copyToClipboard(baseUrl, 'url')}
            className="p-2 bg-white/5 hover:bg-neon-blue hover:text-black rounded-lg transition-all"
          >
            {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-purple flex items-center gap-2">
            <Code className="w-3.5 h-3.5" /> Core API Protocol
          </label>
          <span className="text-[9px] font-mono text-slate-600">v4.0.0-PROTOTYPE</span>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
          <pre className="relative bg-black/60 p-5 rounded-2xl border border-white/5 text-[11px] font-mono text-indigo-300 overflow-x-auto custom-scrollbar">
            {apiCurl}
          </pre>
          <button
            onClick={() => copyToClipboard(apiCurl, 'curl')}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-neon-purple hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            {copied === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Atomic Param Map</label>
        <div className="grid gap-3 font-mono text-[10px]">
          {[
            { key: 'pa', val: 'Merchant UPI ID Target' },
            { key: 'pn', val: 'Merchant Display Identifier' },
            { key: 'am', val: 'Transaction Quantum (Amount)' },
            { key: 'tn', val: 'Entropy String (Note/UTR)' },
            { key: 'redirect_url', val: 'Post-Success Handoff URL' }
          ].map(p => (
            <div key={p.key} className="flex items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
              <span className="w-24 text-neon-blue font-black uppercase tracking-widest">{p.key}</span>
              <span className="text-slate-500 group-hover:text-slate-300 transition-colors">{p.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 ml-1 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" /> High-Intensity Embed
        </label>
        <div className="relative group">
          <pre className="bg-[#020617] p-6 rounded-2xl border border-emerald-500/10 text-[11px] font-mono text-emerald-300 overflow-x-auto min-h-[140px] flex items-center">
            {htmlCode}
          </pre>
          <button
            onClick={() => copyToClipboard(htmlCode, 'code')}
            className="absolute top-4 right-4 p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded-xl transition-all shadow-lg"
          >
            {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDocs;