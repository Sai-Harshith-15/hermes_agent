import React, { useState, useEffect } from 'react';
import { Plus, Link, Power, PowerOff } from 'lucide-react';
import { hooksApi } from '../../lib/api/hooks_api';

export function WebhooksScreen() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHook, setNewHook] = useState({ name: '', target_url: '', event_filter: '*' });

  const fetchWebhooks = async () => {
    try {
      const data = await hooksApi.getWebhooks();
      setWebhooks(data);
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
      const data = await hooksApi.createWebhook(newHook);
      alert(`Created! Your one-time HMAC secret is:\n\n${data.one_time_secret}\n\nPlease save this, you will not see it again.`);
      setShowAdd(false);
      setNewHook({ name: '', target_url: '', event_filter: '*' });
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWebhook = async (id: string) => {
    try {
      await hooksApi.toggleWebhook(id);
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Webhooks & Shell Hooks</h2>
          <p className="text-sm text-gray-400">Trigger scripts or HTTP endpoints on specific agent events.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus size={16} className="inline mr-1"/> Create Hook</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-emerald-500/30 p-5 rounded-xl mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">NAME / IDENTIFIER</label>
              <input type="text" required placeholder="e.g. notify-slack" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={newHook.name} onChange={e => setNewHook({...newHook, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">TARGET URL</label>
              <input type="text" required placeholder="https://api.example.com/webhook" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={newHook.target_url} onChange={e => setNewHook({...newHook, target_url: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">EVENT FILTER</label>
              <input type="text" placeholder="*" className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" value={newHook.event_filter} onChange={e => setNewHook({...newHook, event_filter: e.target.value})} />
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
                <th className="px-6 py-4 font-medium">Filter</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {webhooks.map((wh, idx) => (
                <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-200">{wh.name}</td>
                  <td className="px-6 py-4 font-mono text-emerald-400 text-xs max-w-xs truncate">{wh.target_url}</td>
                  <td className="px-6 py-4 font-mono text-xs">{wh.event_filter || '*'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${wh.enabled !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {wh.enabled !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleWebhook(wh.id)}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
                      title={wh.enabled !== false ? "Disable" : "Enable"}
                    >
                      {wh.enabled !== false ? <PowerOff size={16} /> : <Power size={16} />}
                    </button>
                  </td>
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

