import { fetchApi } from './client';

export const controlApi = {
  injectTask: async (task_spec: string, priority: string = "normal") => {
    return fetchApi('/control/inject-task', {
      method: 'POST',
      body: JSON.stringify({ task_spec, priority })
    });
  },
  steerAgent: async (agent_name: string, message: string) => {
    return fetchApi('/control/steer-agent', {
      method: 'POST',
      body: JSON.stringify({ agent_name, message })
    });
  },
  pauseAgent: async (agent_name: string) => {
    return fetchApi('/control/pause-agent', {
      method: 'POST',
      body: JSON.stringify({ agent_name })
    });
  },
  resumeAgent: async (agent_name: string) => {
    return fetchApi('/control/resume-agent', {
      method: 'POST',
      body: JSON.stringify({ agent_name })
    });
  },
  killAgent: async (agent_name: string) => {
    return fetchApi('/control/kill-agent', {
      method: 'POST',
      body: JSON.stringify({ agent_name })
    });
  }
};
