import React, { useState, useEffect } from 'react';
import { Database, Shield, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Key, Mail, Globe, Clock, Activity, HardDrive, LayoutDashboard, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../lib/apiConfig';

interface DiagnosticStatus {
    isConnected: boolean;
    status: 'healthy' | 'degraded' | 'offline';
    responseTime: number;
    stateText: string;
    envVars: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
        storageBucket: string;
    };
    details: {
        projectId: string;
        clientEmail: string;
        privateKeyPreview: string;
        storageBucket: string;
    };
    services?: {
        firestore: 'ONLINE' | 'OFFLINE';
        storage: 'ONLINE' | 'OFFLINE';
        auth: 'ONLINE' | 'OFFLINE';
    };
    dbType: string;
    error: string | null;
    timestamp: string;
    region: string;
}

const BaseBoard: React.FC = () => {
    const [status, setStatus] = useState<DiagnosticStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [countdown, setCountdown] = useState(30);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/status`);
            const data = await res.json();
            setStatus(data);
            setLastUpdated(new Date());
            setCountdown(30);
        } catch (e) {
            console.error("Failed to fetch status", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);

        const countdownInterval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 30));
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(countdownInterval);
        };
    }, []);

    const StatusCard = ({ title, value, icon: Icon, isOk }: any) => (
        <div className="relative group overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${isOk ? 'from-emerald-500/10 to-emerald-500/5' : 'from-rose-500/10 to-rose-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}></div>
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-xl relative transition-all duration-300 group-hover:translate-y-[-2px] group-hover:border-slate-700/50 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${isOk ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></span>
                        {isOk ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h4>
                    <p className={`text-xl font-bold tracking-tight ${isOk ? 'text-white' : 'text-rose-400'}`}>{value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-[#020617] text-white p-4 md:p-8 font-sans selection:bg-neon-blue selection:text-black pt-20 md:pt-24 lg:pt-32">
            {/* Background Grid & Scanlines */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-blue/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-purple/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-slate-800/50">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center">
                                <Database className="w-8 h-8 text-neon-blue animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white">
                                    NODE <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">BASE</span>
                                </h1>
                                <span className="px-2 py-0.5 rounded bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-[8px] md:text-[10px] font-black uppercase tracking-widest">v4.0 Edge</span>
                            </div>
                            <p className="text-slate-400 text-xs md:text-sm font-medium mt-1 flex items-center gap-2">
                                System Diagnostics & Infrastructure Integrity <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Refresh in {countdown}s</p>
                            <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-neon-blue transition-all duration-1000 ease-linear"
                                    style={{ width: `${(countdown / 30) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <button
                            onClick={fetchStatus}
                            disabled={loading}
                            className="group relative bg-slate-900 hover:bg-slate-800 border border-slate-800 px-6 py-3 rounded-xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 overflow-hidden shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-neon-blue" /> : <RefreshCw className="w-4 h-4 text-neon-blue group-hover:rotate-180 transition-transform duration-500" />}
                            <span className="text-xs font-black uppercase tracking-widest text-white">Trigger Scan</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Hero Status Card */}
                    <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 relative overflow-hidden group shadow-2xl backdrop-blur-md">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 rotate-12">
                            <Globe className="w-64 h-64" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="space-y-6">
                                <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${status?.status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                                    status?.status === 'degraded' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                                        'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                                    <div className={`w-2 h-2 rounded-full ${status?.status === 'healthy' ? 'bg-emerald-500' :
                                        status?.status === 'degraded' ? 'bg-amber-500' :
                                            'bg-rose-500'}`}></div>
                                    {status?.stateText || (loading ? 'Scanning Infrastructure...' : 'Offline')}
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                                        {status?.status === 'healthy' ? 'SYSTEM ONLINE' :
                                            status?.status === 'degraded' ? 'SYSTEM DEGRADED' : 'SYSTEM OFFLINE'}
                                    </h2>
                                    <p className="text-slate-400 max-w-xl text-sm md:text-lg font-medium leading-relaxed italic">
                                        "Connected to Firebase High-Availability Cluster at {status?.region || 'LOCAL'} node. Integrity is {status?.status === 'healthy' ? 'optimal' : 'compromised'}."
                                    </p>
                                </div>
                            </div>

                            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Latency', value: `${status?.responseTime || 0}ms`, icon: Activity, color: 'text-neon-blue' },
                                    { label: 'Layer', value: 'HTTP/3', icon: Globe, color: 'text-white' },
                                    { label: 'Cluster', value: 'Active', icon: Shield, color: 'text-white' },
                                    { label: 'Node', value: status?.region || 'LOCAL', icon: LayoutDashboard, color: 'text-emerald-400' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-black/30 rounded-2xl p-4 border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <stat.icon className="w-3 h-3 text-slate-500" />
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</span>
                                        </div>
                                        <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Services */}
                    <div className="lg:col-span-4 space-y-4">
                        <StatusCard
                            title="Firestore Status"
                            value={status?.services?.firestore === 'ONLINE' ? "Operational" : "Offline"}
                            icon={Database}
                            isOk={status?.services?.firestore === 'ONLINE'}
                        />
                        <StatusCard
                            title="Storage Sync"
                            value={status?.services?.storage === 'ONLINE' ? "Synchronized" : "Disconnected"}
                            icon={HardDrive}
                            isOk={status?.services?.storage === 'ONLINE'}
                        />
                        <StatusCard
                            title="Auth Authority"
                            value={status?.services?.auth === 'ONLINE' ? "Validated" : "Unauthorized"}
                            icon={Shield}
                            isOk={status?.services?.auth === 'ONLINE'}
                        />

                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 p-6 rounded-3xl shadow-xl backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <Shield className="w-16 h-16" />
                            </div>
                            <h4 className="text-xs font-black text-neon-blue uppercase tracking-widest mb-2">Health Coefficient</h4>
                            <div className="text-3xl font-black text-white mb-4">
                                {status?.status === 'healthy' ? '100%' : status?.status === 'degraded' ? '66%' : '0%'}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                                Infrastructure running on {status?.dbType || 'Firebase Admin SDK'}. Multi-region failover active.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Environment Validation Section (Lowered prominence but higher detail) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                        <div className="px-8 py-5 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-neon-blue/10">
                                    <Key className="w-4 h-4 text-neon-blue" />
                                </div>
                                Environment Variable Integrity Check
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secure Handshake</span>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Project ID', env: 'FIREBASE_PROJECT_ID', icon: Globe, state: status?.envVars?.projectId },
                                    { label: 'Client Email', env: 'FIREBASE_CLIENT_EMAIL', icon: Mail, state: status?.envVars?.clientEmail },
                                    { label: 'Private Key', env: 'FIREBASE_PRIVATE_KEY', icon: Key, state: status?.envVars?.privateKey },
                                    { label: 'Bucket URL', env: 'FIREBASE_STORAGE_BUCKET', icon: HardDrive, state: status?.envVars?.storageBucket }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 transition-all hover:bg-slate-950 group/item">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 rounded-xl bg-slate-900 text-slate-500 group-hover/item:text-neon-blue transition-colors">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            {item.state !== 'Missing' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className="text-xs font-mono text-slate-400 truncate">{item.env}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {status?.error && (
                                <div className="mt-8 p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start gap-5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                                        <AlertTriangle className="w-16 h-16 text-rose-500" />
                                    </div>
                                    <div className="relative z-10 p-3 rounded-2xl bg-rose-500/10 shrink-0">
                                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="font-black text-rose-500 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                            Infrastructure Critical Fail
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                        </h4>
                                        <div className="text-sm text-rose-300 font-mono leading-relaxed bg-black/40 p-4 rounded-xl border border-rose-500/10 max-h-48 overflow-y-auto custom-scrollbar">
                                            {status.error.split(' | ').map((err, i) => (
                                                <div key={i} className="mb-2 last:mb-0">
                                                    <span className="text-rose-500 mr-2 font-black">&gt;</span>
                                                    {err}
                                                    {err.includes('Identity Platform') && (
                                                        <div className="text-[10px] mt-1 text-sky-400 font-sans italic opacity-80">
                                                            Suggestion: Check Firebase Console &gt; Project Overview &gt; Authentication
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 opacity-50 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-slate-600" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Management v4.0.12-Release</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-600" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">SYNC CYCLE: 30s Delta</span>
                        </div>
                    </div>

                    <a href="/" className="group flex items-center gap-3 text-slate-500 hover:text-neon-blue transition-all text-[10px] font-black uppercase tracking-widest">
                        Terminal Return
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

            </div>
        </div>
    );
};

export default BaseBoard;
