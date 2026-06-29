import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Package, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { pluginsApi, PluginManifest } from '../../lib/api/plugins_api';
import { WS_BASE_URL } from '../../lib/api/client';

export function PluginsScreen() {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null);
  const [installLog, setInstallLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchPlugins = async () => {
    try {
      const data = await pluginsApi.getPlugins();
      setPlugins(data);
    } catch (err) {
      console.error('Failed to load plugins:', err);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  // Open a WebSocket to stream install logs when a plugin install is triggered
  useEffect(() => {
    if (!installingPlugin) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    setInstallLog([`Starting install for: ${installingPlugin}...`]);
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`${WS_BASE_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ops_log' && msg.data.skill_id === installingPlugin) {
          setInstallLog((prev) => [...prev, msg.data.log]);
          // Auto-scroll to bottom
          if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
          }
        }
      } catch (_) {
        // ignore non-JSON frames
      }
    };

    ws.onerror = () => {
      setInstallLog((prev) => [...prev, '[WebSocket error — check backend connection]']);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [installingPlugin]);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await pluginsApi.togglePlugin(id, !enabled);
      fetchPlugins();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleInstall = (id: string) => {
    setInstallingPlugin(id);
  };

  const handleCloseInstall = () => {
    setInstallingPlugin(null);
    setInstallLog([]);
  };

  return (
    <div className="max-w-5xl space-y-6 relative">
      <div>
        <h2 className="text-2xl font-bold text-white">Hermes Plugins</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage installed plugins from <code className="text-emerald-400">~/.hermes/plugins/</code>
        </p>
      </div>

      {plugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-sm">No plugins found in <code>~/.hermes/plugins/</code></p>
          <p className="text-xs mt-2">Create a plugin directory with a <code>manifest.json</code> to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plugins.map((p) => (
            <div
              key={p.name}
              className="bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-sm hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-gray-200 font-bold">{p.name}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full uppercase font-bold border ${
                    p.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {p.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-1">{p.description || 'No description provided.'}</p>
              <p className="text-xs text-gray-600 mb-4">
                by <span className="text-gray-400">{p.author || 'Unknown'}</span>
              </p>

              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400">v{p.version || '1.0'}</span>
                <div className="space-x-2 flex">
                  <button
                    id={`plugin-toggle-${p.name}`}
                    onClick={() => handleToggle(p.name, p.enabled)}
                    className="text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    {p.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {p.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    id={`plugin-install-${p.name}`}
                    onClick={() => handleInstall(p.name)}
                    className="text-blue-400 hover:text-blue-300 border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    <Terminal size={14} />
                    Install / Update
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Install log overlay */}
      {installingPlugin && (
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm flex justify-center items-center z-50 p-6">
          <div className="bg-gray-900 border border-emerald-500/50 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-200 flex items-center gap-2">
                <Terminal size={16} className="text-emerald-500" />
                Installing {installingPlugin}...
              </h3>
              <button
                id="plugin-install-close"
                onClick={handleCloseInstall}
                className="text-gray-400 hover:text-white"
                aria-label="Close install log"
              >
                <X size={18} />
              </button>
            </div>
            <div
              ref={logRef}
              className="flex-1 p-4 bg-gray-950 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap"
            >
              {installLog.length === 0 ? (
                <span className="text-gray-600">Waiting for log stream...</span>
              ) : (
                installLog.map((line, i) => (
                  <div key={i}>{line}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
