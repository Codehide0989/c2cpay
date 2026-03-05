import React from 'react';
import { Settings, Shield, AlertTriangle, Clock, RefreshCcw, ServerCog } from 'lucide-react';

interface MaintenanceViewProps {
    message?: string;
    onAdminClick: () => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ message, onAdminClick }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 animate-in fade-in duration-700">
            <div className="relative max-w-sm w-full">
                {/* Background glow effects - Even more subtle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-neon-blue/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent"></div>

                    <div className="relative z-10 flex flex-col items-center space-y-5">
                        {/* Icon Container - Pulsing gently */}
                        <div className="relative">
                            <div className="relative w-16 h-16 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center shadow-inner group">
                                <ServerCog className="w-8 h-8 text-neon-blue/80 group-hover:text-neon-blue transition-colors duration-500" />
                                <div className="absolute -top-1 -right-1 bg-rose-500 rounded-full p-1 border border-rose-400/20 animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                System Update
                            </h2>
                            <div className="h-0.5 w-12 bg-neon-blue/40 mx-auto rounded-full"></div>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed px-2">
                            {message || "We're currently refining our gateway for a better experience. We'll be back shortly."}
                        </p>

                        {/* Status Grid - Compact */}
                        <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
                            <div className="p-3 bg-white/[0.03] border border-white/[0.03] rounded-2xl flex flex-col items-center gap-1.5 transition-colors hover:bg-white/[0.05]">
                                <Clock className="w-3.5 h-3.5 text-neon-purple opacity-70" />
                                <span className="text-[10px] text-white font-medium uppercase tracking-tight">~10 Mins</span>
                            </div>
                            <div className="p-3 bg-white/[0.03] border border-white/[0.03] rounded-2xl flex flex-col items-center gap-1.5 transition-colors hover:bg-white/[0.05]">
                                <RefreshCcw className="w-3.5 h-3.5 text-neon-blue opacity-70" />
                                <span className="text-[10px] text-white font-medium uppercase tracking-tight">Syncing</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-3 w-full space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-white text-black text-sm font-bold rounded-2xl hover:bg-neon-blue hover:text-white transition-all shadow-xl active:scale-[0.97]"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCcw className="w-3.5 h-3.5" />
                                    Check for Updates
                                </span>
                            </button>

                            {/* Subtle Admin Access */}
                            <button
                                onClick={onAdminClick}
                                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest font-bold"
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
