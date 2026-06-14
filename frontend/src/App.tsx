import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, LayoutDashboard, Terminal, Kanban, Key, Bot, 
  Network, Database, Globe, Settings, LogOut, Search, Plus, 
  Play, Square, Server, HardDrive, Cpu, AlertTriangle, 
  CheckCircle, Clock, ChevronRight, MessageSquare, Edit3, Save,
  Tv, Link, Shield, Puzzle, Zap, Box, History, MessageCircle,
  ToggleLeft, Trash2, DownloadCloud
} from 'lucide-react';

const API_BASE_URL = "http://localhost:8000/api/v1";
const WS_BASE_URL = "ws://localhost:8000/ws/telemetry";

// Default/Fallback Mock Data
const MOCK_ORACLE_STATS = {
  cpu_usage: 18,
  ram_used: 14.2,
  ram_total: 24,
  storage_used: 45,
  storage_total: 200,
  daemon_status: 'Active (stress-ng nice -n 19)'
};

export default function AgentCommandCenter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  // Real-Time Dashboard State
  const [hostMetrics, setHostMetrics] = useState(MOCK_ORACLE_STATS);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [agentRuns, setAgentRuns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [wsConnected, setWsConnected] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ provider: '', model_name: '', api_key_masked: '', rpm_limit: 60 });
  const [showAddKey, setShowAddKey] = useState(false);

  // Fetch initial state & setup WebSocket
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchInitialState = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/state`);
        if (response.ok) {
          const data = await response.json();
          if (data.host_metrics) setHostMetrics(data.host_metrics);
          if (data.api_keys && data.api_keys.length > 0) setApiKeys(data.api_keys);
          if (data.agent_runs) setAgentRuns(data.agent_runs);
          if (data.tasks) setTasks(data.tasks);
          if (data.logs) setLogs(data.logs);
        }
      } catch (error) {
        console.warn("FastAPI backend is offline. Using client-side mock logs & metrics.", error);
      }
    };

    fetchInitialState();

    // Establish WebSocket Connection
    let ws: WebSocket;
    const connectWS = () => {
      ws = new WebSocket(WS_BASE_URL);

      ws.onopen = () => {
        setWsConnected(true);
        console.log("WebSocket connection established.");
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
              setLogs(prev => [...prev, data]);
              break;
            case "api_key_status":
              setApiKeys(prev => {
                const idx = prev.findIndex(k => k.id === data.id);
                if (idx !== -1) {
                  const copy = [...prev];
                  copy[idx] = data;
                  return copy;
                }
                return [...prev, data];
              });
              break;
            case "agent_run":
              setAgentRuns(prev => {
                const idx = prev.findIndex(r => r.id === data.id);
                if (idx !== -1) {
                  const copy = [...prev];
                  copy[idx] = data;
                  return copy;
                }
                return [...prev, data];
              });
              break;
            case "task_status":
              setTasks(prev => {
                const idx = prev.findIndex(t => t.id === data.id);
                if (idx !== -1) {
                  const copy = [...prev];
                  copy[idx] = data;
                  return copy;
                }
                return [...prev, data];
              });
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
        console.warn("WebSocket closed. Attempting reconnect in 5 seconds...");
        setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [isAuthenticated]);

  // Handle adding new API keys
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/telemetry/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyForm)
      });
      if (response.ok) {
        const addedKey = await response.json();
        setApiKeys(prev => [...prev, addedKey]);
        setNewKeyForm({ provider: '', model_name: '', api_key_masked: '', rpm_limit: 60 });
        setShowAddKey(false);
      }
    } catch (err) {
      console.error("Error saving API key:", err);
      // Client-side fallback if backend is offline
      setApiKeys(prev => [...prev, { ...newKeyForm, id: Date.now(), current_usage_pct: 0, status: 'Active' }]);
      setShowAddKey(false);
    }
  };

  // Inject Task helper
  const handleInjectTask = async () => {
    const title = prompt("Enter Task Title:");
    if (!title) return;
    const newTask = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      agent_name: 'backend_expert',
      status: 'Backlog'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/telemetry/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        const saved = await response.json();
        setTasks(prev => [...prev, saved]);
      }
    } catch (err) {
      setTasks(prev => [...prev, newTask]);
    }
  };

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
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="tunnels" icon={Globe} label="Tunnels & Deploy" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="channels" icon={Tv} label="Output Channels" current={currentScreen} set={setCurrentScreen} />
          </NavSection>

          <NavSection title="Agent Core">
            <NavItem id="kanban" icon={Kanban} label="SWE Kanban" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="sandbox" icon={Terminal} label="Agent Sandbox" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="chat" icon={MessageCircle} label="Supervisor Chat" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="profiles" icon={Bot} label="Agent Profiles" current={currentScreen} set={setCurrentScreen} />
          </NavSection>

          <NavSection title="Memory & Capability">
            <NavItem id="obsidian" icon={Database} label="Obsidian Memory" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="sessions" icon={History} label="Active Sessions" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="skills" icon={Zap} label="Learned Skills" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="plugins" icon={Puzzle} label="Hermes Plugins" current={currentScreen} set={setCurrentScreen} />
          </NavSection>
          
          <NavSection title="Infrastructure">
            <NavItem id="models" icon={Box} label="Models (Ollama/Lite)" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="vault" icon={Key} label="API Vault (LiteLLM)" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="mcps" icon={Shield} label="MCP Snitch Security" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="webhooks" icon={Link} label="Webhooks" current={currentScreen} set={setCurrentScreen} />
            <NavItem id="settings" icon={Settings} label="System Config" current={currentScreen} set={setCurrentScreen} />
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
          {currentScreen === 'dashboard' && <DashboardScreen hostMetrics={hostMetrics} apiKeys={apiKeys} logs={logs} />}
          {currentScreen === 'kanban' && <KanbanScreen tasks={tasks} onInjectTask={handleInjectTask} />}
          {currentScreen === 'sandbox' && <SandboxScreen logs={logs} />}
          {currentScreen === 'chat' && <ChatScreen />}
          {currentScreen === 'vault' && (
            <VaultScreen 
              apiKeys={apiKeys} 
              showAddKey={showAddKey} 
              setShowAddKey={setShowAddKey}
              newKeyForm={newKeyForm}
              setNewKeyForm={setNewKeyForm}
              handleAddKey={handleAddKey}
            />
          )}
          {currentScreen === 'profiles' && <ProfilesScreen agentRuns={agentRuns} />}
          {currentScreen === 'obsidian' && <ObsidianScreen logs={logs} />}
          {currentScreen === 'sessions' && <SessionsScreen agentRuns={agentRuns} />}
          {currentScreen === 'skills' && <SkillsScreen />}
          {currentScreen === 'plugins' && <PluginsScreen />}
          {currentScreen === 'tunnels' && <TunnelsScreen />}
          {currentScreen === 'channels' && <ChannelsScreen />}
          {currentScreen === 'models' && <ModelsScreen />}
          {currentScreen === 'mcps' && <MCPScreen />}
          {currentScreen === 'webhooks' && <WebhooksScreen />}
          {currentScreen === 'settings' && <SettingsScreen hostMetrics={hostMetrics} />}
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

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

// --- SCREENS ---

function LoginScreen({ onLogin }: { onLogin: () => void }) {
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
        
        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ACCESS TOKEN (JWT)</label>
            <input type="password" placeholder="ey..." className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" defaultValue="mock_jwt_token_123" />
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

function DashboardScreen({ hostMetrics, apiKeys, logs }: { hostMetrics: any, apiKeys: any[], logs: any[] }) {
  // Filter warnings and critical items from logs to display as alerts
  const alerts = logs
    .filter(log => log.log_level === 'WARNING' || log.log_level === 'ERROR')
    .slice(-3)
    .reverse();

  // Handle default active keys count
  const activeKeysCount = apiKeys.filter(k => k.status === 'Active' || k.status === 'Fallback Ready').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Oracle A1 CPU" value={`${hostMetrics.cpu_usage || 0}%`} icon={Cpu} subtext={hostMetrics.daemon_status || "Online"} color="text-blue-400" bgColor="bg-blue-500/10" />
        <StatCard title="Memory (RAM)" value={`${hostMetrics.ram_used || 0} / ${hostMetrics.ram_total || 24} GB`} icon={Server} subtext="Ollama GGUF Loaded" color="text-purple-400" bgColor="bg-purple-500/10" />
        <StatCard title="Block Storage" value={`${hostMetrics.storage_used || 0} / ${hostMetrics.storage_total || 200} GB`} icon={HardDrive} subtext="SQLite & Models" color="text-amber-400" bgColor="bg-amber-500/10" />
        <StatCard title="Active API Keys" value={`${activeKeysCount}`} icon={Bot} subtext={`${apiKeys.length} keys in rotation`} color="text-emerald-400" bgColor="bg-emerald-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center"><Activity className="mr-2 text-emerald-500" size={20}/> Pipeline Pulse (Active Jobs)</h3>
          <div className="space-y-4">
            <JobRow name="company_loop.sh" schedule="Every 5 mins" status="Running" lastRun="Active Now" type="System" />
            <JobRow name="yt_video_assembler" schedule="Daily @ 08:00" status="Sleeping" lastRun="14 hours ago" type="Media" />
            <JobRow name="liteLLM_budget_reset" schedule="Hourly" status="Completed" lastRun="45 mins ago" type="Network" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center"><AlertTriangle className="mr-2 text-amber-500" size={20}/> Telemetry Alerts</h3>
          <ul className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alt, i) => (
                <AlertItem key={i} text={`${alt.source}: ${alt.message}`} time="Real-Time" type={alt.log_level === 'ERROR' ? 'critical' : 'warning'} />
              ))
            ) : (
              <>
                <AlertItem text="DeepSeek API Key approaching RPM limit." time="10m ago" type="warning" />
                <AlertItem text="Oracle CPU dropped below 10% momentarily. NeverIdle engaged." time="3h ago" type="critical" />
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function KanbanScreen({ tasks, onInjectTask }: { tasks: any[], onInjectTask: () => void }) {
  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const Column = ({ title, tasksInCol, borderColor }: { title: string, tasksInCol: any[], borderColor: string }) => (
    <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-800 flex flex-col h-[70vh] min-w-[200px]">
      <div className={`p-3 border-t-4 ${borderColor} bg-gray-900 rounded-t-lg font-semibold text-gray-200 text-sm flex justify-between items-center`}>
        <span>{title}</span>
        <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs text-gray-400">{tasksInCol.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
        {tasksInCol.map(task => (
          <div key={task.id} className="bg-gray-800 border border-gray-700 p-3 rounded shadow-sm hover:border-gray-500 cursor-grab transition-colors">
            <p className="text-sm text-gray-200 mb-2">{task.title}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-mono">{task.id}</span>
              {task.agent_name && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md truncate max-w-[100px]">{task.agent_name}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">SWE Agile Loop</h2>
          <p className="text-sm text-gray-400">Autonomous code {'->'} test {'->'} review {'->'} deploy cycle.</p>
        </div>
        <button onClick={onInjectTask} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
          <Plus size={16} className="mr-2"/> Inject Task
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <Column title="Backlog" tasksInCol={getTasksByStatus('Backlog')} borderColor="border-gray-500" />
        <Column title="Coding" tasksInCol={getTasksByStatus('Coding')} borderColor="border-blue-500" />
        <Column title="Testing" tasksInCol={getTasksByStatus('Testing')} borderColor="border-purple-500" />
        <Column title="Code Review (Local)" tasksInCol={getTasksByStatus('Review')} borderColor="border-amber-500" />
        <Column title="Production/Deploy" tasksInCol={getTasksByStatus('Production')} borderColor="border-emerald-500" />
        <Column title="Error/Refactor" tasksInCol={getTasksByStatus('Error')} borderColor="border-red-500" />
      </div>
    </div>
  );
}

function SandboxScreen({ logs }: { logs: any[] }) {
  const [chatInput, setChatInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    // Mock user intervention to show up in log trace
    // In production, this can send intervention command to backend log api
    fetch(`${API_BASE_URL}/telemetry/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: '[ADMIN INTERVENTION]',
        message: chatInput,
        log_level: 'INFO'
      })
    }).catch(() => {});
    setChatInput('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Terminal Area */}
      <div className="flex-1 bg-black rounded-xl border border-gray-800 flex flex-col font-mono text-sm overflow-hidden relative shadow-inner">
        <div className="bg-gray-900 border-b border-gray-800 p-2 flex items-center justify-between text-gray-400 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <Terminal size={14} />
            <span>hermes_agent_container | Live Websocket Logs</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Connected to feed</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar text-emerald-400">
          {logs.map((log, i) => (
            <div key={i} className={`${log.log_level === 'ERROR' ? 'text-red-400' : log.log_level === 'WARNING' ? 'text-amber-400' : ''} ${log.source === '[ADMIN INTERVENTION]' ? 'text-blue-400 font-bold' : ''}`}>
              <span>[{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]</span> <span className="text-gray-400">{log.source}</span> {log.message}
            </div>
          ))}
          <div ref={logEndRef} />
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

interface VaultScreenProps {
  apiKeys: any[];
  showAddKey: boolean;
  setShowAddKey: (show: boolean) => void;
  newKeyForm: any;
  setNewKeyForm: (form: any) => void;
  handleAddKey: (e: React.FormEvent) => void;
}

function VaultScreen({ apiKeys, showAddKey, setShowAddKey, newKeyForm, setNewKeyForm, handleAddKey }: VaultScreenProps) {
  // Load local fallbacks if empty
  const keysToDisplay = apiKeys.length > 0 ? apiKeys : [
    { id: 1, provider: 'OpenCode Zen', model_name: 'opencode/big-pickle', api_key_masked: 'sk-zen-...f8a2', rpm_limit: 60, current_usage_pct: 45, status: 'Active' },
    { id: 2, provider: 'DeepSeek', model_name: 'deepseek-chat', api_key_masked: 'sk-dps-...91x', rpm_limit: 100, current_usage_pct: 80, status: 'Rate-Limited' },
    { id: 3, provider: 'OpenRouter', model_name: 'google/gemini-pro', api_key_masked: 'sk-opr-...zz1', rpm_limit: 20, current_usage_pct: 5, status: 'Fallback Ready' },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">API Key Vault & LiteLLM Routing</h2>
          <p className="text-sm text-gray-400">Manage free-tier keys, fallback mechanisms, and token economics.</p>
        </div>
        <button 
          onClick={() => setShowAddKey(!showAddKey)} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-1"/> Add Key
        </button>
      </div>

      {showAddKey && (
        <form onSubmit={handleAddKey} className="bg-gray-900 border border-emerald-500/30 p-5 rounded-xl mb-6 space-y-4 max-w-lg">
          <h3 className="text-md font-bold text-white">Register New Key Pool</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">PROVIDER</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. OpenCode" 
                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white"
                value={newKeyForm.provider}
                onChange={e => setNewKeyForm({...newKeyForm, provider: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">MODEL ROUTE</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. deepseek-chat" 
                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white"
                value={newKeyForm.model_name}
                onChange={e => setNewKeyForm({...newKeyForm, model_name: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">API KEY (MASKED)</label>
            <input 
              type="text" 
              required 
              placeholder="sk-zen-...f8a2" 
              className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white"
              value={newKeyForm.api_key_masked}
              onChange={e => setNewKeyForm({...newKeyForm, api_key_masked: e.target.value})}
            />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm transition-colors">
            Save Key Pool
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Load Balancing</h4>
          <p className="text-xl text-gray-100 font-semibold">simple-shuffle</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Active Proxies</h4>
          <p className="text-xl text-gray-100 font-semibold">{keysToDisplay.filter(k => k.status === 'Active').length} / {keysToDisplay.length} Pools</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Global Fallback</h4>
          <p className="text-xl text-amber-400 font-semibold text-sm">Ollama (Gemma-4-12b)</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900/50 text-xs uppercase text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">Provider & Model</th>
                <th className="px-6 py-4 font-medium">API Key (AES-256)</th>
                <th className="px-6 py-4 font-medium">RPM Load</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {keysToDisplay.map((key: any, i: number) => (
                <tr key={key.id || i} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-200">{key.provider}</p>
                    <p className="text-xs text-gray-500">{key.model_name}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{key.api_key_masked}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{Math.round(key.current_usage_pct || 0)}%</span>
                      <span>{key.rpm_limit} max</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${(key.current_usage_pct || 0) > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${key.current_usage_pct || 0}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full border ${
                      key.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      key.status === 'Rate-Limited' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {key.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-500 hover:text-gray-300 p-1"><Settings size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProfilesScreen({ agentRuns }: { agentRuns: any[] }) {
  const defaultProfiles = agentRuns.length > 0 ? agentRuns : [
    { id: 'sess_1', profile_name: 'swe_lead', role: 'Local SWE Supervisor', model_route: 'Ollama: gemma-4-12b', status: 'Idle' },
    { id: 'sess_2', profile_name: 'backend_expert', role: 'System Architect & Coder', model_route: 'LiteLLM: opencode/big-pickle', status: 'Active' },
    { id: 'sess_3', profile_name: 'yt_writer', role: 'Content Writer', model_route: 'LiteLLM: deepseek-chat', status: 'Idle' },
  ];
  
  const [selectedProfile, setSelectedProfile] = useState<any>(defaultProfiles[0]);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* List */}
      <div className="w-1/3 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
          <h3 className="font-medium text-gray-200">Execution Profiles</h3>
          <button className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors"><Plus size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {defaultProfiles.map((p, i) => (
            <div 
              key={p.id || i} 
              onClick={() => setSelectedProfile(p)}
              className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedProfile.profile_name === p.profile_name ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold font-mono text-sm">{p.profile_name}</h4>
                <span className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
              </div>
              <p className="text-xs opacity-70 mb-1">{p.role}</p>
              <p className="text-[10px] font-mono bg-black/30 inline-block px-1.5 py-0.5 rounded text-gray-400">{p.model_route}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit View */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
          <div className="flex items-center space-x-2">
            <Edit3 size={16} className="text-gray-400"/>
            <h3 className="font-medium text-gray-200 font-mono">{selectedProfile.profile_name} Configuration</h3>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-2">
            <Save size={14}/> <span>Save</span>
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Role</label>
              <input type="text" value={selectedProfile.role} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 outline-none" readOnly/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Target Model Route</label>
              <select className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 outline-none" defaultValue={selectedProfile.model_route}>
                <option>Ollama: gemma-4-12b</option>
                <option>LiteLLM: opencode/big-pickle</option>
                <option>LiteLLM: deepseek-chat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 flex justify-between">
              <span>soul.md (System Instructions)</span>
              <span className="text-emerald-500">MCP Sandbox Active</span>
            </label>
            <textarea 
              className="w-full h-64 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 focus:border-emerald-500 outline-none resize-none custom-scrollbar"
              defaultValue={`You are the ${selectedProfile.role}. You evaluate code submitted by Layer 3 agents. Reject any code containing infinite loops or missing unit tests. Return ONLY a structured JSON response.`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Enabled Tools</label>
            <div className="flex flex-wrap gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs cursor-pointer">execute_code</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs cursor-pointer">read_file</span>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded-full text-xs cursor-pointer">terminal</span>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded-full text-xs cursor-pointer">session_search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ObsidianScreen({ logs }: { logs: any[] }) {
  // Filter memory updates
  const memoryLogs = logs.filter(log => log.message.toLowerCase().includes("memory") || log.message.toLowerCase().includes("skill") || log.message.toLowerCase().includes("file"));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Obsidian Memory Layer</h2>
          <p className="text-sm text-gray-400">FTS5 SQLite indexed sessions & long-term knowledge retention.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Trigram search memories..." className="bg-gray-900 border border-gray-800 rounded-full pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 w-64" />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Database size={16}/>
          <span>state.db WAL mode · ~45MB usage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memoryLogs.length > 0 ? (
            memoryLogs.map((log, idx) => (
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
                <div className="flex justify-between items-center border-t border-gray-800 pt-3 text-xs text-gray-500">
                  <span className="flex items-center"><Terminal size={12} className="mr-1"/> Session Context</span>
                  <span>1200 tkns</span>
                </div>
              </div>
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-lg hover:border-gray-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">#bugfix</span>
                  <span className="text-[10px] text-gray-500">2026-06-11</span>
                </div>
                <h4 className="text-gray-200 font-medium text-sm mb-3 group-hover:text-emerald-400 transition-colors">Resolved execute_code RCE vulnerability</h4>
                <div className="flex justify-between items-center border-t border-gray-800 pt-3 text-xs text-gray-500">
                  <span className="flex items-center"><Terminal size={12} className="mr-1"/> Session Context</span>
                  <span>450 tkns</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionsScreen({ agentRuns }: { agentRuns: any[] }) {
  const sessionsToDisplay = agentRuns.length > 0 ? agentRuns : [
    { id: 'sess_9a8b7', profile_name: 'swe_lead', role: 'Local SWE Supervisor', model_route: 'Ollama: gemma-4-12b', status: 'Active' },
    { id: 'sess_3f2e1', profile_name: 'yt_writer', role: 'Content Writer', model_route: 'LiteLLM: deepseek-chat', status: 'Idle' },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Active Agent Sessions</h2>
          <p className="text-sm text-gray-400">Live hermes-cli and API task loops currently executing on Oracle host.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessionsToDisplay.map((sess, i) => (
          <div key={sess.id || i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${sess.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-gray-200 font-bold flex items-center"><Bot size={16} className="mr-2 text-emerald-400"/> {sess.profile_name}</h4>
                <p className="text-xs text-gray-500 font-mono mt-1">{sess.id}</p>
              </div>
              <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${sess.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                {sess.status}
              </span>
            </div>
            <p className="text-sm text-gray-300 bg-gray-950 p-3 rounded border border-gray-800 mb-4">{sess.role} running on route: {sess.model_route}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="flex items-center"><Clock size={12} className="mr-1"/> Active Connection Feed</span>
              <button className="text-emerald-500 hover:text-emerald-400 font-medium">Connect Sandbox</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatScreen() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are securely connected to the Local SWE Supervisor (gemma-4-12b via Ollama). API cost: $0.00.' },
    { role: 'assistant', content: 'Good evening. The backend_expert has successfully implemented the SSE streaming logic. Floci AWS tests passed. Shall I trigger the deployment pipeline?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Acknowledged. Routing instruction to the DevOps expert to package the Docker container and push to the Cloudflare Tunnel.' }]);
    }, 1000);
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
            <div className={`max-w-[70%] p-4 rounded-xl text-sm ${
              msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 
              msg.role === 'system' ? 'bg-gray-800/50 text-gray-500 w-full text-center text-xs border border-gray-800 font-mono' :
              'bg-gray-900 border border-gray-700 text-gray-200 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
        <form onSubmit={handleSend} className="flex space-x-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
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

function TunnelsScreen() {
  const defaultTunnels = [
    { id: 1, name: 'mayura_tunnel', url: 'https://saas-dashboard-xyz.trycloudflare.com', target: 'localhost:3000', status: 'Online' },
    { id: 2, name: 'floci_api', url: 'http://localhost:4566', target: 'Local AWS Emulation', status: 'Online' }
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Production Tunnels & Floci</h2>
        <p className="text-sm text-gray-400">Zero-cost local AWS emulation and Cloudflare Edge routing.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Service Name</th>
              <th className="px-6 py-4 font-medium">Public/Local Endpoint</th>
              <th className="px-6 py-4 font-medium">Target / Route</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {defaultTunnels.map(tunnel => (
              <tr key={tunnel.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">{tunnel.name}</td>
                <td className="px-6 py-4">
                  <a href="#" className="text-blue-400 hover:underline flex items-center">
                    {tunnel.url} <Globe size={12} className="ml-1"/>
                  </a>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{tunnel.target}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center text-emerald-400 text-xs font-bold uppercase"><CheckCircle size={14} className="mr-1"/> {tunnel.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 flex items-start space-x-4">
        <AlertTriangle size={24} className="text-blue-400 shrink-0"/>
        <div>
          <h4 className="text-blue-300 font-medium mb-1">Floci S3 Emulation Active</h4>
          <p className="text-sm text-blue-400/80">The DevOps agent is currently mapping build artifacts to the local Floci container on port 4566. GitHub Action minutes remain untouched.</p>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ hostMetrics }: { hostMetrics: any }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Configuration</h2>
        <p className="text-sm text-gray-400">Manage MCP proxies, UI constraints, and global integrations.</p>
      </div>

      <div className="space-y-4">
        <SettingsCard 
          title="Global Context Compression" 
          desc="Auto-compress logs when token limit reaches 80% to save LiteLLM budgets."
          status="Enabled"
        />
        <SettingsCard 
          title="Oracle NeverIdle Daemon" 
          desc={`Maintains CPU load > 10% using stress-ng via cron. Current Load: ${hostMetrics.cpu_usage || 0}%`}
          status="Active"
        />
        <SettingsCard 
          title="Edge-TTS Binding" 
          desc="Microsoft Text-to-Speech python wrapper for zero-cost voiceovers."
          status="Operational"
        />
      </div>
    </div>
  );
}

function ChannelsScreen() {
  const channels = [
    { id: 1, platform: 'YouTube API v3', name: 'Auto_Tech_Shorts', status: 'Connected', quota: '450/10000', nextCron: '08:00 AM' },
    { id: 2, platform: 'X / Twitter API', name: '@TechShortsAI', status: 'Rate Limited', quota: '50/50', nextCron: 'Cooldown (1hr)' },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Output Channels</h2>
          <p className="text-sm text-gray-400">Manage automated deployments to YouTube, X, and other platforms.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
          <Plus size={16} className="mr-2"/> Connect Channel
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Platform</th>
              <th className="px-6 py-4 font-medium">Account Name</th>
              <th className="px-6 py-4 font-medium">API Quota Usage</th>
              <th className="px-6 py-4 font-medium">Next Cron Upload</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {channels.map(ch => (
              <tr key={ch.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center"><Tv size={16} className="mr-2 text-gray-500"/>{ch.platform}</td>
                <td className="px-6 py-4 font-mono text-emerald-400">{ch.name}</td>
                <td className="px-6 py-4 text-xs">{ch.quota}</td>
                <td className="px-6 py-4 text-xs flex items-center"><Clock size={12} className="mr-1"/> {ch.nextCron}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded uppercase font-bold border ${ch.status.includes('Rate') ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                    {ch.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WebhooksScreen() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Webhooks & Alerts</h2>
        <p className="text-sm text-gray-400">Configure outbound notifications for pipeline events.</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-16">
        <Link size={48} className="text-gray-600 mb-2"/>
        <h3 className="text-xl font-bold text-gray-300">No Webhooks Configured</h3>
        <p className="text-gray-500 max-w-md">Connect Discord or Telegram to receive real-time alerts when the DevOps agent pushes to production or if the YouTube quota fails.</p>
        <button className="bg-emerald-600/20 text-emerald-400 border border-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors px-6 py-2 rounded-lg text-sm font-medium mt-4">
          Create New Webhook
        </button>
      </div>
    </div>
  );
}

function MCPScreen() {
  const whitelists = [
    { id: 1, resource: 'FileSystem (Read/Write)', path: '/app/frontend/src', status: 'Whitelisted', hits: 142 },
    { id: 2, resource: 'FileSystem (Read)', path: '/root/.ssh', status: 'Blocked (Snitch)', hits: 3 },
    { id: 3, resource: 'API Wrapper', path: 'api.github.com/repos', status: 'Whitelisted', hits: 56 },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center"><Shield className="mr-2 text-emerald-500"/> MCP Snitch Security</h2>
          <p className="text-sm text-gray-400">Model Context Protocol proxy whitelisting & LLM-as-Judge firewall.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Proxy Status</h4>
          <p className="text-xl text-emerald-400 font-semibold flex items-center"><CheckCircle size={18} className="mr-2"/> Active</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Blocked Tool Calls</h4>
          <p className="text-xl text-red-400 font-semibold">12 Attempts</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-gray-400 text-sm font-medium mb-1">Judge Model</h4>
          <p className="text-xl text-gray-100 font-semibold text-sm">Ollama: gemma-4-12b</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-800 bg-gray-800/30">
          <h3 className="font-medium text-gray-200">Whitelisted Resources</h3>
        </div>
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-900/50 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Resource Type</th>
              <th className="px-6 py-4 font-medium">Path / Constraint</th>
              <th className="px-6 py-4 font-medium">Action Hits</th>
              <th className="px-6 py-4 font-medium">Proxy Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {whitelists.map(mcp => (
              <tr key={mcp.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-gray-200">{mcp.resource}</td>
                <td className="px-6 py-4 font-mono text-xs">{mcp.path}</td>
                <td className="px-6 py-4">{mcp.hits}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded uppercase font-bold border ${mcp.status.includes('Blocked') ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                    {mcp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PluginsScreen() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Hermes Plugins</h2>
        <p className="text-sm text-gray-400">Extend core agent functionality via third-party integrations.</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <SettingsCard title="Floci AWS Emulation Plugin" desc="Allows agents to interface with local S3/Dynamo DB mocks." status="Enabled" />
        <SettingsCard title="Pixelle-Video Automator" desc="Converts generated script output directly to FFmpeg commands." status="Enabled" />
        <SettingsCard title="Social Media Scraper" desc="Pulls trends from Reddit & X APIs for the YouTube workflow." status="Enabled" />
      </div>
    </div>
  );
}

function SkillsScreen() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Learned Skills</h2>
          <p className="text-sm text-gray-400">Custom python tools written and permanently memorized by Hermes agents.</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="p-4 bg-gray-950 border border-gray-800 rounded flex justify-between items-center group hover:border-emerald-500/50 transition-colors cursor-pointer">
          <div>
            <h4 className="text-emerald-400 font-mono text-sm mb-1">analyze_git_diff.py</h4>
            <p className="text-xs text-gray-500">Skill created by swe_lead to review PRs against local guidelines.</p>
          </div>
          <Bot size={16} className="text-gray-600 group-hover:text-emerald-500"/>
        </div>
        <div className="p-4 bg-gray-950 border border-gray-800 rounded flex justify-between items-center group hover:border-emerald-500/50 transition-colors cursor-pointer">
          <div>
            <h4 className="text-emerald-400 font-mono text-sm mb-1">render_tts_subtitles.py</h4>
            <p className="text-xs text-gray-500">Video Editor skill to hardcode Edge-TTS outputs into .mp4 files.</p>
          </div>
          <Bot size={16} className="text-gray-600 group-hover:text-emerald-500"/>
        </div>
      </div>
    </div>
  );
}

function ModelsScreen() {
  const models = [
    { id: 1, name: 'gemma-4-12b', provider: 'Ollama (Local)', size: '8.2 GB GGUF', status: 'Loaded in RAM' },
    { id: 2, name: 'llama-3-8b', provider: 'Ollama (Local)', size: '4.7 GB GGUF', status: 'Disk Standby' },
    { id: 3, name: 'opencode/big-pickle', provider: 'LiteLLM Proxy', size: 'API', status: 'Active Routing' },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Model Registry</h2>
          <p className="text-sm text-gray-400">Manage local Ollama GGUFs vs LiteLLM Proxy routes.</p>
        </div>
        <div className="space-x-3">
          <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 flex items-center inline-flex">
            <DownloadCloud size={16} className="mr-2"/> Pull Local Model
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Model Designation</th>
              <th className="px-6 py-4 font-medium">Provider Type</th>
              <th className="px-6 py-4 font-medium">Size / Resource</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {models.map(model => (
              <tr key={model.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-200">{model.name}</td>
                <td className="px-6 py-4">{model.provider}</td>
                <td className="px-6 py-4 font-mono text-xs">{model.size}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded border ${model.status.includes('RAM') || model.status.includes('Active') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {model.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-500 hover:text-red-400 p-1 transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- UTILITY COMPONENTS ---

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, subtext, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-100 mb-1">{value}</p>
      <p className="text-xs text-gray-500 truncate">{subtext}</p>
    </div>
  );
}

function JobRow({ name, schedule, status, lastRun, type }: { name: string, schedule: string, status: string, lastRun: string, type: string }) {
  const isRunning = status === 'Running';
  return (
    <div className="flex items-center justify-between bg-gray-950 p-3 rounded-lg border border-gray-800">
      <div className="flex items-center space-x-3">
        {isRunning ? <Play size={16} className="text-emerald-500" /> : <Square size={16} className="text-gray-600" />}
        <div>
          <p className="text-sm font-medium text-gray-200">{name}</p>
          <p className="text-[10px] text-gray-500 font-mono">{schedule} • {type}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>{status}</span>
        <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-end"><Clock size={10} className="mr-1"/> {lastRun}</p>
      </div>
    </div>
  );
}

function AlertItem({ text, time, type }: { text: string, time: string, type: 'warning' | 'info' | 'critical' }) {
  const colors = {
    warning: 'border-amber-500/50 text-amber-400',
    info: 'border-blue-500/50 text-blue-400',
    critical: 'border-red-500/50 text-red-400'
  };
  return (
    <li className={`flex flex-col bg-gray-950 p-3 rounded-lg border-l-4 ${colors[type]} text-sm`}>
      <span>{text}</span>
      <span className="text-[10px] text-gray-500 mt-1 uppercase">{time}</span>
    </li>
  );
}

function SettingsCard({ title, desc, status }: { title: string, desc: string, status: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 flex justify-between items-center shadow-sm hover:border-gray-700 transition-colors cursor-pointer">
      <div>
        <h4 className="text-gray-200 font-medium">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-emerald-400 mb-2">{status}</span>
        <button className="text-gray-400 hover:text-gray-200 text-sm flex items-center"><Edit3 size={14} className="mr-1"/> Edit</button>
      </div>
    </div>
  );
}
