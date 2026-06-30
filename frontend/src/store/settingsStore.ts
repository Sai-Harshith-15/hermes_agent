import { create } from 'zustand';

const MOCK_ORACLE_STATS = {
  cpu_usage: 0,
  ram_used: 0,
  ram_total: 0,
  storage_used: 0,
  storage_total: 0,
  daemon_status: 'Offline'
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
