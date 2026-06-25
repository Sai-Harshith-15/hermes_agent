import { API_BASE_URL as BASE_URL } from './client';

export const sessionsApi = {
  getSessions: async (limit = 50) => {
    const res = await fetch(`${BASE_URL}/sessions/?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch sessions");
    return res.json();
  },
  getSessionDetail: async (sessionId: string) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}`);
    if (!res.ok) throw new Error("Failed to fetch session detail");
    return res.json();
  },
  getMessages: async (sessionId: string) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },
  searchSessions: async (query: string) => {
    const res = await fetch(`${BASE_URL}/sessions/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search sessions");
    return res.json();
  }
};
