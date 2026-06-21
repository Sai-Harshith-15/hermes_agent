import { useState, useEffect } from 'react';
import { Database, Trash2, HardDrive } from 'lucide-react';
import { fetchApi } from '../../lib/api/client';

interface Checkpoint {
  filename: string;
  created_at: number;
  size_bytes: number;
}

export function CheckpointsScreen() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCheckpoints = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/ops/checkpoints');
      setCheckpoints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load checkpoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckpoints();
  }, []);

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await fetchApi(`/ops/checkpoints/${filename}`, { method: 'DELETE' });
      await loadCheckpoints();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100 flex items-center">
          <Database className="mr-2 text-emerald-500" /> System Checkpoints & Rollbacks
        </h2>
        <button onClick={loadCheckpoints} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors">
          Refresh List
        </button>
      </div>

      {error && <div className="text-red-400 bg-red-900/20 border border-red-500/50 p-3 rounded mb-4">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Scanning filesystem...</div>
        ) : checkpoints.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No checkpoints found in ~/.hermes/rollback/</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-gray-950/50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Filename</th>
                <th className="px-6 py-3 font-medium">Size</th>
                <th className="px-6 py-3 font-medium">Created At</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {checkpoints.map(cp => (
                <tr key={cp.filename} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-300 flex items-center">
                    <HardDrive size={14} className="mr-2 text-gray-500"/>
                    {cp.filename}
                  </td>
                  <td className="px-6 py-4">{formatBytes(cp.size_bytes)}</td>
                  <td className="px-6 py-4">{formatDate(cp.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(cp.filename)}
                      className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
                      title="Prune Checkpoint"
                    >
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
