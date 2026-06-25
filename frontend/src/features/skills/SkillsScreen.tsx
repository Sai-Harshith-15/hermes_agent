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

  useEffect(() => {
    loadCuratorStatus();
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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? <div className="text-gray-400">Loading skills...</div> : 
          skills.length === 0 ? <div className="text-gray-500">No skills found in ~/.hermes/skills</div> :
          skills.map((s: any, i: number) => (
            <div key={i} className="p-4 bg-gray-950 border border-gray-800 rounded flex justify-between items-center group hover:border-emerald-500/50 transition-colors cursor-pointer">
              <div>
                <h4 className="text-emerald-400 font-mono text-sm mb-1">{s.name}.md</h4>
                <p className="text-xs text-gray-500 truncate max-w-lg">{s.content.substring(0, 100)}...</p>
              </div>
              <Bot size={16} className="text-gray-600 group-hover:text-emerald-500"/>
            </div>
          ))
        }
      </div>
    </div>
  );
}

