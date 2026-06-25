import React, { useState, useEffect } from 'react';
import { 
  Terminal, Bot, 
  Database, Globe, Settings, Search, Plus, 
  CheckCircle, Edit3, Save,
  Tv, Link, Shield, ToggleLeft
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';
import { controlApi } from '../../lib/api/control_api';
import { fetchApi, getConfigYaml, updateConfigYaml, getEnv } from '../../lib/api/client';

export function SkillsScreen() {
  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: hermesApi.getSkills
  });

  const [curatorStatus, setCuratorStatus] = useState<string>('unknown');

  const loadCuratorStatus = async () => {
    try {
      const data = await fetchApi('/skills/curator');
      setCuratorStatus(data.status);
    } catch(err) {}
  };

  const [installId, setInstallId] = useState('');
  const [logs, setLogs] = useState<string>('');
  const [showLogs, setShowLogs] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadCuratorStatus();
    
    // Listen to WebSocket logs
    const token = localStorage.getItem('token') || '';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_BASE_URL ? new URL(import.meta.env.VITE_API_BASE_URL).host : window.location.host;
    const ws = new WebSocket(`${wsProtocol}//${host}/ws/telemetry?token=${token}`);
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ops_log') {
          setLogs(prev => prev + msg.data.log);
        }
      } catch (e) {}
    };
    
    return () => { ws.close(); };
  }, []);

  const toggleCurator = async () => {
    const action = curatorStatus === 'running' ? 'pause' : 'resume';
    try {
      await fetchApi(`/skills/curator/toggle?action=${action}`, { method: 'POST' });
      await loadCuratorStatus();
    } catch(err: any) {
      alert(`Failed to toggle curator: ${err.message}`);
    }
  };

  const handleInstall = async () => {
    if (!installId) return;
    setLogs('');
    setShowLogs(true);
    await fetchApi('/skills/install', {
      method: 'POST',
      body: JSON.stringify({ skill_id: installId })
    });
  };

  const handleUpdateAll = async () => {
    setLogs('');
    setShowLogs(true);
    await fetchApi('/skills/update-all', { method: 'POST' });
  };

  const toggleSkill = async (skillId: string, enabled: boolean) => {
    await fetchApi('/skills/toggle', {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId, enabled: !enabled })
    });
    queryClient.invalidateQueries({ queryKey: ['skills'] });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">Learned Skills & Curator</h2>
          <p className="text-sm text-gray-400">Background agent that autonomously refactors and deduplicates skills.</p>
        </div>
        <div className="flex items-center space-x-3 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl">
          <span className="text-sm text-gray-400">Curator Daemon</span>
          <button 
            onClick={toggleCurator}
            className={`w-12 h-6 rounded-full relative transition-colors ${curatorStatus === 'running' ? 'bg-emerald-500' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${curatorStatus === 'running' ? 'left-7' : 'left-1'}`}></div>
          </button>
          <span className={`text-xs font-mono uppercase ${curatorStatus === 'running' ? 'text-emerald-400' : 'text-gray-500'}`}>{curatorStatus}</span>
        </div>
      </div>
      
      <div className="flex space-x-4 bg-gray-900 p-4 rounded-xl border border-gray-800 items-center">
        <input 
          type="text" 
          placeholder="Skill ID from Hub (e.g. mcp-installer)" 
          className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white"
          value={installId}
          onChange={e => setInstallId(e.target.value)}
        />
        <button onClick={handleInstall} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm transition-colors flex items-center"><Plus size={16} className="mr-1"/> Install</button>
        <button onClick={handleUpdateAll} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm border border-gray-700 transition-colors">Update All</button>
      </div>

      {showLogs && (
        <div className="bg-black border border-gray-800 p-4 rounded-xl max-h-48 overflow-y-auto">
          <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap">{logs || 'Waiting for output...'}</pre>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? <div className="text-gray-400">Loading skills...</div> : 
          skills.length === 0 ? <div className="text-gray-500">No skills found in ~/.hermes/skills</div> :
          skills.map((s: any, i: number) => (
            <div key={i} className="p-4 bg-gray-950 border border-gray-800 rounded flex justify-between items-center group hover:border-emerald-500/50 transition-colors">
              <div>
                <h4 className="text-emerald-400 font-mono text-sm mb-1">{s.name}.md</h4>
                <p className="text-xs text-gray-500 truncate max-w-lg">{s.content ? s.content.substring(0, 100) : ''}...</p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => toggleSkill(s.id, s.enabled)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${s.enabled !== false ? 'bg-emerald-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${s.enabled !== false ? 'left-6' : 'left-1'}`}></div>
                </button>
                <Bot size={16} className="text-gray-600 group-hover:text-emerald-500 cursor-pointer"/>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

