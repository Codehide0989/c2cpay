import React from 'react';
import { Settings, Shield, AlertTriangle, Clock, RefreshCcw, ServerCog, Activity, Zap, Lock } from 'lucide-react';

interface MaintenanceViewProps {
    message?: string;
    endTime?: number | null;
    onAdminClick: () => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ message, endTime, onAdminClick }) => {
    const [timeLeft, setTimeLeft] = React.useState<string>("");

    React.useEffect(() => {
        if (!endTime) {
            setTimeLeft("");
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft("00:00");
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(interval);
    }, [endTime]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-6 animate-in fade-in duration-1000">
            <div className="relative w-full max-w-lg">
                {/* Orbital Rings - Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square border border-white/5 rounded-full pointer-events-none opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square border border-white/5 rounded-full pointer-events-none opacity-10 animate-spin-slow"></div>

                <div className="relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-[0_0_100px_-20px_rgba(0,243,255,0.1)] overflow-hidden">
                    {/* Interior Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/5 via-transparent to-neon-purple/5 opacity-50"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Terminal Icon Hub */}
                        <div className="relative mb-12">
                            <div className="absolute inset-0 bg-neon-blue rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative w-28 h-28 bg-slate-950 border border-white/10 rounded-3xl flex items-center justify-center shadow-inner group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <ServerCog className="w-14 h-14 text-neon-blue group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Text Architecture */}
                        <div className="text-center space-y-6 mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-[10px] font-black uppercase tracking-[0.3em] text-neon-blue">
                                <Activity className="w-3 h-3" /> System Calibrating
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic">
                                MAINTENANCE
                            </h2>
                            <p className="text-slate-400 text-sm md:text-lg font-medium leading-relaxed max-w-sm mx-auto opacity-70">
                                {message || "Optimizing infrastructure for high-velocity transaction processing."}
                            </p>
                        </div>

                        {/* Metric Components */}
                        <div className="grid grid-cols-2 gap-4 w-full mb-10">
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col items-center gap-3 group hover:bg-white/5 transition-all">
                                <Clock className="w-6 h-6 text-neon-purple animate-pulse" />
                                <div className="text-center">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Eta</span>
                                    <span className="text-xl font-bold text-white font-mono tracking-wider">{timeLeft || "10:00"}</span>
                                </div>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col items-center gap-3 group hover:bg-white/5 transition-all">
                                <RefreshCcw className="w-6 h-6 text-neon-blue animate-spin-slow" />
                                <div className="text-center">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">State</span>
                                    <span className="text-xl font-bold text-white uppercase tracking-tighter italic">Syncing</span>
                                </div>
                            </div>
                        </div>

                        {/* Protocol Activation */}
                        <div className="w-full space-y-6">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-5 bg-white text-black text-sm font-black rounded-2xl hover:bg-neon-blue hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 group uppercase tracking-[0.25em]"
                            >
                                <Zap className="w-5 h-5 fill-current" />
                                Re-sync Handshake
                            </button>

                            <button
                                onClick={onAdminClick}
                                className="group w-full flex items-center justify-center gap-2 text-[10px] text-slate-600 hover:text-white transition-all uppercase tracking-[0.4em] font-black pt-2"
                            >
                                <Lock className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Stealth Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceView;
