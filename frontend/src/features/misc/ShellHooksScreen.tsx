import { useState, useEffect } from 'react';
import { TerminalSquare, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { hooksApi } from '../../lib/api/hooks_api';

interface ShellHook {
  event: string;
  command: string;
  matcher: string;
  timeout: number;
}

export function ShellHooksScreen() {
  const [hooks, setHooks] = useState<ShellHook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [consentGranted, setConsentGranted] = useState(false);
  const [newHook, setNewHook] = useState<ShellHook>({ event: '', command: '', matcher: '', timeout: 30 });

  const loadHooks = async () => {
    setLoading(true);
    try {
      const data = await hooksApi.getShellHooks();
      setHooks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load shell hooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHooks();
  }, []);

  const handleDelete = async (event: string) => {
    if (!window.confirm(`Delete hook for event: ${event}?`)) return;
    try {
      await hooksApi.deleteShellHook(event);
      await loadHooks();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGranted) {
      alert("You must grant execution consent before adding a shell hook.");
      return;
    }
    try {
      await hooksApi.createShellHook(newHook);
      setNewHook({ event: '', command: '', matcher: '', timeout: 30 });
      setConsentGranted(false);
      await loadHooks();
    } catch (err: any) {
      alert(`Failed to add hook: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100 flex items-center mb-2">
          <TerminalSquare className="mr-2 text-amber-500" /> Advanced Shell Hooks
        </h2>
        <p className="text-sm text-gray-400">Configure event triggers and timeouts. Changes are written to shell-hooks-allowlist.json.</p>
      </div>

      {error && <div className="text-red-400 bg-red-900/20 border border-red-500/50 p-3 rounded mb-4">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-800 bg-gray-950/50">
          <h3 className="font-medium text-gray-200">Add New Hook</h3>
        </div>
        <form onSubmit={handleAdd} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Event Name</label>
              <input required type="text" value={newHook.event} onChange={e => setNewHook({...newHook, event: e.target.value})} placeholder="e.g. on_agent_stuck" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Execution Command</label>
              <input required type="text" value={newHook.command} onChange={e => setNewHook({...newHook, command: e.target.value})} placeholder="e.g. /usr/bin/python3 alert.py" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Matcher (Regex/Glob)</label>
              <input required type="text" value={newHook.matcher} onChange={e => setNewHook({...newHook, matcher: e.target.value})} placeholder="e.g. *" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Timeout (seconds)</label>
              <input required type="number" value={newHook.timeout} onChange={e => setNewHook({...newHook, timeout: parseInt(e.target.value)})} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500 font-mono" />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <input type="checkbox" id="consent" checked={consentGranted} onChange={e => setConsentGranted(e.target.checked)} className="accent-amber-500" />
            <label htmlFor="consent" className="text-sm text-amber-400 font-medium flex items-center cursor-pointer">
              <ShieldAlert size={16} className="mr-2" /> Consent Granted: Execution Risk Acknowledged
            </label>
          </div>

          <button type="submit" disabled={!consentGranted} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded transition-colors">
            <Plus size={16} /> <span>Save Hook</span>
          </button>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-950/50">
          <h3 className="font-medium text-gray-200">Active Hooks</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading hooks...</div>
        ) : hooks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No shell hooks configured.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-gray-950/50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Command</th>
                <th className="px-4 py-3 font-medium">Timeout</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hooks.map(h => (
                <tr key={h.event} className="border-t border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-amber-400">{h.event}</td>
                  <td className="px-4 py-3 font-mono">{h.command}</td>
                  <td className="px-4 py-3">{h.timeout}s</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(h.event)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
