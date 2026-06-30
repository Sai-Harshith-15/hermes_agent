import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api/client';

export function ModelsScreen() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/vault')
      .then(res => setModels(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-bold text-white">Model Registry</h2></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? <div className="p-8 text-center text-gray-500">Scanning configured models...</div> : (
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Provider / Model</th>
              <th className="px-6 py-4 font-medium">Key ID</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {models.map((model, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-200 capitalize">{model.provider}</td>
                <td className="px-6 py-4 font-mono">{model.key_id}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded border ${model.key_id !== 'None' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{model.key_id !== 'None' ? 'Active' : 'Unconfigured'}</span></td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No model providers configured in vault.</td></tr>
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

