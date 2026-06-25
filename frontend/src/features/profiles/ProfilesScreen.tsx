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

export function ProfilesScreen() {
  const { data: profilesData = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: hermesApi.getProfiles
  });
  
  const defaultProfiles = profilesData.length > 0 ? profilesData.map((p: any) => ({
    id: p.agent_name,
    profile_name: p.agent_name,
    role: 'Agent',
    model_route: 'Hermes Default',
    status: 'Idle',
    soul_content: p.soul_content
  })) : [
    { id: 'sess_1', profile_name: 'swe_lead', role: 'Local SWE Supervisor', model_route: 'Ollama: gemma-4-12b', status: 'Idle', soul_content: '', taste_content: '' }
  ];
  
  const [selectedProfile, setSelectedProfile] = useState<any>(defaultProfiles[0]);
  const [editedSoul, setEditedSoul] = useState('');
  const [editedTaste, setEditedTaste] = useState('');
  
  const queryClient = useQueryClient();
  const updateSoulMutation = useMutation({
    mutationFn: (data: {agentName: string, content: string}) => hermesApi.updateSoul(data.agentName, data.content)
  });
  const updateTasteMutation = useMutation({
    mutationFn: (data: {agentName: string, content: string}) => hermesApi.updateTaste(data.agentName, data.content)
  });

  React.useEffect(() => {
    if (defaultProfiles.length > 0 && !selectedProfile) {
      setSelectedProfile(defaultProfiles[0]);
    }
  }, [profilesData]);

  React.useEffect(() => {
    if (selectedProfile) {
      setEditedSoul(selectedProfile.soul_content || `You are the ${selectedProfile.role}.`);
      setEditedTaste(selectedProfile.taste_content || '');
    }
  }, [selectedProfile]);

  const handleSave = async () => {
    try {
      await updateSoulMutation.mutateAsync({ agentName: selectedProfile.profile_name, content: editedSoul });
      await updateTasteMutation.mutateAsync({ agentName: selectedProfile.profile_name, content: editedTaste });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      alert('Profile updated successfully!');
    } catch (e) {
      alert('Failed to update profile.');
    }
  };

  if (isLoading) return <div className="text-gray-400 p-6">Loading profiles...</div>;
  if (!selectedProfile) return null;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <div className="w-1/3 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
          <h3 className="font-medium text-gray-200">Execution Profiles</h3>
          <button className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors"><Plus size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {defaultProfiles.map((p: any, i: number) => (
            <div 
              key={p.id || i} 
              onClick={() => setSelectedProfile(p)}
              className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedProfile.profile_name === p.profile_name ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold font-mono text-sm">{p.profile_name}</h4>
                <span className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
              </div>
              <p className="text-xs opacity-70 mb-1">{p.role}</p>
              <p className="text-[10px] font-mono bg-black/30 inline-block px-1.5 py-0.5 rounded text-gray-400">{p.model_route}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
          <div className="flex items-center space-x-2">
            <Edit3 size={16} className="text-gray-400"/>
            <h3 className="font-medium text-gray-200 font-mono">{selectedProfile.profile_name} Configuration</h3>
          </div>
          <button 
            onClick={handleSave}
            disabled={updateSoulMutation.isPending || updateTasteMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save size={14}/> <span>{updateSoulMutation.isPending ? 'Saving...' : 'Push to Hermes'}</span>
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Role</label>
              <input type="text" value={selectedProfile.role} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 outline-none" readOnly/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Target Model Route</label>
              <select className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 outline-none" defaultValue={selectedProfile.model_route}>
                <option>Ollama: gemma-4-12b</option>
                <option>LiteLLM: opencode/big-pickle</option>
                <option>LiteLLM: deepseek-chat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 flex justify-between">
                <span>soul.md (System Instructions)</span>
                <span className="text-emerald-500">MCP Sandbox Active</span>
              </label>
              <textarea 
                className="w-full h-64 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 focus:border-emerald-500 outline-none resize-none custom-scrollbar"
                value={editedSoul}
                onChange={e => setEditedSoul(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 flex justify-between">
                <span>taste.md (Working Taste & Standards)</span>
              </label>
              <textarea 
                className="w-full h-64 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 focus:border-emerald-500 outline-none resize-none custom-scrollbar"
                value={editedTaste}
                onChange={e => setEditedTaste(e.target.value)}
                placeholder="Write standing instructions, code style, or standards here..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Enabled Tools</label>
            <div className="flex flex-wrap gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs cursor-pointer">execute_code</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs cursor-pointer">read_file</span>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded-full text-xs cursor-pointer">terminal</span>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded-full text-xs cursor-pointer">session_search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

