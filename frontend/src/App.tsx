import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    setHostMetrics, setLogs,
    wsConnected, setWsConnected, addLog
  } = useSettingsStore();

  const currentScreen = location.pathname.substring(1) || 'dashboard';

  useEffect(() => {
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
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-300 font-sans overflow-hidden select-none">
      <Toaster theme="dark" position="bottom-right" />
      
      {/* Avant-Garde Minimal Sidebar */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-64 flex flex-col shrink-0 bg-transparent border-none relative z-10 pl-4 py-4"
      >
        <div className="flex flex-col h-full bg-gray-900/40 backdrop-blur-3xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
          
          <div className="p-6 pb-2 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-gray-50 font-bold tracking-tight text-lg leading-tight">HERMES</h1>
              <p className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase mt-0.5">Zero-Cost Tier</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar space-y-6">
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
              <NavItem id="models" icon={Box} label="Models" current={currentScreen} set={(id) => navigate(`/${id}`)} />
              <NavItem id="vault" icon={Key} label="API Vault" current={currentScreen} set={(id) => navigate(`/${id}`)} />
              <NavItem id="hooks" icon={Terminal} label="Shell Hooks" current={currentScreen} set={(id) => navigate(`/${id}`)} />
              <NavItem id="mcps" icon={Shield} label="MCP Snitch Security" current={currentScreen} set={(id) => navigate(`/${id}`)} />
              <NavItem id="webhooks" icon={Link} label="Webhooks" current={currentScreen} set={(id) => navigate(`/${id}`)} />
              <NavItem id="themes" icon={Puzzle} label="Themes" current={currentScreen} set={(id) => navigate(`/${id}`)} />
              <NavItem id="settings" icon={Settings} label="System Config" current={currentScreen} set={(id) => navigate(`/${id}`)} />
            </NavSection>
          </nav>

          <div className="p-4 mx-4 mb-4 mt-2">
            <button 
              onClick={() => setIsAuthenticated(false)} 
              className="group flex items-center justify-center space-x-2 text-gray-400 hover:text-white transition-all w-full p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-semibold tracking-wide uppercase">Disconnect</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950 relative z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900/40 via-gray-950 to-gray-950 -z-10 pointer-events-none"></div>
        <TopBar currentScreen={currentScreen} wsConnected={wsConnected} />
        <PluginLoader />
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}



