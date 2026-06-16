import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, LayoutDashboard, Terminal, Kanban, Key, Bot, 
  Network, Database, Globe, Settings, LogOut,
  ChevronRight, 
  Tv, Link, Shield, Puzzle, Zap, Box, History, MessageCircle,
  ShieldAlert
} from 'lucide-react';

import { WS_BASE_URL, fetchDashboardState } from './lib/api/client';
import { useDashboardStore } from './store/dashboardStore';
import { AppRoutes } from './routes';
import { login as apiLogin, fetchMe } from './lib/api/auth';

export default function AgentCommandCenter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    setHostMetrics, setApiKeys, setAgentRuns, setTasks, setLogs,
    wsConnected, setWsConnected, updateApiKey, addLog, updateAgentRun, updateTask
  } = useDashboardStore();

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

    let ws: WebSocket;
    const connectWS = () => {
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
        setTimeout(connectWS, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-300 font-sans overflow-hidden">
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
            <NavItem id="warden" icon={ShieldAlert} label="Warden Overseer" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="tunnels" icon={Globe} label="Tunnels & Deploy" current={currentScreen} set={(id) => navigate(`/${id}`)} />
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
            <NavItem id="mcps" icon={Shield} label="MCP Snitch Security" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            <NavItem id="webhooks" icon={Link} label="Webhooks" current={currentScreen} set={(id) => navigate(`/${id}`)} />
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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}

// --- UTILITY COMPONENTS ---

function NavSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

interface NavItemProps {
  id: string;
  icon: any;
  label: string;
  current: string;
  set: (id: string) => void;
}

function NavItem({ id, icon: Icon, label, current, set }: NavItemProps) {
  const isActive = current === id;
  return (
    <button
      onClick={() => set(id)}
      className={`w-full flex items-center space-x-3 px-5 py-2.5 text-sm transition-colors ${
        isActive ? 'bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function TopBar({ currentScreen, wsConnected }: { currentScreen: string, wsConnected: boolean }) {
  return (
    <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur shrink-0">
      <div className="flex items-center text-sm">
        <span className="text-gray-500">Hermes Environment</span>
        <ChevronRight size={14} className="mx-2 text-gray-600" />
        <span className="text-gray-200 font-medium capitalize">{currentScreen.replace('_', ' ')}</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-gray-300">Telemetry Feed: <span className={wsConnected ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'}>{wsConnected ? 'Connected' : 'Offline'}</span></span>
        </div>
        <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full border border-gray-700 shadow flex items-center justify-center text-xs font-bold text-white">
          OP
        </div>
      </div>
    </header>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiLogin(username, password);
      onLogin();
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
      
      <div className="z-10 w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Network size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Hermes Pulse</h2>
        <p className="text-sm text-center text-gray-400 mb-8">Secure multi-tenant orchestration gateway.</p>
        
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">USERNAME</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <span>Establish Connection</span>
            <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
