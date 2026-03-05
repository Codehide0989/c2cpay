import React from 'react';
import { Smartphone, Zap, CreditCard, Wallet } from 'lucide-react';
import { UPIConfig } from '../types';

interface MobileAppsProps {
  upiLink: string;
  config: UPIConfig;
}

const MobileApps: React.FC<MobileAppsProps> = ({ upiLink }) => {
  // Construct specific app intents
  // Note: App schemes vary by OS and app version, these are common defaults.
  const apps = [
    {
      name: 'GPay',
      scheme: upiLink.replace('upi://', 'tez://'),
      icon: <Zap className="w-5 h-5 text-white" />,
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-500',
      gradient: 'from-blue-600 to-blue-500' // Keeping GPay standard blue
    },
    {
      name: 'PhonePe',
      scheme: upiLink.replace('upi://', 'phonepe://'),
      icon: <Smartphone className="w-5 h-5 text-white" />,
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-500',
      gradient: 'from-[#bc13fe] to-[#d966ff]' // neon-purple
    },
    {
      name: 'Paytm',
      scheme: upiLink.replace('upi://', 'paytmmp://'),
      icon: <CreditCard className="w-5 h-5 text-white" />,
      bg: 'bg-sky-500',
      hover: 'hover:bg-sky-400',
      gradient: 'from-[#00f3ff] to-[#60f8ff]' // neon-blue
    },
    {
      name: 'BHIM/Other',
      scheme: upiLink,
      icon: <Wallet className="w-5 h-5 text-white" />,
      bg: 'bg-rose-500',
      hover: 'hover:bg-rose-400',
      gradient: 'from-[#ff0055] to-[#ff4d88]' // neon-rose
    },
  ];

  return (
    <div className="w-full grid grid-cols-2 gap-3 mt-6 lg:hidden">
      <div className="col-span-2 text-center mb-1">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Pay with App</p>
      </div>
      {apps.map((app) => (
        <a
          key={app.name}
          href={app.scheme}
          className={`
            relative overflow-hidden group flex items-center justify-center gap-2 p-3 rounded-xl 
            text-white font-semibold transition-all duration-300 transform active:scale-95
            bg-gradient-to-br ${app.gradient} shadow-lg
          `}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>

          <div className="relative z-10 flex items-center gap-2">
            {app.icon}
            <span>{app.name}</span>
          </div>
        </a>
      ))}
    </div>
  );
};

export default MobileApps;