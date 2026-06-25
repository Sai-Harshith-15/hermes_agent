import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, LayoutDashboard, Terminal, Kanban, Key, Bot, 
  Network, Database, Globe, Settings, LogOut,
  ChevronRight, BarChart2,
  Tv, Link, Shield, Puzzle, Zap, Box, History, MessageCircle,
  ShieldAlert
} from 'lucide-react';

import { WS_BASE_URL, fetchDashboardState } from './lib/api/client';
import { useSettingsStore } from './store/settingsStore';
import { AppRoutes } from './routes';
import { PluginLoader } from './features/misc/PluginLoader';
import { login as apiLogin, fetchMe } from './lib/api/auth';
import { LoginScreen } from './features/auth/LoginScreen';
import { NavSection } from './components/layout/NavSection';
import { NavItem } from './components/layout/NavItem';
import { TopBar } from './components/layout/TopBar';
import { Toaster } from 'sonner';

export default function AgentCommandCenter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    setHostMetrics, setApiKeys, setAgentRuns, setTasks, setLogs,
    wsConnected, setWsConnected, updateApiKey, addLog, updateAgentRun, updateTask
  } = useSettingsStore();

  const currentScreen = location.pathname.substring(1) || 'dashboard';

  useEffect(() => {
    // Check if we are already authenticated via localStorage token
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      fetchMe().then(() => setIsAuthenticated(true)).catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      try {
        const data = await fetchDashboardState();
        if (data.host_metrics) setHostMetrics(data.host_metrics);
        if (data.api_keys && data.api_keys.length > 0) setApiKeys(data.api_keys);
        if (data.agent_runs) setAgentRuns(data.agent_runs);
        if (data.tasks) setTasks(data.tasks);
        if (data.logs) setLogs(data.logs);
      } catch (error) {
        console.warn("FastAPI backend is offline. Using client-side mock logs & metrics.", error);
      }
    };

    init();

    let isUnmounted = false;
    let ws: WebSocket;
    
    const connectWS = () => {
      if (isUnmounted) return;
      const token = localStorage.getItem('token');
      ws = new WebSocket(`${WS_BASE_URL}?token=${token}`);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          switch (type) {
            case "host_metrics":
              setHostMetrics(data);
              break;
            case "agent_log":
              addLog(data);
              break;
            case "api_key_status":
              updateApiKey(data);
              break;
            case "agent_run":
              updateAgentRun(data);
              break;
            case "task_status":
              updateTask(data);
              break;
            default:
              break;
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!isUnmounted) {
          setTimeout(connectWS, 5000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-300 font-sans overflow-hidden">
      <Toaster theme="dark" position="bottom-right" />
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-white font-bold">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-gray-100 font-bold text-lg leading-tight">Hermes Pulse</h1>
            <p className="text-xs text-emerald-400 font-mono">Zero-Cost Tier</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <NavSection title="System Overview">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="analytics" icon={BarChart2} label="Analytics" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="native-dashboard" icon={Tv} label="Native Dashboard" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="terminal" icon={Terminal} label="Hermes TUI" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="warden" icon={ShieldAlert} label="Warden Overseer" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="tunnels" icon={Globe} label="Tunnels & Deploy" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="checkpoints" icon={Database} label="System Rollbacks" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="channels" icon={Tv} label="Output Channels" current={currentScreen} set={(id) => navigate(`/${id}`)} />
          </NavSection>

          <NavSection title="Agent Core">
            <NavItem id="kanban" icon={Kanban} label="SWE Kanban" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="sandbox" icon={Terminal} label="Agent Sandbox" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="chat" icon={MessageCircle} label="Supervisor Chat" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="profiles" icon={Bot} label="Agent Profiles" current={currentScreen} set={(id) => navigate(`/${id}`)} />
          </NavSection>

          <NavSection title="Memory & Capability">
            <NavItem id="obsidian" icon={Database} label="Obsidian Memory" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="sessions" icon={History} label="Active Sessions" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="skills" icon={Zap} label="Learned Skills" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="plugins" icon={Puzzle} label="Hermes Plugins" current={currentScreen} set={(id) => navigate(`/${id}`)} />
          </NavSection>
          
          <NavSection title="Infrastructure">
            <NavItem id="models" icon={Box} label="Models (Ollama/Lite)" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="vault" icon={Key} label="API Vault (LiteLLM)" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="hooks" icon={Terminal} label="Shell Hooks" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="mcps" icon={Shield} label="MCP Snitch Security" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="webhooks" icon={Link} label="Webhooks" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="themes" icon={Puzzle} label="Dashboard Themes" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="settings" icon={Settings} label="System Config" current={currentScreen} set={(id) => navigate(`/${id}`)} />
          </NavSection>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center space-x-2 text-gray-500 hover:text-red-400 transition-colors w-full p-2 rounded hover:bg-gray-800">
            <LogOut size={16} />
            <span className="text-sm">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950 relative">
        <TopBar currentScreen={currentScreen} wsConnected={wsConnected} />
        <PluginLoader />
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}


