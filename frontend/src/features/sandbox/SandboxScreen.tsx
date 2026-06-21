import React, { useState, useRef, useEffect } from 'react';
import { Terminal, MessageSquare, Folder, File as FileIcon, Save, Shield } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { sendAdminIntervention } from '../../lib/api/client';
import { sandboxApi } from '../../lib/api/sandbox_api';
import { useQuery, useMutation } from '@tanstack/react-query';

export function SandboxScreen() {
  const { logs } = useDashboardStore();
  const [chatInput, setChatInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');

  const { data: files = [], refetch: refetchFiles, isError, error } = useQuery({
    queryKey: ['sandbox_files', currentPath],
    queryFn: () => sandboxApi.listFiles(currentPath)
  });

  const loadFileMutation = useMutation({
    mutationFn: (path: string) => sandboxApi.readFile(path),
    onSuccess: (data) => {
      setFileContent(data.content);
    }
  });

  const saveFileMutation = useMutation({
    mutationFn: (data: {path: string, content: string}) => sandboxApi.writeFile(data.path, data.content)
  });

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    loadFileMutation.mutate(path);
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      await saveFileMutation.mutateAsync({ path: selectedFile, content: fileContent });
      alert('File saved successfully!');
    } catch (e) {
      alert('Failed to save file.');
    }
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendAdminIntervention(chatInput).catch(() => {});
    setChatInput('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Sidebar: File Tree */}
      <div className="w-64 bg-gray-900 border border-gray-800 rounded-xl flex flex-col shrink-0 shadow-inner">
        <div className="p-3 border-b border-gray-800 flex justify-between items-center text-gray-200">
          <span className="font-semibold text-sm">File Explorer</span>
          <button className="text-gray-400 hover:text-emerald-500" onClick={() => refetchFiles()}>↺</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 text-sm text-gray-400 custom-scrollbar">
          {isError ? (
            <div className="p-4 text-center text-red-400 border border-red-900/50 bg-red-900/10 rounded-lg mx-2 mt-2 flex flex-col items-center">
              <Shield size={24} className="mb-2 opacity-70" />
              <p className="font-semibold text-xs mb-1">Sandbox Offline</p>
              <p className="text-[10px] leading-relaxed opacity-80">
                Connection to the local Docker socket failed. Ensure Docker is running and the Hermes agent container has volume mounting permissions for `/var/run/docker.sock`.
              </p>
            </div>
          ) : (
            <>
              {currentPath !== '' && (
                <div 
                  className="flex items-center space-x-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer"
                  onClick={() => {
                    const parts = currentPath.split('/');
                    parts.pop();
                    setCurrentPath(parts.join('/'));
                  }}
                >
                  <Folder size={14} className="text-emerald-500"/>
                  <span>..</span>
                </div>
              )}
              {files.map((file: any) => (
                <div 
                  key={file.path}
                  className={`flex items-center space-x-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer ${selectedFile === file.path ? 'bg-gray-800 text-emerald-400' : ''}`}
                  onClick={() => {
                    if (file.is_dir) {
                      setCurrentPath(file.path);
                    } else {
                      handleSelectFile(file.path);
                    }
                  }}
                >
                  {file.is_dir ? <Folder size={14} className="text-emerald-500"/> : <FileIcon size={14}/>}
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Code Editor */}
        <div className="flex-1 bg-[#1e1e1e] border border-gray-800 rounded-xl flex flex-col shadow-inner overflow-hidden">
          <div className="bg-gray-900 border-b border-gray-800 p-2 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-2 text-sm text-gray-300 font-mono">
              <FileIcon size={14} />
              <span>{selectedFile || 'No file selected'}</span>
            </div>
            <button 
              onClick={handleSaveFile}
              disabled={!selectedFile || saveFileMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 disabled:opacity-50"
            >
              <Save size={12}/> <span>{saveFileMutation.isPending ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
          <div className="flex-1 relative">
            {loadFileMutation.isPending ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-sm">Loading...</div>
            ) : selectedFile ? (
              <textarea 
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 outline-none resize-none custom-scrollbar"
                spellCheck={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-sm">Select a file to edit</div>
            )}
          </div>
        </div>

        {/* Terminal Area */}
        <div className="h-48 bg-black rounded-xl border border-gray-800 flex flex-col font-mono text-sm overflow-hidden relative shadow-inner shrink-0">
          <div className="bg-gray-900 border-b border-gray-800 p-2 flex items-center justify-between text-gray-400 text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <Terminal size={14} />
              <span>hermes_agent_container | Live Websocket Logs</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar text-emerald-400">
            {logs.map((log, i) => (
              <div key={i} className={`${log.log_level === 'ERROR' ? 'text-red-400' : log.log_level === 'WARNING' ? 'text-amber-400' : ''}`}>
                <span>[{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]</span> <span className="text-gray-400">{log.source}</span> {log.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Guide/Intervention Area */}
      <div className="w-80 bg-gray-900 rounded-xl border border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 bg-gray-800/50 rounded-t-xl">
          <h3 className="font-semibold text-gray-100 flex items-center"><MessageSquare size={16} className="mr-2"/> Agent Direction</h3>
          <p className="text-xs text-gray-400 mt-1">Intervene in active task loop</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mb-4">
            <p className="text-xs text-blue-300">You are securely connected via MCP Snitch. Commands bypass normal auth loops for direct supervision.</p>
          </div>
        </div>
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="flex flex-col space-y-3">
            <textarea 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. Stop the tests and focus on the CSS styling..."
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none h-24 custom-scrollbar"
            />
            <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center">
              Send Command
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
