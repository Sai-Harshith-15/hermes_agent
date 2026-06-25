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

