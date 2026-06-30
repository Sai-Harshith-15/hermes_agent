import { create } from 'zustand';

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
  hostMetrics: {},
  logs: [],
  wsConnected: false,
  setHostMetrics: (metrics) => set({ hostMetrics: metrics }),
  setLogs: (logs) => set({ logs: logs }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
