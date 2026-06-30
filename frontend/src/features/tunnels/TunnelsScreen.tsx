import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle } from 'lucide-react';
import { tunnelsApi } from '../../lib/api/tunnels_api';

export function TunnelsScreen() {
  const [tunnels, setTunnels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tunnelsApi.getTunnelUrl()
      .then(res => {
        if (res.url) {
          setTunnels(prev => [
            { id: 1, name: 'cloudflare_tunnel', url: res.url, target: 'frontend:80', status: 'Online' },
            ...prev
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Production Tunnels & Floci</h2>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Scanning active tunnels...</div> : (
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
            {tunnels.map(tunnel => (
              <tr key={tunnel.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">{tunnel.name}</td>
                <td className="px-6 py-4"><a href={tunnel.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center">{tunnel.url} <Globe size={12} className="ml-1"/></a></td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{tunnel.target}</td>
                <td className="px-6 py-4"><span className="flex items-center text-emerald-400 text-xs font-bold uppercase"><CheckCircle size={14} className="mr-1"/> {tunnel.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

