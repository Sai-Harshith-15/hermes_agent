import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { fetchApi } from '../../lib/api/client';

export function ThemesScreen() {
  const [themes, setThemes] = useState<any[]>([]);

  const fetchThemes = async () => {
    try {
      const data = await fetchApi('/messaging/themes');
      if (data) setThemes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleApply = (theme: any) => {
    // Hot-swap theme by injecting CSS variables to the document root
    if (theme.bg_color) {
      document.documentElement.style.setProperty('--bg-color', theme.bg_color);
      // For Tailwind arbitrary values or custom CSS:
      document.documentElement.style.backgroundColor = theme.bg_color;
    }
    if (theme.accent) {
      document.documentElement.style.setProperty('--accent-color', theme.accent);
    }
    alert(`Applied theme: ${theme.name}`);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Dashboard Themes</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map(t => (
          <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-sm hover:border-gray-700 transition-colors flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <h4 className="text-gray-200 font-bold flex items-center"><Palette size={16} className="mr-2 text-gray-500" style={{ color: t.accent || 'inherit' }}/>{t.name}</h4>
            </div>
            <button onClick={() => handleApply(t)} className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-sm transition-colors border border-gray-700">Apply Theme</button>
          </div>
        ))}
      </div>
    </div>
  );
}
