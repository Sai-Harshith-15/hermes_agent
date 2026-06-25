import React, { useState, useEffect } from 'react';
import { Settings, Plus } from 'lucide-react';
import { fetchApi } from '../../lib/api/client';

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
      await fetchApi('/vault/add', {
        method: 'POST',
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

