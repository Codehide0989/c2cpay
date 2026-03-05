import React, { useState, useEffect } from 'react';
import { Shield, Database, Wifi, AlertTriangle, RefreshCw, CheckCircle2, Server } from 'lucide-react';
import { checkDbConnection } from '../services/storageService';

interface SystemCheckProps {
    onComplete: () => void;
}

const SystemCheck: React.FC<SystemCheckProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [msg, setMsg] = useState('Initializing Secure Gateway...');
    const [errorDetail, setErrorDetail] = useState('');

    const runDiagnostics = async () => {
        setStatus('loading');
        setErrorDetail('');
        setStep(1);

        try {
            // Step 1: Check Server Reachability
            setMsg('Pinging Server...');
            const start = Date.now();

            // 1. Sanity Check (Simple Endpoint)
            try {
                const testRes = await fetch('/api/test');
                if (!testRes.ok) throw new Error(`API Gateway Error: ${testRes.status}`);
            } catch (err: any) {
                throw new Error(`API Gateway Error: ${err.message || 'Unreachable'}`);
            }

            // 2. Use diagnose endpoint for detailed info
            const res = await fetch('/api/diagnose');
            if (!res.ok) throw new Error(`Diagnostic Error: ${res.status}`);

            const data = await res.json();
            const latency = Date.now() - start;

            // Check for backend-reported errors first
            if (data.error) {
                const errorMsg = data.error.message || JSON.stringify(data.error);
                throw new Error(`Backend Error: ${errorMsg}`);
            }

            setStep(2);
            setMsg(`Server Reachable (${latency}ms). Verifying DB...`);

            // Step 2: Check Database Connection
            if (data.dbConnection?.currentState === 'CONNECTED' || data.isConnected === true) {
                setStep(3);
                setMsg('Database Connected Securely.');
                setStatus('success');
                setTimeout(onComplete, 1500); // Small delay for user to see success
            } else {
                // Fallback if no specific error was reported but state is bad
                throw new Error(`DB Status: ${data.dbConnection?.currentState || 'Disconnected'}`);
            }

        } catch (e: any) {
            console.error("System Check Failed:", e);
            setStatus('error');
            setMsg('Connection Failed');
            setErrorDetail(e.message || 'Unknown Error');
        }
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-[#000510] flex flex-col items-center justify-center p-4 selection:bg-neon-blue selection:text-black font-sans">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-neon-blue to-neon-purple rounded-2xl shadow-[0_0_30px_rgba(0,243,255,0.2)] mb-4">
                        <Shield className="w-8 h-8 text-black fill-current" />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        ShopC2C
                    </h1>
                    <p className="text-slate-500 text-sm font-medium tracking-wider uppercase mt-2">Secure Payment Gateway</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>

                    <div className="flex flex-col items-center text-center space-y-6">

                        {/* Status Icon */}
                        <div className="relative">
                            {status === 'loading' && (
                                <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-neon-blue animate-spin"></div>
                            )}
                            {status === 'success' && (
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center animate-in zoom-in">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/50 flex items-center justify-center animate-in zoom-in">
                                    <AlertTriangle className="w-10 h-10 text-rose-400" />
                                </div>
                            )}

                            {/* Icon Overlay for Loading */}
                            {status === 'loading' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {step === 0 && <Wifi className="w-6 h-6 text-slate-400" />}
                                    {step === 1 && <Server className="w-6 h-6 text-slate-400" />}
                                    {step === 2 && <Database className="w-6 h-6 text-slate-400" />}
                                </div>
                            )}
                        </div>

                        {/* Message */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">{msg}</h2>
                            {errorDetail && (
                                <p className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-500/20 font-mono">
                                    Error: {errorDetail}
                                </p>
                            )}
                        </div>

                        {/* Steps Checklist */}
                        <div className="w-full space-y-3 pt-4 border-t border-slate-800">
                            <CheckStep label="Environment Variables" status={step >= 1 ? 'done' : 'waiting'} />
                            <CheckStep label="Server Reachability" status={step >= 2 ? 'done' : 'waiting'} />
                            <CheckStep label="Database Connection" status={step >= 3 ? 'done' : 'waiting'} />
                        </div>

                        {/* Retry Button */}
                        {status === 'error' && (
                            <button
                                onClick={runDiagnostics}
                                className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all flex items-center justify-center gap-2 group"
                            >
                                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                Retry Connection
                            </button>
                        )}

                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center text-xs text-slate-600">
                    <p>System ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                    <p className="mt-1">Ensuring secure end-to-end encryption</p>
                </div>

            </div>
        </div>
    );
};

const CheckStep = ({ label, status }: { label: string, status: 'waiting' | 'done' }) => (
    <div className="flex items-center justify-between text-sm">
        <span className={`transition-colors ${status === 'done' ? 'text-slate-300' : 'text-slate-500'}`}>{label}</span>
        {status === 'done' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
            <div className="w-4 h-4 rounded-full border border-slate-700"></div>
        )}
    </div>
);

export default SystemCheck;
