import React from 'react';

export function NavSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="px-3 text-[9px] font-bold text-gray-500/70 uppercase tracking-[0.2em] mb-3 select-none">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
