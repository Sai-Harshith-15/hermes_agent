import { API_BASE_URL as BASE_URL } from './client';

export const controlApi = {
  injectTask: async (task_spec: string, priority: string = "normal") => {
    const res = await fetch(`${BASE_URL}/control/inject-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_spec, priority })
    });
    return res.json();
  },
  steerAgent: async (agent_name: string, message: string) => {
    const res = await fetch(`${BASE_URL}/control/steer-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_name, message })
    });
    return res.json();
  }
};
