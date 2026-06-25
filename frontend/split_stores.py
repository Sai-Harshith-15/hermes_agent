import os
import re

base_dir = "d:/GitRepo/hermes_agent/frontend/src/store"
os.makedirs(base_dir, exist_ok=True)

# 1. settingsStore.ts
settings_code = """import { create } from 'zustand';

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
"""
with open(os.path.join(base_dir, 'settingsStore.ts'), 'w', encoding='utf-8') as f:
    f.write(settings_code)

# 2. vaultStore.ts
vault_code = """import { create } from 'zustand';

interface VaultState {
  apiKeys: any[];
  setApiKeys: (keys: any[]) => void;
  addApiKey: (key: any) => void;
  updateApiKey: (key: any) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  apiKeys: [],
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
  })
}));
"""
with open(os.path.join(base_dir, 'vaultStore.ts'), 'w', encoding='utf-8') as f:
    f.write(vault_code)

# 3. sessionStore.ts
session_code = """import { create } from 'zustand';

interface SessionState {
  agentRuns: any[];
  setAgentRuns: (runs: any[]) => void;
  updateAgentRun: (run: any) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  agentRuns: [],
  setAgentRuns: (runs) => set({ agentRuns: runs }),
  updateAgentRun: (run) => set((state) => {
    const idx = state.agentRuns.findIndex(r => r.id === run.id);
    if (idx !== -1) {
      const copy = [...state.agentRuns];
      copy[idx] = run;
      return { agentRuns: copy };
    }
    return { agentRuns: [...state.agentRuns, run] };
  })
}));
"""
with open(os.path.join(base_dir, 'sessionStore.ts'), 'w', encoding='utf-8') as f:
    f.write(session_code)

# 4. taskStore.ts
task_code = """import { create } from 'zustand';

interface TaskState {
  tasks: any[];
  setTasks: (tasks: any[]) => void;
  updateTask: (task: any) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks: tasks }),
  updateTask: (task) => set((state) => {
    const idx = state.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      const copy = [...state.tasks];
      copy[idx] = task;
      return { tasks: copy };
    }
    return { tasks: [...state.tasks, task] };
  })
}));
"""
with open(os.path.join(base_dir, 'taskStore.ts'), 'w', encoding='utf-8') as f:
    f.write(task_code)

# delete the original
dashboard_store_path = os.path.join(base_dir, 'dashboardStore.ts')
if os.path.exists(dashboard_store_path):
    os.remove(dashboard_store_path)

print("Stores split successfully.")
