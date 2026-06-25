import React, { useState, useEffect } from 'react';
import { 
  Terminal, Bot, 
  Database, Globe, Settings, Search, Plus, 
  CheckCircle, Edit3, Save,
  Tv, Link, Shield, ToggleLeft
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';
import { controlApi } from '../../lib/api/control_api';
import { fetchApi, getConfigYaml, updateConfigYaml, getEnv, updateEnv, runOp } from '../../lib/api/client';
const Editor = React.lazy(() => import('@monaco-editor/react'));

export function PluginsScreen() {
  const [skills, setSkills] = useState<any[]>([]);
  const [installingSkill, setInstallingSkill] = useState<string | null>(null);
  const termRef = React.useRef<HTMLDivElement>(null);
  const xtermRef = React.useRef<XTerminal | null>(null);

  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/skills/local', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSkills(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (installingSkill && termRef.current && !xtermRef.current) {
      const term = new XTerminal({
        theme: { background: '#030712', foreground: '#10b981' },
        fontFamily: 'monospace',
        fontSize: 12
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current);
      fitAddon.fit();
      xtermRef.current = term;

      const token = localStorage.getItem('token');
      const ws = new WebSocket(`ws:///ws/telemetry?token=${token}`);
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ops_log" && msg.data.skill_id === installingSkill) {
            term.write(msg.data.log.replace(/\n/g, '\r\n'));
          }
        } catch(e) {}
      };

      return () => {
        ws.close();
        term.dispose();
        xtermRef.current = null;
      };
    }
  }, [installingSkill]);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/v1/skills/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ skill_id: id, enabled: !enabled })
      });
      fetchSkills();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstall = async (id: string) => {
    setInstallingSkill(id);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/v1/skills/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ skill_id: id })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl space-y-6 relative">
      <div><h2 className="text-2xl font-bold text-white">Skills Hub & Marketplace</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map(s => (
          <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-sm hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-gray-200 font-bold">{s.name}</h4>
              <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold border ${s.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{s.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">{s.description || 'No description provided.'}</p>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-400">v{s.version || '1.0'}</span>
              <div className="space-x-2 flex">
                <button onClick={() => handleToggle(s.id, s.enabled)} className="text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded">{s.enabled ? 'Disable' : 'Enable'}</button>
                <button onClick={() => handleInstall(s.id)} className="text-blue-400 hover:text-blue-300 border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded flex items-center"><Terminal size={14} className="mr-1"/> Install / Update</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {installingSkill && (
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm flex justify-center items-center z-50 p-6">
          <div className="bg-gray-900 border border-emerald-500/50 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-200 flex items-center"><Terminal size={16} className="mr-2 text-emerald-500"/> Installing {installingSkill}...</h3>
              <button onClick={() => setInstallingSkill(null)} className="text-gray-400 hover:text-white">Close</button>
            </div>
            <div className="flex-1 p-4 bg-gray-950" ref={termRef}></div>
          </div>
        </div>
      )}
    </div>
  );
}

