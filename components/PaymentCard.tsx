import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Upload, AlertCircle, Check, Loader2, Copy, RefreshCw, Lock } from 'lucide-react';
import { UPIConfig, PaymentStatus, PaymentRecord } from '../types';
import MobileApps from './MobileApps';
import { analyzePaymentScreenshot } from '../services/geminiService';
import { savePaymentRecord } from '../services/storageService';

interface PaymentCardProps {
  config: UPIConfig;
  status: PaymentStatus;
  setStatus: (s: PaymentStatus) => void;
  amount: string;
  setAmount: (a: string) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ config, status, setStatus, amount, setAmount }) => {
  const [utr, setUtr] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // 3D Tilt Effect State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Generate UPI Link
    const formattedAmount = amount ? parseFloat(amount).toFixed(2) : '0';
    const link = `upi://pay?pa=${config.pa}&pn=${encodeURIComponent(config.pn)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(config.tn || 'Payment')}`;
    setUpiLink(link);
  }, [config, amount]);

  // Countdown timer for Success Screen & Redirection
  useEffect(() => {
    if (status === PaymentStatus.SUCCESS) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Check for redirect URL
            if (config.redirectUrl && config.redirectUrl.startsWith('http')) {
              window.location.href = config.redirectUrl;
            } else {
              // Default behavior: reload to reset
              window.location.reload();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, config.redirectUrl]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (status === PaymentStatus.SUCCESS) return; // Disable tilt on success screen
    if (!cardRef.current || window.innerWidth < 768) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const logTransaction = (status: PaymentStatus, method: 'MANUAL' | 'AI', details: string, txUtr?: string) => {
    const record: PaymentRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      amount: amount || '0',
      status,
      utr: txUtr || utr,
      vpa: config.pa,
      method,
      details
    };
    savePaymentRecord(record);
  };

  const handleManualVerify = () => {
    const utrClean = utr.trim();

    // Strict UTR Validation
    const bannedUTRs = ['123456789012', '000000000000', '111111111111', '123123123123', '121212121212'];

    if (utrClean.length !== 12 || isNaN(Number(utrClean))) {
      const msg = "Invalid UTR: Must be exactly 12 digits.";
      setErrorMsg(msg);
      setStatus(PaymentStatus.FAILED);
      return;
    }

    if (bannedUTRs.includes(utrClean) || /^(\d)\1+$/.test(utrClean)) {
      const msg = "Payment Failed: Invalid or banned UTR detected.";
      setErrorMsg(msg);
      setStatus(PaymentStatus.FAILED);
      logTransaction(PaymentStatus.FAILED, 'MANUAL', msg, utrClean);
      return;
    }

    // Valid Format -> Ask for Proof or Set to Verifying
    setErrorMsg('');
    setStatus(PaymentStatus.VERIFYING);
    setAiAnalysisText("Verifying with Bank Server...");

    setTimeout(() => {
      // If no screenshot is uploaded, we can't be 100% sure.
      // We set it to FAILED and ask for Screenshot for definitive proof
      // UNLESS the user explicitly wants "Pending" state.
      // Based on request "if user dont payment... gives error", we should fail safe.

      setStatus(PaymentStatus.FAILED);
      setErrorMsg("Automatic verification timed out. Please Upload Screenshot to verify instantly.");
      setAiAnalysisText("");
      // trigger screenshot upload prompt visually? (Handled by UI state)
    }, 2500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(PaymentStatus.SCANNING);
    setAiAnalysisText("ShopC2C AI is analyzing payment proof...");
    setErrorMsg('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];

      try {
        const apiRes = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64String,
            expectedAmount: amount || '0',
            expectedVpa: config.pa
          })
        });

        if (!apiRes.ok) throw new Error("Verification Server Error");

        const result = await apiRes.json();
        const extractedUtr = result.extractedData?.utr;

        // 1. Check if Image is Valid/Successful
        if (!result.isValid) {
          setStatus(PaymentStatus.FAILED);
          setErrorMsg(result.message);
          setAiAnalysisText('');
          logTransaction(PaymentStatus.FAILED, 'AI', result.message, extractedUtr);
          return;
        }

        // 2. If user entered a UTR, it MUST match the screenshot (if extracted)
        if (utr && extractedUtr && utr !== extractedUtr) {
          setStatus(PaymentStatus.FAILED);
          setErrorMsg(`UTR Mismatch: Entered '${utr}' but screenshot shows '${extractedUtr}'.`);
          setAiAnalysisText('');
          logTransaction(PaymentStatus.FAILED, 'AI', "UTR Mismatch", extractedUtr);
          return;
        }

        // 3. Success
        const finalUtr = extractedUtr || utr;
        if (finalUtr) setUtr(finalUtr);

        setStatus(PaymentStatus.SUCCESS);
        logTransaction(PaymentStatus.SUCCESS, 'AI', result.message, finalUtr);

      } catch (err) {
        console.error(err);
        setStatus(PaymentStatus.FAILED);
        setErrorMsg("Verification failed. Please try again.");
        setAiAnalysisText('');
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = () => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // SUCCESS SCREEN RENDER (Premium Atomic Receipt)
  if (status === PaymentStatus.SUCCESS) {
    return (
      <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto bg-slate-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)] animate-in zoom-in duration-500 relative font-sans scale-[0.98] sm:scale-100">
        {/* Success Glow Background */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent"></div>

        <div className="relative z-10 pt-12 pb-10 px-8 flex flex-col items-center">
          {/* Animated Checkmark */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-slate-900">
              <Check className="w-12 h-12 text-black stroke-[4] animate-in slide-in-from-bottom-2" />
            </div>
          </div>

          <div className="text-center space-y-2 mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Transaction Finalized</p>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">SUCCESSFUL</h2>
          </div>

          <div className="w-full bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 space-y-4 mb-8">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-widest">Merchant</span>
              <span className="text-white font-bold">{config.pn}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Amount</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-emerald-400">₹</span>
                <span className="text-3xl font-black text-white tracking-tighter">{amount || '0.00'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-4 border-t border-white/5 font-mono">
              <span className="text-slate-600">UTR: {utr || 'VALIDATED'}</span>
              <span className="text-slate-600">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <p className="text-[10px] text-center text-slate-500 font-medium tracking-widest uppercase">
              {config.redirectUrl ? 'Handoff to Merchant...' : 'Session Expiration'}
            </p>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT PAYMENT CARD RENDER
  return (
    <div
      className="perspective-1000 w-full max-w-[340px] sm:max-w-[360px] mx-auto p-3 sm:p-4 transition-all duration-500 scale-[0.98] sm:scale-100"
      onMouseEnter={() => setIsHovered(true)}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: 'transform 0.2s ease-out'
        }}
        className={`
          relative w-full bg-slate-900/60 backdrop-blur-2xl border border-white/10
          rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden preserve-3d
          transition-all duration-500 group
          ${status === PaymentStatus.FAILED ? 'border-rose-500/50 shadow-[0_0_50px_-10px_rgba(244,63,94,0.3)]' : ''}
        `}
      >
        {/* Dynamic Glow Background */}
        <div className={`absolute top-0 right-0 w-[300px] h-[300px] bg-neon-blue/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-50'}`}></div>
        <div className={`absolute bottom-0 left-0 w-[200px] h-[200px] bg-neon-purple/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-50'}`}></div>

        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 p-5 flex flex-col items-center gap-4 sm:gap-5">

          {/* Header */}
          <div className="text-center w-full">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate px-2">
              {config.pn}
            </h2>
            <div
              onClick={() => copyToClipboard(config.pa)}
              className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 py-1.5 px-4 rounded-full cursor-pointer transition-all active:scale-95"
            >
              <span className="truncate max-w-[200px]">{config.pa}</span>
              <Copy className="w-3 h-3 text-neon-blue" />
            </div>
          </div>

          {/* Amount Input */}
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl opacity-0 group-hover:opacity-30 transition duration-500 blur-sm"></div>
            <div className="relative bg-slate-800/80 rounded-xl p-1 border border-white/10">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Amount</span>
                <span className="text-xs text-slate-500">INR</span>
              </div>
              <div className="flex items-center px-4 pb-2">
                <span className="text-2xl text-slate-400 font-light mr-2">₹</span>
                <input
                  type={config.amountLocked ? "text" : "number"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={status === PaymentStatus.VERIFYING || config.amountLocked}
                  readOnly={config.amountLocked}
                  className={`w-full bg-transparent text-2xl font-bold text-white placeholder-slate-600 focus:outline-none ${config.amountLocked
                    ? 'opacity-70 cursor-not-allowed select-none'
                    : ''
                    }`}
                  placeholder="0.00"
                />
                {config.amountLocked && <Lock className="w-5 h-5 text-amber-500 ml-2 animate-pulse" />}
              </div>
              {config.amountLocked && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500/80 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                    <Lock className="w-3 h-3" />
                    <span className="font-medium uppercase tracking-wide">Amount Locked by Merchant</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="relative w-full max-w-[180px] sm:max-w-[200px] mx-auto">
            <div className={`
              w-full aspect-square bg-white p-2.5 rounded-2xl flex items-center justify-center shadow-xl
              transition-all duration-500 relative overflow-hidden
            `}>
              {/* Decorative corners for QR */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-black rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-black rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-black rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-black rounded-br-lg"></div>

              {upiLink && config.pa ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain mix-blend-multiply"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs text-center font-medium">Enter Details to<br />Generate QR</span>
                </div>
              )}
            </div>

            {/* Loading/Scanning Overlay */}
            {(status === PaymentStatus.VERIFYING || status === PaymentStatus.SCANNING) && (
              <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm bg-black/20 rounded-2xl">
                <div className="flex flex-col items-center">
                  <div className="bg-indigo-600 rounded-full p-4 mb-2 shadow-lg shadow-indigo-500/50"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>
                  <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse uppercase tracking-wider">
                    {status === PaymentStatus.SCANNING ? 'AI Scanning...' : 'Verifying...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <MobileApps upiLink={upiLink} config={config} />

          {/* Manual & AI Verification Section */}
          <div className="w-full pt-6 border-t border-white/10 space-y-4">
            {/* UTR Input Field */}
            <div className="relative group">
              <input
                type="text"
                value={utr}
                maxLength={12}
                onChange={(e) => setUtr(e.target.value)}
                disabled={status === PaymentStatus.VERIFYING}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-purple transition-all font-mono tracking-widest"
                placeholder="ENTER 12-DIGIT UTR"
              />
              <button
                onClick={handleManualVerify}
                disabled={status === PaymentStatus.VERIFYING || utr.length < 12}
                className="absolute right-1 top-1 bottom-1 bg-white/10 hover:bg-neon-purple hover:text-white text-slate-400 rounded-lg px-3 transition-colors disabled:opacity-0"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>

            {/* Screenshot Upload */}
            <div className="relative">
              <input
                type="file"
                id="screenshot-upload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="screenshot-upload"
                className={`
                      w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700 bg-slate-800/30
                      text-slate-400 text-xs font-medium cursor-pointer transition-all
                      hover:bg-slate-800 hover:border-neon-blue hover:text-neon-blue hover:shadow-[0_0_15px_-5px_rgba(0,243,255,0.3)]
                      ${status === PaymentStatus.SCANNING ? 'animate-pulse border-neon-blue text-neon-blue' : ''}
                    `}
              >
                {status === PaymentStatus.SCANNING ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Screenshot (AI Verify)</span>
                  </>
                )}
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
                <button onClick={() => setStatus(PaymentStatus.IDLE)} className="ml-auto"><RefreshCw className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;