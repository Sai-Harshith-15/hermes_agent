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
import Editor from '@monaco-editor/react';

export function VaultScreen() {
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ provider: '', model_name: '', api_key_masked: '', rpm_limit: 60 });

  const [vaultKeys, setVaultKeys] = useState<any[]>([]);

  const fetchVault = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/vault', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setVaultKeys(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/v1/vault/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ provider: newKeyForm.provider, key: newKeyForm.api_key_masked })
      });
      setNewKeyForm({ provider: '', model_name: '', api_key_masked: '', rpm_limit: 60 });
      setShowAddKey(false);
      fetchVault();
    } catch (err) {
      console.error("Error saving API key:", err);
    }
  };

  const keysToDisplay = vaultKeys.length > 0 ? vaultKeys : [];

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
                    <p className="text-xs text-gray-500">{key.key_id}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{key.masked_key}</td>
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

export function ObsidianScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [] } = useQuery({
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
            memoryLogs.map((log: any, idx: number) => (
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
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedSessionId],
    queryFn: () => hermesApi.getMessages(selectedSessionId!),
    enabled: !!selectedSessionId
  });

  const { agentRuns } = useDashboardStore();
  
  const sessionsToDisplay = liveSessions.length > 0 ? liveSessions : agentRuns;

  if (isLoading) return <div className="text-gray-400 p-6">Loading sessions from DB...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <div className="w-1/3 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-800 bg-gray-800/30">
          <h3 className="font-medium text-gray-200">Active Sessions</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {sessionsToDisplay.map((sess: any, i: number) => {
            const id = sess.id || sess.session_id || `unknown-${i}`;
            const isActive = selectedSessionId === id;
            return (
              <div 
                key={id} 
                onClick={() => setSelectedSessionId(id)}
                className={`p-4 rounded-lg cursor-pointer border transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold flex items-center text-sm"><Bot size={14} className="mr-2 text-emerald-400"/> {sess.agent_name || 'Agent'}</h4>
                  <span className={`w-2 h-2 rounded-full ${sess.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
                </div>
                <p className="text-xs text-gray-500 font-mono truncate">{id}</p>
                <p className="text-xs mt-2 text-gray-400 truncate">{sess.task || 'Executing Task...'}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col shadow-sm overflow-hidden">
        {selectedSessionId ? (
          <>
            <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
              <h3 className="font-medium text-gray-200 font-mono text-sm">Session ID: {selectedSessionId}</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 bg-gray-950">
              {isLoadingMessages ? (
                <div className="text-gray-500 text-center">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-500 text-center">No messages recorded in this session.</div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const isUser = msg.role === 'user';
                  const isTool = msg.role === 'tool' || msg.tool_calls;
                  
                  if (isTool) {
                    return (
                      <div key={i} className="flex justify-start">
                        <details className="group max-w-[85%] bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer">
                          <summary className="p-3 text-xs text-gray-400 hover:text-gray-200 list-none flex items-center select-none font-mono">
                            <span className="mr-2 group-open:hidden">▶</span>
                            <span className="mr-2 hidden group-open:inline">▼</span>
                            <span>🛠️ Executed {msg.name || 'tool_call'}</span>
                          </summary>
                          <div className="p-3 border-t border-gray-800 bg-gray-950 text-[10px] text-gray-500 font-mono overflow-x-auto max-h-48 custom-scrollbar">
                            <pre>{msg.content || JSON.stringify(msg.tool_calls, null, 2)}</pre>
                          </div>
                        </details>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-xl text-sm ${isUser ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-none' : 'bg-gray-800/50 border border-gray-700 text-gray-200 rounded-bl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a session to view chat history.
          </div>
        )}
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
  const [activeTab, setActiveTab] = useState<'config' | 'env' | 'ops'>('config');
  const [configContent, setConfigContent] = useState('');
  const [envContent, setEnvContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [opLogs, setOpLogs] = useState('');
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);

  React.useEffect(() => {
    getConfigYaml().then(res => setConfigContent(res.content));
    getEnv().then(res => setEnvContent(res.content));
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'config') await updateConfigYaml(configContent);
      if (activeTab === 'env') await updateEnv(envContent);
      alert('Saved successfully!');
    } catch (e) {
      alert('Failed to save!');
    }
    setIsLoading(false);
  };

  const executeOp = async (op: string) => {
    setIsOpModalOpen(true);
    setOpLogs(`Executing ${op}...\nWaiting for system response...`);
    try {
      const res = await runOp(op);
      setOpLogs((prev) => prev + '\n\n' + res.logs);
    } catch (e: any) {
      setOpLogs((prev) => prev + '\n\nError: ' + e.message);
    }
  };

  return (
    <div className="max-w-6xl space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">System Settings & Ops</h2>
          <p className="text-sm text-gray-400">Safely manage config.yaml, .env, and execute system commands.</p>
        </div>
        {(activeTab === 'config' || activeTab === 'env') && (
          <button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors disabled:opacity-50">
            <Save size={16} className="mr-2"/> {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="flex space-x-2 border-b border-gray-800 pb-2 shrink-0">
        <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded font-medium text-sm transition-colors ${activeTab === 'config' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}>config.yaml</button>
        <button onClick={() => setActiveTab('env')} className={`px-4 py-2 rounded font-medium text-sm transition-colors ${activeTab === 'env' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}>.env Vault</button>
        <button onClick={() => setActiveTab('ops')} className={`px-4 py-2 rounded font-medium text-sm transition-colors ${activeTab === 'ops' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}>System Ops</button>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm relative">
        {activeTab === 'config' && (
          <Editor
            height="100%"
            defaultLanguage="yaml"
            theme="vs-dark"
            value={configContent}
            onChange={(val) => setConfigContent(val || '')}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        )}
        {activeTab === 'env' && (
          <Editor
            height="100%"
            defaultLanguage="shell"
            theme="vs-dark"
            value={envContent}
            onChange={(val) => setEnvContent(val || '')}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        )}
        {activeTab === 'ops' && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 h-full content-start">
            <div onClick={() => executeOp('doctor')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-6 rounded-xl cursor-pointer text-center group transition-colors">
              <Shield size={32} className="mx-auto mb-4 text-blue-400 group-hover:text-blue-300" />
              <h3 className="font-bold text-gray-200 text-lg">Run Doctor</h3>
              <p className="text-sm text-gray-400 mt-2">Diagnose dependencies and network health.</p>
            </div>
            <div onClick={() => executeOp('audit')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-6 rounded-xl cursor-pointer text-center group transition-colors">
              <Search size={32} className="mx-auto mb-4 text-amber-400 group-hover:text-amber-300" />
              <h3 className="font-bold text-gray-200 text-lg">Security Audit</h3>
              <p className="text-sm text-gray-400 mt-2">Verify MCP sandboxes and credentials.</p>
            </div>
            <div onClick={() => executeOp('backup')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-6 rounded-xl cursor-pointer text-center group transition-colors">
              <Database size={32} className="mx-auto mb-4 text-emerald-400 group-hover:text-emerald-300" />
              <h3 className="font-bold text-gray-200 text-lg">Backup Database</h3>
              <p className="text-sm text-gray-400 mt-2">Snapshot SQLite databases instantly.</p>
            </div>
          </div>
        )}

        {isOpModalOpen && (
          <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm flex items-center justify-center p-6 z-10">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl flex flex-col overflow-hidden h-[80%] shadow-2xl">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                <h3 className="font-medium text-gray-200 flex items-center"><Terminal size={16} className="mr-2"/> Operation Output</h3>
                <button onClick={() => setIsOpModalOpen(false)} className="text-gray-400 hover:text-white">Close</button>
              </div>
              <div className="flex-1 p-4 bg-black overflow-y-auto custom-scrollbar">
                <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap">{opLogs}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChannelsScreen() {
  const [platform, setPlatform] = useState('Telegram');
  const [botToken, setBotToken] = useState('');
  const [pairingRequests, setPairingRequests] = useState<any[]>([]);

  const fetchPairing = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/messaging/pairing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPairingRequests(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPairing();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/messaging/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ platform, bot_token: botToken })
      });
      const data = await res.json();
      alert(data.message);
      setBotToken('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/messaging/pairing/${userId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchPairing();
      alert(`User ${userId} approved`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Output Channels & Pairing</h2></div>
      
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-200 mb-4">Setup Bot Gateway</h3>
        <form onSubmit={handleSetup} className="flex space-x-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">PLATFORM</label>
            <select className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="Telegram">Telegram</option>
              <option value="Discord">Discord</option>
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-xs text-gray-400 mb-1">BOT TOKEN</label>
            <input type="password" required className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={botToken} onChange={e => setBotToken(e.target.value)} />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded text-sm transition-colors">Apply Config</button>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">User ID</th>
              <th className="px-6 py-4 font-medium">Platform</th>
              <th className="px-6 py-4 font-medium">Verification Code</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {pairingRequests.map((req, i) => (
              <tr key={i} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-gray-200">{req.user_id}</td>
                <td className="px-6 py-4 flex items-center"><Tv size={16} className="mr-2 text-gray-500"/>{req.platform}</td>
                <td className="px-6 py-4 font-mono text-emerald-400">{req.code}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleApprove(req.user_id)} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded text-xs">Approve</button>
                </td>
              </tr>
            ))}
            {pairingRequests.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No pending pairing requests</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WebhooksScreen() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHook, setNewHook] = useState({ name: '', target_url: '' });

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/messaging/webhooks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWebhooks(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/messaging/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newHook)
      });
      const data = await res.json();
      alert(`Created! Your one-time HMAC secret is:\n\n${data.one_time_secret}\n\nPlease save this, you will not see it again.`);
      setShowAdd(false);
      setNewHook({ name: '', target_url: '' });
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-white">Webhooks & Shell Hooks</h2></div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus size={16} className="inline mr-1"/> Create Hook</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-emerald-500/30 p-5 rounded-xl mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">NAME / IDENTIFIER</label>
              <input type="text" required placeholder="e.g. github-push-trigger" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={newHook.name} onChange={e => setNewHook({...newHook, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">TARGET SCRIPT / URL</label>
              <input type="text" required placeholder="e.g. /home/user/deploy.sh" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={newHook.target_url} onChange={e => setNewHook({...newHook, target_url: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded text-sm transition-colors">Generate Secret & Save</button>
        </form>
      )}

      {webhooks.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Hook Name</th>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium">Hook ID (Truncated)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {webhooks.map((wh, idx) => (
                <tr key={idx} className="hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-medium text-gray-200">{wh.name}</td>
                  <td className="px-6 py-4 font-mono text-emerald-400 text-xs">{wh.target_url}</td>
                  <td className="px-6 py-4 font-mono text-xs">{wh.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-16">
          <Link size={48} className="text-gray-600 mb-2"/>
          <h3 className="text-xl font-bold text-gray-300">No Webhooks Configured</h3>
        </div>
      )}
    </div>
  );
}

export function MCPScreen() {
  const [mcps, setMcps] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMcp, setNewMcp] = useState({ name: '', type: 'stdio', command_or_url: '' });

  const fetchMcps = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/mcp', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMcps(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMcps();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newMcp)
      });
      setShowAdd(false);
      setNewMcp({ name: '', type: 'stdio', command_or_url: '' });
      fetchMcps();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePing = async (mcp: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/mcp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: mcp.type, command_or_url: mcp.command_or_url })
      });
      const data = await res.json();
      alert(`Ping ${data.status}: ${data.message}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/mcp/${name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMcps();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center"><Shield className="mr-2 text-emerald-500"/> MCP Server Manager</h2>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
          <Plus size={16} className="mr-1"/> Add Server
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-emerald-500/30 p-5 rounded-xl mb-6 space-y-4 max-w-lg">
          <h3 className="text-md font-bold text-white">Register MCP Server</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">NAME</label>
              <input type="text" required placeholder="e.g. github-mcp" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={newMcp.name} onChange={e => setNewMcp({...newMcp, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">TYPE</label>
              <select className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={newMcp.type} onChange={e => setNewMcp({...newMcp, type: e.target.value})}>
                <option value="stdio">stdio</option>
                <option value="sse">sse</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">COMMAND / URL</label>
            <input type="text" required placeholder="e.g. npx -y @modelcontextprotocol/server-github" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white font-mono" value={newMcp.command_or_url} onChange={e => setNewMcp({...newMcp, command_or_url: e.target.value})} />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm transition-colors">
            Save Server
          </button>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-900/50 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Server Name</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Command / URL</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {mcps.map((mcp, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-gray-200">{mcp.name}</td>
                <td className="px-6 py-4 font-mono text-xs"><span className="bg-gray-800 px-2 py-1 rounded text-emerald-400">{mcp.type}</span></td>
                <td className="px-6 py-4 font-mono text-xs">{mcp.command_or_url}</td>
                <td className="px-6 py-4 text-right flex justify-end space-x-2">
                  <button onClick={() => handlePing(mcp)} className="text-blue-400 hover:text-blue-300 text-xs bg-blue-500/10 px-2 py-1 rounded">Ping</button>
                  <button onClick={() => handleDelete(mcp.name)} className="text-red-400 hover:text-red-300 text-xs bg-red-500/10 px-2 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

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

import { Palette } from 'lucide-react';

export function ThemesScreen() {
  const [themes, setThemes] = useState<any[]>([]);

  const fetchThemes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/messaging/themes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setThemes(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleApply = (theme: any) => {
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
