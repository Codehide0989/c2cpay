import React from 'react';
import { Smartphone, Zap, CreditCard, Wallet } from 'lucide-react';
import { UPIConfig } from '../types';

interface MobileAppsProps {
  upiLink: string;
  config: UPIConfig;
}

const MobileApps: React.FC<MobileAppsProps> = ({ upiLink }) => {
  const apps = [
    {
      name: 'Google Pay',
      scheme: upiLink.replace('upi://', 'tez://'),
      icon: <Zap className="w-4 h-4" />,
      gradient: 'from-[#4285F4]/20 to-transparent',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    {
      name: 'PhonePe',
      scheme: upiLink.replace('upi://', 'phonepe://'),
      icon: <Smartphone className="w-4 h-4" />,
      gradient: 'from-[#5f259f]/20 to-transparent',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20'
    },
    {
      name: 'Paytm',
      scheme: upiLink.replace('upi://', 'paytmmp://'),
      icon: <CreditCard className="w-4 h-4" />,
      gradient: 'from-[#00baf2]/20 to-transparent',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
      glow: 'shadow-sky-500/20'
    },
    {
      name: 'Generic App',
      scheme: upiLink,
      icon: <Wallet className="w-4 h-4" />,
      gradient: 'from-[#e91e63]/20 to-transparent',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/20'
    },
  ];

  return (
    <div className="w-full grid grid-cols-2 gap-3 mt-6 lg:hidden">
      <div className="col-span-2 text-center mb-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Mobile Carrier Select</p>
      </div>
      {apps.map((app) => (
        <a
          key={app.name}
          href={app.scheme}
          className={`
            relative overflow-hidden group flex items-center justify-center gap-2.5 p-3.5 rounded-2xl 
            font-bold text-xs transition-all duration-300 transform active:scale-95
            bg-slate-900/50 backdrop-blur-md border ${app.border} ${app.text}
            shadow-lg ${app.glow} hover:shadow-xl
          `}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-50`}></div>

          {/* Shine effect */}
          <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>

          <div className="relative z-10 flex items-center gap-2">
            <div className="p-1 rounded-lg bg-white/5">{app.icon}</div>
            <span className="tracking-tight uppercase">{app.name}</span>
          </div>
        </a>
      ))}
    </div>
  );
};

export default MobileApps;