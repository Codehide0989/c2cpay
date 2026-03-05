import React from 'react';
import { Copy, Code, Globe, Check } from 'lucide-react';

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
<!-- ShopC2C Payment Button -->
<a href="${exampleLink}" 
   target="_blank" 
   style="background: #00f3ff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: sans-serif;">
   Pay Now with UPI
</a>`.trim();

  const apiCurl = `
curl -X POST ${baseUrl}api/payment \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY_HERE" \\
  -d '{
    "amount": "100",
    "vpa": "customer@upi",
    "details": "Order #123"
  }'`.trim();

  return (
    <div className="space-y-6 text-slate-300">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="flex items-center gap-2 text-blue-400 font-bold mb-2">
          <Globe className="w-4 h-4" />
          Quick Integration
        </h4>
        <p className="text-sm text-slate-400">
          You can integrate ShopC2C into any website by simply linking to this page with specific URL parameters.
          For backend integration, generate an API Key.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">API Endpoint / Base URL</label>
        <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/10 font-mono text-sm text-neon-blue">
          <span className="truncate">{baseUrl}</span>
          <button onClick={() => copyToClipboard(baseUrl, 'url')} className="ml-auto hover:text-white">
            {copied === 'url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* API Key Header Info */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
        <label className="text-xs font-bold uppercase tracking-wider text-neon-purple flex items-center gap-2 mb-2">
          <Code className="w-3 h-3" /> API Integration (Backend)
        </label>
        <p className="text-xs text-slate-400 mb-2">
          Include your API Key in the header <code>x-api-key</code> for all POST requests.
        </p>
        <div className="relative group">
          <pre className="bg-black/50 p-3 rounded border border-white/5 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
            {apiCurl}
          </pre>
          <button onClick={() => copyToClipboard(apiCurl, 'curl')} className="absolute top-2 right-2 text-slate-500 hover:text-white">
            {copied === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">URL Parameters (Frontend)</label>
        <div className="grid gap-2 text-sm">
          <div className="grid grid-cols-12 items-center bg-white/5 p-2 rounded border border-white/5">
            <span className="col-span-3 text-neon-purple font-mono">pa</span>
            <span className="col-span-9 text-slate-400">Merchant UPI ID (e.g. merchant@upi)</span>
          </div>
          <div className="grid grid-cols-12 items-center bg-white/5 p-2 rounded border border-white/5">
            <span className="col-span-3 text-neon-purple font-mono">pn</span>
            <span className="col-span-9 text-slate-400">Merchant Name (displayed on receipt)</span>
          </div>
          <div className="grid grid-cols-12 items-center bg-white/5 p-2 rounded border border-white/5">
            <span className="col-span-3 text-neon-purple font-mono">am</span>
            <span className="col-span-9 text-slate-400">Amount (optional, locks amount if 'locked=true')</span>
          </div>
          <div className="grid grid-cols-12 items-center bg-white/5 p-2 rounded border border-white/5">
            <span className="col-span-3 text-neon-purple font-mono">tn</span>
            <span className="col-span-9 text-slate-400">Transaction Note (e.g. Order #123)</span>
          </div>
          <div className="grid grid-cols-12 items-center bg-white/5 p-2 rounded border border-white/5">
            <span className="col-span-3 text-neon-purple font-mono">redirect_url</span>
            <span className="col-span-9 text-slate-400">URL to redirect to after successful payment</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Code className="w-3 h-3" />
          HTML Embed Code (Frontend Button)
        </label>
        <div className="relative group">
          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
            {htmlCode}
          </pre>
          <button
            onClick={() => copyToClipboard(htmlCode, 'code')}
            className="absolute top-2 right-2 p-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors"
          >
            {copied === 'code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDocs;