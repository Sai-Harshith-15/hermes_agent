import React, { useState, useEffect, Suspense } from 'react';
import { 
  Terminal, Bot, 
  Database, Globe, Settings, Search, Plus, 
  CheckCircle, Edit3, Save,
  Tv, Link, Shield, ToggleLeft
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';
const Editor = React.lazy(() => import('@monaco-editor/react'));

export function ObsidianScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'MEMORY.md' | 'USER.md'>('search');
  const [fileContent, setFileContent] = useState('');

  const { data: searchResults = [] } = useQuery({
    queryKey: ['memorySearch', searchQuery],
    queryFn: () => hermesApi.searchMemory(searchQuery),
    enabled: searchQuery.length > 2
  });

  const { data: fileData, isFetching } = useQuery({
    queryKey: ['memoryFile', activeTab],
    queryFn: () => hermesApi.getMemoryFile(activeTab),
    enabled: activeTab !== 'search',
  });

  useEffect(() => {
    if (fileData) {
      setFileContent(fileData.content || '');
    }
  }, [fileData]);

  const saveMutation = useMutation({
    mutationFn: (content: string) => hermesApi.saveMemoryFile(activeTab, content),
  });

  const { logs } = useSettingsStore();
  const memoryLogs = searchQuery.length > 2 ? searchResults : logs.filter(log => log.message.toLowerCase().includes("memory") || log.message.toLowerCase().includes("skill") || log.message.toLowerCase().includes("file"));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Session Search & Memory</h2>
          <p className="text-sm text-gray-400">Search through previous session logs and manage memory files.</p>
        </div>
        {activeTab === 'search' && (
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
        )}
        {activeTab !== 'search' && (
          <button
            onClick={() => saveMutation.mutate(fileContent)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            disabled={saveMutation.isPending}
          >
            <Save size={16} />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save File'}</span>
          </button>
        )}
      </div>

      <div className="flex space-x-4 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('search')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'search' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          Search Sessions
        </button>
        <button
          onClick={() => setActiveTab('MEMORY.md')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'MEMORY.md' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          MEMORY.md
        </button>
        <button
          onClick={() => setActiveTab('USER.md')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'USER.md' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          USER.md
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-sm min-h-[500px]">
        {activeTab === 'search' ? (
          <>
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
                <div className="col-span-full text-center py-10 text-gray-500">
                  No results found. Start typing to search sessions.
                </div>
              )}
            </div>
          </>
        ) : (
          <Suspense fallback={<div className="text-gray-500 p-4">Loading editor...</div>}>
            {isFetching ? (
              <div className="text-gray-500 p-4">Loading file...</div>
            ) : (
              <div className="h-[500px] border border-gray-800 rounded overflow-hidden">
                <Editor
                  height="100%"
                  language="markdown"
                  theme="vs-dark"
                  value={fileContent}
                  onChange={(val) => setFileContent(val || '')}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    fontSize: 14,
                    padding: { top: 16 }
                  }}
                />
              </div>
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
}

