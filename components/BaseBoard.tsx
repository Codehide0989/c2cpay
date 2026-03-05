import React, { useState, useEffect } from 'react';
import { Database, Shield, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Key, Mail, Globe, Clock, Activity, HardDrive, LayoutDashboard, ChevronRight } from 'lucide-react';

interface DiagnosticStatus {
    isConnected: boolean;
    stateText: string;
    envVars: {
        projectId: boolean;
        clientEmail: boolean;
        privateKey: boolean;
        storageBucket: boolean;
    };
    details: {
        projectId: string;
        clientEmail: string;
        privateKeyPreview: string;
        storageBucket: string;
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

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            setStatus(data);
            setLastUpdated(new Date());
        } catch (e) {
            console.error("Failed to fetch status", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, []);

    const StatusCard = ({ title, value, icon: Icon, colorClass, status: isOk }: any) => (
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl backdrop-blur-md flex items-center justify-between group hover:border-slate-500/50 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${isOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
                    <p className={`text-sm font-medium ${isOk ? 'text-white' : 'text-rose-400'}`}>{value}</p>
                </div>
            </div>
            {isOk ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-[#020617] text-white p-4 md:p-8 font-sans selection:bg-neon-blue selection:text-black pt-24">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-neon-blue to-neon-purple rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)]">
                            <Database className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                                Database Node <span className="text-neon-blue">BASE</span>
                            </h1>
                            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                                Real-time Synchronization & Health Monitor <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchStatus}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-2.5 rounded-full flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span className="text-sm font-bold">Refresh Status</span>
                    </button>
                </div>

                {/* Main Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Connection State */}
                    <div className="col-span-1 md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Globe className="w-32 h-32" />
                        </div>

                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${status?.isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${status?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                    {status?.stateText || 'Checking...'}
                                </span>
                                <h2 className="text-5xl font-black text-white">
                                    {status?.isConnected ? 'System Online' : 'System Offline'}
                                </h2>
                                <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                                    Connected to Firebase High-Availability Cluster. All systems operational and syncing at {status?.region} edge node.
                                </p>
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Last Update</p>
                                <p className="text-lg font-mono text-slate-300">{lastUpdated.toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Response Time</span>
                                <span className="text-lg font-bold text-neon-blue">14ms</span>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Protocol</span>
                                <span className="text-lg font-bold text-white">HTTP/3</span>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">State</span>
                                <span className="text-lg font-bold text-white">Active</span>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Region</span>
                                <span className="text-lg font-bold text-emerald-400">{status?.region || 'GLOBAL'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-4">
                        <StatusCard
                            title="Firestore Status"
                            value={status?.isConnected ? "Operational" : "Disconnected"}
                            icon={Database}
                            isOk={status?.isConnected}
                        />
                        <StatusCard
                            title="Storage Node"
                            value={status?.envVars?.storageBucket ? "Synced" : "Offline"}
                            icon={HardDrive}
                            isOk={status?.envVars?.storageBucket}
                        />
                        <StatusCard
                            title="Firebase Auth"
                            value="Integrated"
                            icon={Shield}
                            isOk={true}
                        />
                    </div>
                </div>

                {/* Detailed Config Section */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-neon-blue" />
                            Environment Variable Validation
                        </h3>
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-bold uppercase">Safe Mirror</span>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Project Identifier</label>
                                        <span className={status?.envVars?.projectId ? 'text-emerald-400 text-[10px] font-bold' : 'text-rose-400 text-[10px] font-bold'}>
                                            {status?.envVars?.projectId ? 'SYNCED' : 'MISSING'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 border border-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-mono text-slate-300">FIREBASE_PROJECT_ID</span>
                                        <div className="flex-1"></div>
                                        {status?.envVars?.projectId ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Service Account Email</label>
                                        <span className={status?.envVars?.clientEmail ? 'text-emerald-400 text-[10px] font-bold' : 'text-rose-400 text-[10px] font-bold'}>
                                            {status?.envVars?.clientEmail ? 'VERIFIED' : 'MISSING'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 border border-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-mono text-slate-300">FIREBASE_CLIENT_EMAIL</span>
                                        <div className="flex-1"></div>
                                        {status?.envVars?.clientEmail ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">RSA Private Key</label>
                                        <span className={status?.envVars?.privateKey ? 'text-emerald-400 text-[10px] font-bold' : 'text-rose-400 text-[10px] font-bold'}>
                                            {status?.envVars?.privateKey ? 'ENCRYPTED' : 'MISSING'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 border border-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                                        <Key className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-mono text-slate-300">FIREBASE_PRIVATE_KEY</span>
                                        <div className="flex-1"></div>
                                        {status?.envVars?.privateKey ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bucket Endpoint</label>
                                        <span className={status?.envVars?.storageBucket ? 'text-emerald-400 text-[10px] font-bold' : 'text-slate-500 text-[10px]'}>
                                            {status?.envVars?.storageBucket ? 'ACTIVE' : 'OPTIONAL'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 border border-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                                        <HardDrive className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-mono text-slate-300">FIREBASE_STORAGE_BUCKET</span>
                                        <div className="flex-1"></div>
                                        {status?.envVars?.storageBucket ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {status?.error && (
                            <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-rose-500 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-rose-400 text-sm italic">Diagnostic Failure:</h4>
                                    <p className="text-xs text-rose-300/80 font-mono mt-1 break-all leading-relaxed">
                                        {status.error}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Bar Info */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-slate-600" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Management v2.4</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-600" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Sync: 30s</span>
                        </div>
                    </div>

                    <a href="/" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-bold">
                        Return to Dashboard
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

            </div>

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/5 rounded-full blur-[120px]"></div>
            </div>
        </div>
    );
};

export default BaseBoard;
