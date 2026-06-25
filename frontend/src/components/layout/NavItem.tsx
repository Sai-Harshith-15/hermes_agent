import React from 'react';

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
      className={`w-full flex items-center space-x-3 px-5 py-2.5 text-sm transition-colors ${
        isActive ? 'bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
