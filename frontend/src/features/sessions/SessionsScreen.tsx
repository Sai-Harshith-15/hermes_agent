import React, { useState } from 'react';
import { Bot, Search, Clock, Cpu, Code2, Pause, Play, Trash2, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../../lib/api/sessions_api';
import { controlApi } from '../../lib/api/control_api';
import { toast } from 'sonner';

export function SessionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  const { data: liveSessions = [], isLoading } = useQuery({
    queryKey: ['sessions', searchQuery],
    queryFn: () => searchQuery 
      ? sessionsApi.searchSessions(searchQuery)
      : sessionsApi.getSessions(50)
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedSessionId],
    queryFn: () => sessionsApi.getMessages(selectedSessionId!),
    enabled: !!selectedSessionId
  });

  const activeSession = liveSessions.find((s: any) => s.id === selectedSessionId);
  const agentName = activeSession?.profile_name || 'Agent';

  const handleAction = async (action: 'pause' | 'resume' | 'kill') => {
    try {
      if (action === 'pause') {
        await controlApi.pauseAgent(agentName);
        toast.success(`Paused agent ${agentName}`);
      } else if (action === 'resume') {
        await controlApi.resumeAgent(agentName);
        toast.success(`Resumed agent ${agentName}`);
      } else if (action === 'kill') {
        await controlApi.killAgent(agentName);
        toast.success(`Killed agent ${agentName}`);
        setShowKillConfirm(false);
      }
    } catch (e) {
      toast.error(`Failed to ${action} agent: ${e}`);
    }
  };

  const handleInjectTask = async () => {
    if (!taskInput.trim()) return;
    try {
      await controlApi.injectTask(taskInput);
      toast.success("Task injected successfully!");
      setTaskInput('');
    } catch (e) {
      toast.error(`Failed to inject task: ${e}`);
    }
  };

  if (isLoading) return <div className="text-gray-400 p-6">Loading sessions from DB...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 relative">
      {/* KILL CONFIRM MODAL */}
      {showKillConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-red-500 mb-2">Kill Agent?</h3>
            <p className="text-sm text-gray-300 mb-6">Are you sure you want to forcefully terminate <strong>{agentName}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowKillConfirm(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
              >Cancel</button>
              <button 
                onClick={() => handleAction('kill')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
              >Terminate</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL */}
      <div className="w-1/3 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-800 bg-gray-800/30">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
              type="text"
              placeholder="Search sessions or logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <h3 className="font-medium text-gray-200 mt-2">Active Sessions</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {liveSessions.length === 0 ? (
            <div className="text-gray-500 text-center py-4 text-sm">No sessions found.</div>
          ) : (
            liveSessions.map((sess: any) => {
              const id = sess.id;
              const isActive = selectedSessionId === id;
              const date = new Date(sess.start_time).toLocaleString();
              const isRunning = sess.status === 'running' || sess.status === 'Active';

              return (
                <div 
                  key={id} 
                  onClick={() => setSelectedSessionId(id)}
                  className={`p-4 rounded-lg cursor-pointer border transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold flex items-center text-sm">
                      <Bot size={14} className="mr-2 text-emerald-400"/> 
                      {sess.profile_name || 'Agent'}
                    </h4>
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono truncate">{id}</p>
                  
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center"><Clock size={10} className="mr-1"/> {date}</span>
                    <span className="flex items-center truncate max-w-[100px]"><Cpu size={10} className="mr-1"/> {sess.model_route || 'Unknown'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col shadow-sm overflow-hidden relative">
        {selectedSessionId ? (
          <>
            <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between z-10 shadow-sm">
              <h3 className="font-medium text-gray-200 font-mono text-sm flex items-center">
                <Code2 size={16} className="mr-2 text-gray-400" />
                Session ID: {selectedSessionId}
              </h3>
              
              {/* FAB STEERING CONTROLS */}
              {activeSession && (activeSession.status === 'running' || activeSession.status === 'Active') && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction('pause')}
                    title="Pause Agent"
                    className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Pause size={16} />
                  </button>
                  <button 
                    onClick={() => handleAction('resume')}
                    title="Resume Agent"
                    className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Play size={16} />
                  </button>
                  <button 
                    onClick={() => setShowKillConfirm(true)}
                    title="Kill Agent"
                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-gray-950">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full text-emerald-500 animate-pulse">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">No messages recorded in this session.</div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const role = msg.role;
                  const isUser = role === 'user';
                  const isTool = role === 'tool';
                  
                  if (isTool) {
                    return (
                      <div key={i} className="flex justify-start">
                        <details className="group max-w-[85%] bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-sm">
                          <summary className="p-3 text-xs text-gray-400 hover:text-gray-200 list-none flex items-center justify-between select-none font-mono">
                            <div className="flex items-center">
                              <span className="mr-2 group-open:hidden text-gray-500">▶</span>
                              <span className="mr-2 hidden group-open:inline text-emerald-500">▼</span>
                              <span className="text-emerald-400 mr-2">🛠️ Executed</span>
                              <span className="text-gray-300 font-bold">{msg.tool_name || 'unknown_tool'}</span>
                            </div>
                            {msg.token_cost && (
                              <span className="bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-500">
                                {msg.token_cost} tok
                              </span>
                            )}
                          </summary>
                          <div className="p-4 border-t border-gray-800 bg-[#0d1117] text-[11px] text-gray-400 font-mono overflow-x-auto max-h-64 custom-scrollbar">
                            <pre className="whitespace-pre-wrap leading-relaxed">{msg.content || 'No output'}</pre>
                          </div>
                        </details>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-[80%] p-4 text-sm shadow-md leading-relaxed
                        ${isUser 
                          ? 'bg-blue-600 border border-blue-500 text-white rounded-2xl rounded-tr-sm' 
                          : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-2xl rounded-tl-sm'
                        }
                      `}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* TASK INPUT AREA */}
            {activeSession && (activeSession.status === 'running' || activeSession.status === 'Active') && (
              <div className="p-4 border-t border-gray-800 bg-gray-900">
                <div className="relative">
                  <textarea 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleInjectTask();
                      }
                    }}
                    placeholder="Steer agent or inject a new task... (Press Enter to send)"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-4 pr-12 py-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none h-14 custom-scrollbar"
                  />
                  <button 
                    onClick={handleInjectTask}
                    className="absolute right-3 top-3 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-950">
            <Bot size={48} className="text-gray-800 mb-4" />
            <p>Select a session to view the timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}
