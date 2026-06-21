import { API_BASE_URL as BASE_URL } from './client';

export const hermesApi = {
  getAgents: async () => {
    const res = await fetch(`${BASE_URL}/agents/`);
    return res.json();
  },
  getSessions: async (limit = 50) => {
    const res = await fetch(`${BASE_URL}/sessions/?limit=${limit}`);
    return res.json();
  },
  getMessages: async (sessionId: string) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`);
    return res.json();
  },
  getTasks: async () => {
    const res = await fetch(`${BASE_URL}/kanban/tasks`);
    return res.json();
  },
  getSkills: async () => {
    const res = await fetch(`${BASE_URL}/skills/`);
    return res.json();
  },
  searchMemory: async (query: string) => {
    const res = await fetch(`${BASE_URL}/memory/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },
  getProfiles: async () => {
    const res = await fetch(`${BASE_URL}/profiles/`);
    return res.json();
  },
  getConfig: async () => {
    const res = await fetch(`${BASE_URL}/profiles/config`);
    return res.json();
  },
  updateSoul: async (agentName: string, content: string) => {
    const res = await fetch(`${BASE_URL}/profiles/${agentName}/soul`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return res.json();
  },
  updateTaste: async (agentName: string, content: string) => {
    const res = await fetch(`${BASE_URL}/profiles/${agentName}/taste`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return res.json();
  }
};
