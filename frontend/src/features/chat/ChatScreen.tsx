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

export function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'system', content: 'You are securely connected to the Local SWE Supervisor.' }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Load chat history from the latest session
    fetchApi('/sessions?limit=1')
      .then(sessions => {
        if (sessions && sessions.length > 0) {
          const latestId = sessions[0].id || sessions[0].session_id;
          return fetchApi(`/sessions/${latestId}/messages`);
        }
        return [];
      })
      .then(history => {
        if (history && history.length > 0) {
          setMessages(prev => [...prev, ...history.map((m: any) => ({
            role: m.role || 'user',
            content: m.content || m.message
          }))]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Good evening. Shall I trigger the deployment pipeline?' }]);
        }
      })
      .catch(console.error);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    
    try {
      await controlApi.steerAgent('swe_lead', userMsg);
      setMessages(prev => [...prev, { role: 'system', content: 'Steering command dispatched to Hermes inbox.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: 'Failed to dispatch steering command.' }]);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-gray-100 flex items-center">Direct Supervisor Chat</h3>
          <p className="text-xs text-emerald-400 font-mono mt-0.5">swe_lead (Local Compute)</p>
        </div>
        <ToggleLeft size={24} className="text-gray-500 cursor-not-allowed"/>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-950">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : msg.role === 'system' ? 'bg-gray-800/50 text-gray-500 w-full text-center text-xs border border-gray-800 font-mono' : 'bg-gray-900 border border-gray-700 text-gray-200 rounded-bl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
        <form onSubmit={handleSend} className="flex space-x-4">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct the supervisor..." 
            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

