import React, { useState, useEffect } from 'react';
import { Plus, Link } from 'lucide-react';

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

