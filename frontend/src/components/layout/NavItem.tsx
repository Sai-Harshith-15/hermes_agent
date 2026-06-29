import React from 'react';
import { motion } from 'framer-motion';

export interface NavItemProps {
  id: string;
  icon: any;
  label: string;
  current: string;
  set: (id: string) => void;
}

export function NavItem({ id, icon: Icon, label, current, set }: NavItemProps) {
  const isActive = current === id;
  return (
    <button
      onClick={() => set(id)}
      className="relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl group transition-all"
    >
      {isActive && (
        <motion.div
          layoutId="active-nav-pill"
          className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <div className="relative z-10 flex items-center space-x-3 text-sm">
        <Icon 
          size={16} 
          strokeWidth={isActive ? 2.5 : 2}
          className={`transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`} 
        />
        <span className={`tracking-wide font-medium transition-colors ${isActive ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200'}`}>
          {label}
        </span>
      </div>
    </button>
  );
}
