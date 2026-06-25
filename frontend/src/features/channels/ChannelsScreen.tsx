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

