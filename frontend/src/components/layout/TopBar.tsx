import React from 'react';
import { ChevronRight } from 'lucide-react';

export function TopBar({ currentScreen, wsConnected }: { currentScreen: string, wsConnected: boolean }) {
  return (
    <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur shrink-0">
      <div className="flex items-center text-sm">
        <span className="text-gray-500">Hermes Environment</span>
        <ChevronRight size={14} className="mx-2 text-gray-600" />
        <span className="text-gray-200 font-medium capitalize">{currentScreen.replace('_', ' ')}</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-gray-300">Telemetry Feed: <span className={wsConnected ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'}>{wsConnected ? 'Connected' : 'Offline'}</span></span>
        </div>
        <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full border border-gray-700 shadow flex items-center justify-center text-xs font-bold text-white">
          OP
        </div>
      </div>
    </header>
  );
}
