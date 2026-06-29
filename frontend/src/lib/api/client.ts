export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/telemetry`;
export const PTY_WS_URL = import.meta.env.VITE_PTY_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/pty`;

// ── Core API response shapes ─────────────────────────────────────────────────

export interface HostMetrics {
  cpu_pct: number;
  mem_pct: number;
  disk_pct: number;
  uptime_seconds?: number;
}

export interface AgentLog {
  ts: string;
  level: string;
  msg: string;
  agent?: string;
}

export interface DashboardState {
  host_metrics?: HostMetrics;
  logs?: AgentLog[];
  agent_count?: number;
  task_count?: number;
}

export interface ConfigContent {
  content: string;
}

export interface EnvContent {
  content: string;
}

export interface OpsResult {
  status: string;
  logs?: string;
}

// ── Generic fetch wrapper ────────────────────────────────────────────────────

export async function fetchApi<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401 && window.location.pathname !== '/') {
    localStorage.removeItem('token');
    window.location.href = '/';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// ── Typed convenience wrappers ───────────────────────────────────────────────

export async function fetchDashboardState(): Promise<DashboardState> {
  return fetchApi<DashboardState>('/dashboard/state');
}

export async function sendAdminIntervention(command: string) {
  return fetchApi('/control/inject-task', {
    method: 'POST',
    body: JSON.stringify({ task_spec: command, priority: 'high' }),
  });
}

export async function getConfigYaml(): Promise<ConfigContent> {
  return fetchApi<ConfigContent>('/config/yaml');
}

export async function updateConfigYaml(content: string): Promise<ConfigContent> {
  return fetchApi<ConfigContent>('/config/yaml', { method: 'PUT', body: JSON.stringify({ content }) });
}

export async function getEnv(): Promise<EnvContent> {
  return fetchApi<EnvContent>('/config/env');
}

export async function updateEnv(content: string): Promise<EnvContent> {
  return fetchApi<EnvContent>('/config/env', { method: 'PUT', body: JSON.stringify({ content }) });
}

export async function runOp(op: string): Promise<OpsResult> {
  return fetchApi<OpsResult>(`/ops/${op}`, { method: 'POST' });
}

