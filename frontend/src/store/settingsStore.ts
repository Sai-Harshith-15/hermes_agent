import { create } from 'zustand';

const MOCK_ORACLE_STATS = {
  cpu_usage: 18,
  ram_used: 14.2,
  ram_total: 24,
  storage_used: 45,
  storage_total: 200,
  daemon_status: 'Active (stress-ng nice -n 19)'
};

interface SettingsState {
  hostMetrics: any;
  logs: any[];
  wsConnected: boolean;
  setHostMetrics: (metrics: any) => void;
  setLogs: (logs: any[]) => void;
  addLog: (log: any) => void;
  setWsConnected: (connected: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hostMetrics: MOCK_ORACLE_STATS,
  logs: [],
  wsConnected: false,
  setHostMetrics: (metrics) => set({ hostMetrics: metrics }),
  setLogs: (logs) => set({ logs: logs }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
