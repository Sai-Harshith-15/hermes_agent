export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/telemetry`;
export const PTY_WS_URL = import.meta.env.VITE_PTY_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/pty`;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
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
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDashboardState() {
  return fetchApi('/dashboard/state');
}

export async function addApiKey(keyData: any) {
  return fetchApi('/telemetry/key', {
    method: 'POST',
    body: JSON.stringify(keyData),
  });
}

export async function sendAdminIntervention(command: string) {
  return fetchApi('/admin/intervene', {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
}

export async function injectTask(taskData: any) {
  return fetchApi('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function getConfigYaml() {
  return fetchApi('/config/yaml');
}

export async function updateConfigYaml(content: string) {
  return fetchApi('/config/yaml', { method: 'PUT', body: JSON.stringify({ content }) });
}

export async function getEnv() {
  return fetchApi('/config/env');
}

export async function updateEnv(content: string) {
  return fetchApi('/config/env', { method: 'PUT', body: JSON.stringify({ content }) });
}

export async function runOp(op: string) {
  return fetchApi(`/ops/${op}`, { method: 'POST' });
}
