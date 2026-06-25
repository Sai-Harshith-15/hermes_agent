import React, { useState, useEffect } from 'react';
import { 
  Terminal, Bot, 
  Database, Globe, Settings, Search, Plus, 
  CheckCircle, Edit3, Save,
  Tv, Link, Shield, ToggleLeft
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';
import { controlApi } from '../../lib/api/control_api';
import { fetchApi, getConfigYaml, updateConfigYaml, getEnv, updateEnv, runOp } from '../../lib/api/client';
const Editor = React.lazy(() => import('@monaco-editor/react'));

export function ObsidianScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [] } = useQuery({
    queryKey: ['memorySearch', searchQuery],
    queryFn: () => hermesApi.searchMemory(searchQuery),
    enabled: searchQuery.length > 2
  });

  const { logs } = useSettingsStore();
  const memoryLogs = searchQuery.length > 2 ? searchResults : logs.filter(log => log.message.toLowerCase().includes("memory") || log.message.toLowerCase().includes("skill") || log.message.toLowerCase().includes("file"));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Obsidian Memory Layer</h2>
          <p className="text-sm text-gray-400">FTS5 SQLite indexed sessions & long-term knowledge retention.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Trigram search memories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-full pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 w-64" 
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Database size={16}/>
          <span>state.db WAL mode · ~45MB usage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memoryLogs.length > 0 ? (
            memoryLogs.map((log: any, idx: number) => (
              <div key={idx} className="bg-gray-950 border border-gray-800 p-5 rounded-lg hover:border-gray-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">#sqlite</span>
                  <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
                <h4 className="text-gray-200 font-medium text-sm mb-3 group-hover:text-emerald-400 transition-colors">{log.message}</h4>
                <div className="flex justify-between items-center border-t border-gray-800 pt-3 text-xs text-gray-500">
                  <span className="flex items-center"><Terminal size={12} className="mr-1"/> Log Sync</span>
                  <span>{log.source}</span>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-lg hover:border-gray-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">#architecture</span>
                  <span className="text-[10px] text-gray-500">2026-06-12</span>
                </div>
                <h4 className="text-gray-200 font-medium text-sm mb-3 group-hover:text-emerald-400 transition-colors">FastAPI SSE implementation decisions</h4>
              </div>
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-lg hover:border-gray-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">#bugfix</span>
                  <span className="text-[10px] text-gray-500">2026-06-11</span>
                </div>
                <h4 className="text-gray-200 font-medium text-sm mb-3 group-hover:text-emerald-400 transition-colors">Resolved execute_code RCE vulnerability</h4>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

