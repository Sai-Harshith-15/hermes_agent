import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function TopBar({ currentScreen, wsConnected }: { currentScreen: string, wsConnected: boolean }) {
  return (
    <header className="h-16 flex items-center justify-between px-8 shrink-0 relative z-10 border-b border-white/5 bg-gray-950/20 backdrop-blur-xl">
      <div className="flex items-center text-sm">
        <span className="text-gray-500 font-medium tracking-wide">Hermes Environment</span>
        <ChevronRight size={14} className="mx-2 text-gray-700" strokeWidth={3} />
        <span className="text-gray-100 font-bold capitalize tracking-wide">{currentScreen.replace('_', ' ')}</span>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2.5 text-[10px] uppercase tracking-widest font-bold">
          <span className="text-gray-500">Telemetry</span>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></div>
            <span className={wsConnected ? 'text-emerald-400' : 'text-red-400'}>{wsConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity"></div>
          <div className="relative w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10 shadow-lg">
            OP
          </div>
        </div>
      </div>
    </header>
  );
}
