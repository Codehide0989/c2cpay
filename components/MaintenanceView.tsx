import React from 'react';
import { Settings, Shield, AlertTriangle, Clock, RefreshCcw, ServerCog } from 'lucide-react';

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
                setTimeLeft("Finishing up...");
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(interval);
    }, [endTime]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 animate-in fade-in duration-700 w-full px-6">
            <div className="relative w-full max-w-md lg:max-w-lg transition-all duration-500">
                {/* Background glow effects - Even more subtle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-neon-blue/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent"></div>

                    <div className="relative z-10 flex flex-col items-center space-y-8">
                        {/* Icon Container - Pulsing gently */}
                        <div className="relative">
                            <div className="relative w-24 h-24 bg-black/40 border border-white/5 rounded-3xl flex items-center justify-center shadow-inner group transition-transform hover:scale-105 duration-500">
                                <ServerCog className="w-12 h-12 text-neon-blue/80 group-hover:text-neon-blue transition-colors duration-500" />
                                <div className="absolute -top-1 -right-1 bg-rose-500 rounded-full p-1.5 border border-rose-400/20 animate-pulse">
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 w-full">
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                System Update
                            </h2>
                            <div className="h-1 w-20 bg-neon-blue/40 mx-auto rounded-full"></div>
                        </div>

                        <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-sm mx-auto">
                            {message || "We're currently refining our gateway for a better experience. We'll be back shortly."}
                        </p>

                        {/* Status Grid - Compact */}
                        <div className="grid grid-cols-2 gap-4 w-full pt-4">
                            <div className="p-4 bg-white/[0.03] border border-white/[0.03] rounded-2xl flex flex-col items-center gap-2 transition-all hover:bg-white/[0.05] hover:border-white/10 group">
                                <Clock className="w-5 h-5 text-neon-purple opacity-70 group-hover:scale-110 transition-transform" />
                                <span className="text-xs text-white font-bold uppercase tracking-wider">{timeLeft || "~10 Mins"}</span>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/[0.03] rounded-2xl flex flex-col items-center gap-2 transition-all hover:bg-white/[0.05] hover:border-white/10 group">
                                <RefreshCcw className="w-5 h-5 text-neon-blue opacity-70 group-hover:rotate-180 transition-transform duration-700" />
                                <span className="text-xs text-white font-bold uppercase tracking-wider">Syncing</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-6 w-full space-y-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-white text-black text-base font-black rounded-2xl hover:bg-neon-blue hover:text-white transition-all shadow-xl active:scale-[0.97] flex items-center justify-center gap-3 group"
                            >
                                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                Check for Updates
                            </button>

                            {/* Subtle Admin Access */}
                            <button
                                onClick={onAdminClick}
                                className="text-xs text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest font-bold pt-2 px-4 py-2"
                            >
                                Admin Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceView;
