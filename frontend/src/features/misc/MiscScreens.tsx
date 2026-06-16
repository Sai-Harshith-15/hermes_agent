import React, { useState } from 'react';
import { 
  Activity, LayoutDashboard, Terminal, Kanban, Key, Bot, 
  Network, Database, Globe, Settings, LogOut, Search, Plus, 
  Play, Square, Server, HardDrive, Cpu, AlertTriangle, 
  CheckCircle, Clock, ChevronRight, MessageSquare, Edit3, Save,
  Tv, Link, Shield, Puzzle, Zap, Box, History, MessageCircle,
  ToggleLeft, Trash2, DownloadCloud
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { addApiKey } from '../../lib/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';
import { controlApi } from '../../lib/api/control_api';

export function VaultScreen() {
  const { apiKeys, addApiKey: addKeyToStore } = useDashboardStore();
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ provider: '', model_name: '', api_key_masked: '', rpm_limit: 60 });

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addedKey = await addApiKey(newKeyForm);
      addKeyToStore(addedKey);
      setNewKeyForm({ provider: '', model_name: '', api_key_masked: '', rpm_limit: 60 });
      setShowAddKey(false);
    } catch (err) {
      console.error("Error saving API key:", err);
      addKeyToStore({ ...newKeyForm, id: Date.now(), current_usage_pct: 0, status: 'Active' });
      setShowAddKey(false);
    }
  };

  const keysToDisplay = apiKeys.length > 0 ? apiKeys : [
    { id: 1, provider: 'OpenCode Zen', model_name: 'opencode/big-pickle', api_key_masked: 'sk-zen-...f8a2', rpm_limit: 60, current_usage_pct: 45, status: 'Active' },
    { id: 2, provider: 'DeepSeek', model_name: 'deepseek-chat', api_key_masked: 'sk-dps-...91x', rpm_limit: 100, current_usage_pct: 80, status: 'Rate-Limited' },
    { id: 3, provider: 'OpenRouter', model_name: 'google/gemini-pro', api_key_masked: 'sk-opr-...zz1', rpm_limit: 20, current_usage_pct: 5, status: 'Fallback Ready' },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">API Key Vault & LiteLLM Routing</h2>
          <p className="text-sm text-gray-400">Manage free-tier keys, fallback mechanisms, and token economics.</p>
        </div>
        <button 
          onClick={() => setShowAddKey(!showAddKey)} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-1"/> Add Key
        </button>
      </div>

      {showAddKey && (
        <form onSubmit={handleAddKey} className="bg-gray-900 border border-emerald-500/30 p-5 rounded-xl mb-6 space-y-4 max-w-lg">
          <h3 className="text-md font-bold text-white">Register New Key Pool</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">PROVIDER</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. OpenCode" 
                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white"
                value={newKeyForm.provider}
                onChange={e => setNewKeyForm({...newKeyForm, provider: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">MODEL ROUTE</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. deepseek-chat" 
                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white"
                value={newKeyForm.model_name}
                onChange={e => setNewKeyForm({...newKeyForm, model_name: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">API KEY (MASKED)</label>
            <input 
              type="text" 
              required 
              placeholder="sk-zen-...f8a2" 
              className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white"
              value={newKeyForm.api_key_masked}
              onChange={e => setNewKeyForm({...newKeyForm, api_key_masked: e.target.value})}
            />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm transition-colors">
            Save Key Pool
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Load Balancing</h4>
          <p className="text-xl text-gray-100 font-semibold">simple-shuffle</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Active Proxies</h4>
          <p className="text-xl text-gray-100 font-semibold">{keysToDisplay.filter(k => k.status === 'Active').length} / {keysToDisplay.length} Pools</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Global Fallback</h4>
          <p className="text-xl text-amber-400 font-semibold text-sm">Ollama (Gemma-4-12b)</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900/50 text-xs uppercase text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Provider & Model</th>
                <th className="px-6 py-4 font-medium">API Key (AES-256)</th>
                <th className="px-6 py-4 font-medium">RPM Load</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {keysToDisplay.map((key: any, i: number) => (
                <tr key={key.id || i} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-200">{key.provider}</p>
                    <p className="text-xs text-gray-500">{key.model_name}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{key.api_key_masked}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{Math.round(key.current_usage_pct || 0)}%</span>
                      <span>{key.rpm_limit} max</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${(key.current_usage_pct || 0) > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${key.current_usage_pct || 0}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full border ${
                      key.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      key.status === 'Rate-Limited' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {key.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-500 hover:text-gray-300 p-1"><Settings size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
          {defaultProfiles.map((p, i) => (
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

export function ObsidianScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['memorySearch', searchQuery],
    queryFn: () => hermesApi.searchMemory(searchQuery),
    enabled: searchQuery.length > 2
  });

  const { logs } = useDashboardStore();
  const memoryLogs = searchQuery.length > 2 ? searchResults : logs.filter(log => log.message.toLowerCase().includes("memory") || log.message.toLowerCase().includes("skill") || log.message.toLowerCase().includes("file"));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Obsidian Memory Layer</h2>
          <p className="text-sm text-gray-400">FTS5 SQLite indexed sessions & long-term knowledge retention.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Trigram search memories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-full pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 w-64" 
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Database size={16}/>
          <span>state.db WAL mode · ~45MB usage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memoryLogs.length > 0 ? (
            memoryLogs.map((log, idx) => (
              <div key={idx} className="bg-gray-950 border border-gray-800 p-5 rounded-lg hover:border-gray-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">#sqlite</span>
                  <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
                <h4 className="text-gray-200 font-medium text-sm mb-3 group-hover:text-emerald-400 transition-colors">{log.message}</h4>
                <div className="flex justify-between items-center border-t border-gray-800 pt-3 text-xs text-gray-500">
                  <span className="flex items-center"><Terminal size={12} className="mr-1"/> Log Sync</span>
                  <span>{log.source}</span>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-lg hover:border-gray-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">#architecture</span>
                  <span className="text-[10px] text-gray-500">2026-06-12</span>
                </div>
                <h4 className="text-gray-200 font-medium text-sm mb-3 group-hover:text-emerald-400 transition-colors">FastAPI SSE implementation decisions</h4>
              </div>
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-lg hover:border-gray-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">#bugfix</span>
                  <span className="text-[10px] text-gray-500">2026-06-11</span>
                </div>
                <h4 className="text-gray-200 font-medium text-sm mb-3 group-hover:text-emerald-400 transition-colors">Resolved execute_code RCE vulnerability</h4>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SessionsScreen() {
  const { data: liveSessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => hermesApi.getSessions(50)
  });
  const { agentRuns } = useDashboardStore();
  
  const sessionsToDisplay = liveSessions.length > 0 ? liveSessions.map((s: any) => ({
    id: s.id || s.session_id || 'unknown',
    profile_name: s.agent_name || 'Agent',
    role: s.task || 'Task Executing',
    model_route: 'Hermes DB',
    status: s.status || 'Active'
  })) : agentRuns.length > 0 ? agentRuns : [];

  if (isLoading) return <div className="text-gray-400 p-6">Loading sessions from DB...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Active Agent Sessions</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessionsToDisplay.map((sess, i) => (
          <div key={sess.id || i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${sess.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-gray-200 font-bold flex items-center"><Bot size={16} className="mr-2 text-emerald-400"/> {sess.profile_name}</h4>
                <p className="text-xs text-gray-500 font-mono mt-1">{sess.id}</p>
              </div>
              <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${sess.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                {sess.status}
              </span>
            </div>
            <p className="text-sm text-gray-300 bg-gray-950 p-3 rounded border border-gray-800 mb-4">{sess.role} running on route: {sess.model_route}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="flex items-center"><Clock size={12} className="mr-1"/> Active Connection Feed</span>
              <button className="text-emerald-500 hover:text-emerald-400 font-medium">Connect Sandbox</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatScreen() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are securely connected to the Local SWE Supervisor.' },
    { role: 'assistant', content: 'Good evening. Shall I trigger the deployment pipeline?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    
    try {
      await controlApi.steerAgent('swe_lead', userMsg);
      setMessages(prev => [...prev, { role: 'system', content: 'Steering command dispatched to Hermes inbox.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: 'Failed to dispatch steering command.' }]);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-gray-100 flex items-center">Direct Supervisor Chat</h3>
          <p className="text-xs text-emerald-400 font-mono mt-0.5">swe_lead (Local Compute)</p>
        </div>
        <ToggleLeft size={24} className="text-gray-500 cursor-not-allowed"/>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-950">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : msg.role === 'system' ? 'bg-gray-800/50 text-gray-500 w-full text-center text-xs border border-gray-800 font-mono' : 'bg-gray-900 border border-gray-700 text-gray-200 rounded-bl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
        <form onSubmit={handleSend} className="flex space-x-4">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct the supervisor..." 
            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export function TunnelsScreen() {
  const defaultTunnels = [
    { id: 1, name: 'mayura_tunnel', url: 'https://saas-dashboard-xyz.trycloudflare.com', target: 'localhost:3000', status: 'Online' },
    { id: 2, name: 'floci_api', url: 'http://localhost:4566', target: 'Local AWS Emulation', status: 'Online' }
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Production Tunnels & Floci</h2>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Service Name</th>
              <th className="px-6 py-4 font-medium">Public/Local Endpoint</th>
              <th className="px-6 py-4 font-medium">Target / Route</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {defaultTunnels.map(tunnel => (
              <tr key={tunnel.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">{tunnel.name}</td>
                <td className="px-6 py-4"><a href="#" className="text-blue-400 hover:underline flex items-center">{tunnel.url} <Globe size={12} className="ml-1"/></a></td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{tunnel.target}</td>
                <td className="px-6 py-4"><span className="flex items-center text-emerald-400 text-xs font-bold uppercase"><CheckCircle size={14} className="mr-1"/> {tunnel.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const { hostMetrics } = useDashboardStore();
  return (
    <div className="max-w-3xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">System Configuration</h2></div>
      <div className="space-y-4">
        <SettingsCard title="Global Context Compression" desc="Auto-compress logs when token limit reaches 80% to save LiteLLM budgets." status="Enabled" />
        <SettingsCard title="Oracle NeverIdle Daemon" desc={`Maintains CPU load > 10% using stress-ng via cron. Current Load: ${hostMetrics.cpu_usage || 0}%`} status="Active" />
        <SettingsCard title="Edge-TTS Binding" desc="Microsoft Text-to-Speech python wrapper for zero-cost voiceovers." status="Operational" />
      </div>
    </div>
  );
}

function SettingsCard({ title, desc, status }: { title: string, desc: string, status: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 flex justify-between items-center shadow-sm hover:border-gray-700 transition-colors cursor-pointer">
      <div>
        <h4 className="text-gray-200 font-medium">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-emerald-400 mb-2">{status}</span>
        <button className="text-gray-400 hover:text-gray-200 text-sm flex items-center"><Edit3 size={14} className="mr-1"/> Edit</button>
      </div>
    </div>
  );
}

export function ChannelsScreen() {
  const channels = [{ id: 1, platform: 'YouTube API v3', name: 'Auto_Tech_Shorts', status: 'Connected', quota: '450/10000', nextCron: '08:00 AM' }];
  return (
    <div className="max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Output Channels</h2></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Platform</th>
              <th className="px-6 py-4 font-medium">Account Name</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {channels.map(ch => (
              <tr key={ch.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center"><Tv size={16} className="mr-2 text-gray-500"/>{ch.platform}</td>
                <td className="px-6 py-4 font-mono text-emerald-400">{ch.name}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded uppercase font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30`}>{ch.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WebhooksScreen() {
  return (
    <div className="max-w-4xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Webhooks & Alerts</h2></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-16">
        <Link size={48} className="text-gray-600 mb-2"/>
        <h3 className="text-xl font-bold text-gray-300">No Webhooks Configured</h3>
        <button className="bg-emerald-600/20 text-emerald-400 border border-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors px-6 py-2 rounded-lg text-sm font-medium mt-4">Create New Webhook</button>
      </div>
    </div>
  );
}

export function MCPScreen() {
  const whitelists = [
    { id: 1, resource: 'FileSystem (Read/Write)', path: '/app/frontend/src', status: 'Whitelisted', hits: 142 },
    { id: 2, resource: 'FileSystem (Read)', path: '/root/.ssh', status: 'Blocked (Snitch)', hits: 3 },
  ];
  return (
    <div className="max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white flex items-center"><Shield className="mr-2 text-emerald-500"/> MCP Snitch Security</h2></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-900/50 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Resource Type</th>
              <th className="px-6 py-4 font-medium">Path / Constraint</th>
              <th className="px-6 py-4 font-medium">Proxy Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {whitelists.map(mcp => (
              <tr key={mcp.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-gray-200">{mcp.resource}</td>
                <td className="px-6 py-4 font-mono text-xs">{mcp.path}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded uppercase font-bold border ${mcp.status.includes('Blocked') ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>{mcp.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PluginsScreen() {
  return (
    <div className="max-w-4xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Hermes Plugins</h2></div>
      <div className="grid grid-cols-2 gap-6">
        <SettingsCard title="Floci AWS Emulation Plugin" desc="Allows agents to interface with local S3/Dynamo DB mocks." status="Enabled" />
        <SettingsCard title="Social Media Scraper" desc="Pulls trends from Reddit & X APIs for the YouTube workflow." status="Enabled" />
      </div>
    </div>
  );
}

export function SkillsScreen() {
  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: hermesApi.getSkills
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Learned Skills</h2></div>
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

export function ModelsScreen() {
  const models = [
    { id: 1, name: 'gemma-4-12b', provider: 'Ollama (Local)', size: '8.2 GB GGUF', status: 'Loaded in RAM' },
    { id: 2, name: 'opencode/big-pickle', provider: 'LiteLLM Proxy', size: 'API', status: 'Active Routing' },
  ];
  return (
    <div className="max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Model Registry</h2></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Model Designation</th>
              <th className="px-6 py-4 font-medium">Provider Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {models.map(model => (
              <tr key={model.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-200">{model.name}</td>
                <td className="px-6 py-4">{model.provider}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded border ${model.status.includes('RAM') || model.status.includes('Active') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{model.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
