import React, { useState, useEffect } from 'react';
import { 
  Terminal, Bot, 
  Database, Globe, Settings, Search, Plus, 
  CheckCircle, Edit3, Save, Trash2, Clock,
  Tv, Link, Shield, ToggleLeft, History
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';
import { controlApi } from '../../lib/api/control_api';
import { fetchApi, getConfigYaml, updateConfigYaml, getEnv, updateEnv, runOp } from '../../lib/api/client';
const Editor = React.lazy(() => import('@monaco-editor/react'));

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<'config' | 'env' | 'ops' | 'checkpoints'>('config');
  const [configContent, setConfigContent] = useState('');
  const [envContent, setEnvContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [opLogs, setOpLogs] = useState('');
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  const fetchCheckpoints = async () => {
    try {
      const res = await fetchApi('/ops/checkpoints');
      setCheckpoints(res);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    getConfigYaml().then(res => setConfigContent(res.content));
    getEnv().then(res => setEnvContent(res.content));
    fetchCheckpoints();
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

  const executeOp = (op: string) => {
    setIsOpModalOpen(true);
    setOpLogs(`Connecting to stream for ${op}...\n`);
    
    const token = localStorage.getItem('token') || '';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev, use the VITE_API_BASE_URL host or fallback to localhost:8000 if not available
    const host = import.meta.env.VITE_API_BASE_URL ? new URL(import.meta.env.VITE_API_BASE_URL).host : window.location.host;
    const wsUrl = `${wsProtocol}//${host}/api/v1/ops/ws?op=${op}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      if (token) ws.send(JSON.stringify({ token }));
      setOpLogs(prev => prev + `Connected.\n`);
    };
    
    ws.onmessage = (event) => {
      setOpLogs(prev => prev + event.data + '\n');
    };
    
    ws.onerror = (error) => {
      setOpLogs(prev => prev + `\nWebSocket Error observed. Check console.\n`);
      console.error("WebSocket Error: ", error);
    };
    
    ws.onclose = () => {
      setOpLogs(prev => prev + `\n[Stream closed]\n`);
    };
  };

  const deleteCheckpoint = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await fetchApi(`/ops/checkpoints/${filename}`, { method: 'DELETE' });
      fetchCheckpoints();
    } catch (e: any) {
      alert('Failed to delete checkpoint: ' + e.message);
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
        <button onClick={() => setActiveTab('checkpoints')} className={`px-4 py-2 rounded font-medium text-sm transition-colors ${activeTab === 'checkpoints' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-gray-200'}`}>Checkpoints</button>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm relative">
        {activeTab === 'config' && (
          <React.Suspense fallback={<div className="p-8 text-center text-gray-500">Loading editor...</div>}>
            <Editor
              height="100%"
              defaultLanguage="yaml"
              theme="vs-dark"
              value={configContent}
              onChange={(val) => setConfigContent(val || '')}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </React.Suspense>
        )}
        {activeTab === 'env' && (
          <React.Suspense fallback={<div className="p-8 text-center text-gray-500">Loading editor...</div>}>
            <Editor
              height="100%"
              defaultLanguage="shell"
              theme="vs-dark"
              value={envContent}
              onChange={(val) => setEnvContent(val || '')}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </React.Suspense>
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
        
        {activeTab === 'checkpoints' && (
          <div className="p-6 h-full overflow-y-auto">
            {checkpoints.length > 0 ? (
              <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Checkpoint Name</th>
                      <th className="px-6 py-4 font-medium">Created At</th>
                      <th className="px-6 py-4 font-medium">Size</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {checkpoints.map((cp, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-purple-400 flex items-center">
                          <History size={16} className="mr-2 text-gray-500"/>
                          {cp.filename}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-300">
                          {new Date(cp.created_at * 1000).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {(cp.size_bytes / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteCheckpoint(cp.filename)}
                            className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-800 transition-colors"
                            title="Delete Checkpoint"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-16">
                <History size={48} className="text-gray-600 mb-2"/>
                <h3 className="text-xl font-bold text-gray-300">No Checkpoints Found</h3>
                <p className="text-gray-500 text-sm">Rollback directory is empty.</p>
              </div>
            )}
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

