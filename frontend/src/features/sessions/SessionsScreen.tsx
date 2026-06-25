import React, { useState, useEffect } from 'react';
import { 
  Terminal, Bot, 
  Database, Globe, Settings, Search, Plus, 
  CheckCircle, Edit3, Save,
  Tv, Link, Shield, ToggleLeft
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';
import { controlApi } from '../../lib/api/control_api';
import { fetchApi, getConfigYaml, updateConfigYaml, getEnv, updateEnv, runOp } from '../../lib/api/client';
const Editor = React.lazy(() => import('@monaco-editor/react'));

export function SessionsScreen() {
  const { data: liveSessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => hermesApi.getSessions(50)
  });
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedSessionId],
    queryFn: () => hermesApi.getMessages(selectedSessionId!),
    enabled: !!selectedSessionId
  });

  const { agentRuns } = useDashboardStore();
  
  const sessionsToDisplay = liveSessions.length > 0 ? liveSessions : agentRuns;

  if (isLoading) return <div className="text-gray-400 p-6">Loading sessions from DB...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <div className="w-1/3 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-800 bg-gray-800/30">
          <h3 className="font-medium text-gray-200">Active Sessions</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {sessionsToDisplay.map((sess: any, i: number) => {
            const id = sess.id || sess.session_id || `unknown-${i}`;
            const isActive = selectedSessionId === id;
            return (
              <div 
                key={id} 
                onClick={() => setSelectedSessionId(id)}
                className={`p-4 rounded-lg cursor-pointer border transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold flex items-center text-sm"><Bot size={14} className="mr-2 text-emerald-400"/> {sess.agent_name || 'Agent'}</h4>
                  <span className={`w-2 h-2 rounded-full ${sess.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
                </div>
                <p className="text-xs text-gray-500 font-mono truncate">{id}</p>
                <p className="text-xs mt-2 text-gray-400 truncate">{sess.task || 'Executing Task...'}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col shadow-sm overflow-hidden">
        {selectedSessionId ? (
          <>
            <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
              <h3 className="font-medium text-gray-200 font-mono text-sm">Session ID: {selectedSessionId}</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 bg-gray-950">
              {isLoadingMessages ? (
                <div className="text-gray-500 text-center">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-500 text-center">No messages recorded in this session.</div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const isUser = msg.role === 'user';
                  const isTool = msg.role === 'tool' || msg.tool_calls;
                  
                  if (isTool) {
                    return (
                      <div key={i} className="flex justify-start">
                        <details className="group max-w-[85%] bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer">
                          <summary className="p-3 text-xs text-gray-400 hover:text-gray-200 list-none flex items-center select-none font-mono">
                            <span className="mr-2 group-open:hidden">▶</span>
                            <span className="mr-2 hidden group-open:inline">▼</span>
                            <span>🛠️ Executed {msg.name || 'tool_call'}</span>
                          </summary>
                          <div className="p-3 border-t border-gray-800 bg-gray-950 text-[10px] text-gray-500 font-mono overflow-x-auto max-h-48 custom-scrollbar">
                            <pre>{msg.content || JSON.stringify(msg.tool_calls, null, 2)}</pre>
                          </div>
                        </details>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-xl text-sm ${isUser ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-none' : 'bg-gray-800/50 border border-gray-700 text-gray-200 rounded-bl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a session to view chat history.
          </div>
        )}
      </div>
    </div>
  );
}

