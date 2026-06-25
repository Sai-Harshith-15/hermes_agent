import React, { useState, useEffect } from 'react';
import { 
  Terminal, Bot, 
  Database, Globe, Settings, Search, Plus, 
  CheckCircle, Edit3, Save,
  Tv, Link, Shield, ToggleLeft, RefreshCcw
} from 'lucide-react';
import { messagingApi } from '../../lib/api/messaging_api';
import { toast } from 'sonner';

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
      const data = await messagingApi.setupGateway(platform, botToken);
      toast.success(data.message || `${platform} configured successfully`);
      setBotToken('');
    } catch (err) {
      toast.error(`Failed to setup gateway: ${err}`);
      console.error(err);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await messagingApi.approvePairing(userId);
      fetchPairing();
      toast.success(`User ${userId} approved successfully`);
    } catch (err) {
      toast.error(`Failed to approve user: ${err}`);
      console.error(err);
    }
  };

  const handleRestart = async () => {
    try {
      const data = await messagingApi.restartGateway();
      if (data.status === 'success') {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(`Failed to trigger restart: ${err}`);
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Output Channels & Pairing</h2>
        <button 
          onClick={handleRestart}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors border border-gray-700"
        >
          <RefreshCcw size={16} className="mr-2"/> Restart Gateway
        </button>
      </div>
      
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
                  <button onClick={() => handleApprove(req.user_id)} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded text-xs transition-colors">Approve</button>
                </td>
              </tr>
            ))}
            {pairingRequests.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No pending pairing requests</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
