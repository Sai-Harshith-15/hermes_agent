import { fetchApi } from './client';

export const sessionsApi = {
  getSessions: async (limit = 50) => {
    return fetchApi(`/sessions/?limit=${limit}`);
  },
  getSessionDetail: async (sessionId: string) => {
    return fetchApi(`/sessions/${sessionId}`);
  },
  getMessages: async (sessionId: string, limit = 100) => {
    return fetchApi(`/sessions/${sessionId}/messages?limit=${limit}`);
  },
  searchSessions: async (query: string) => {
    return fetchApi(`/sessions/search?q=${encodeURIComponent(query)}`);
  },
  editMessage: async (sessionId: string, messageId: string, content: string) => {
    return fetchApi(`/sessions/${sessionId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  },
  deleteMessage: async (sessionId: string, messageId: string) => {
    return fetchApi(`/sessions/${sessionId}/messages/${messageId}`, {
      method: 'DELETE'
    });
  },
  rewindSession: async (sessionId: string, messageId: string, timestamp: string) => {
    return fetchApi(`/sessions/${sessionId}/rewind`, {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId, timestamp })
    });
  }
};
