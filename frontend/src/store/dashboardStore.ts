import { create } from 'zustand';

interface DashboardState {
  hostMetrics: any;
  apiKeys: any[];
  agentRuns: any[];
  tasks: any[];
  logs: any[];
  wsConnected: boolean;
  setHostMetrics: (metrics: any) => void;
  setApiKeys: (keys: any[]) => void;
  addApiKey: (key: any) => void;
  updateApiKey: (key: any) => void;
  setAgentRuns: (runs: any[]) => void;
  updateAgentRun: (run: any) => void;
  setTasks: (tasks: any[]) => void;
  updateTask: (task: any) => void;
  setLogs: (logs: any[]) => void;
  addLog: (log: any) => void;
  setWsConnected: (connected: boolean) => void;
}

const MOCK_ORACLE_STATS = {
  cpu_usage: 18,
  ram_used: 14.2,
  ram_total: 24,
  storage_used: 45,
  storage_total: 200,
  daemon_status: 'Active (stress-ng nice -n 19)'
};

export const useDashboardStore = create<DashboardState>((set) => ({
  hostMetrics: MOCK_ORACLE_STATS,
  apiKeys: [],
  agentRuns: [],
  tasks: [],
  logs: [],
  wsConnected: false,
  setHostMetrics: (metrics) => set({ hostMetrics: metrics }),
  setApiKeys: (keys) => set({ apiKeys: keys }),
  addApiKey: (key) => set((state) => ({ apiKeys: [...state.apiKeys, key] })),
  updateApiKey: (key) => set((state) => {
    const idx = state.apiKeys.findIndex(k => k.id === key.id);
    if (idx !== -1) {
      const copy = [...state.apiKeys];
      copy[idx] = key;
      return { apiKeys: copy };
    }
    return { apiKeys: [...state.apiKeys, key] };
  }),
  setAgentRuns: (runs) => set({ agentRuns: runs }),
  updateAgentRun: (run) => set((state) => {
    const idx = state.agentRuns.findIndex(r => r.id === run.id);
    if (idx !== -1) {
      const copy = [...state.agentRuns];
      copy[idx] = run;
      return { agentRuns: copy };
    }
    return { agentRuns: [...state.agentRuns, run] };
  }),
  setTasks: (tasks) => set({ tasks: tasks }),
  updateTask: (task) => set((state) => {
    const idx = state.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      const copy = [...state.tasks];
      copy[idx] = task;
      return { tasks: copy };
    }
    return { tasks: [...state.tasks, task] };
  }),
  setLogs: (logs) => set({ logs: logs }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
