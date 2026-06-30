import { fetchApi } from './client';

export const hermesApi = {
  getTasks: async () => {
    return fetchApi('/kanban/tasks');
  },
  getSkills: async () => {
    return fetchApi('/skills/');
  },
  searchMemory: async (query: string) => {
    return fetchApi(`/memory/search?q=${encodeURIComponent(query)}`);
  },
  getProfiles: async () => {
    return fetchApi('/profiles/');
  },
  getMemoryFile: async (filename: string) => {
    return fetchApi(`/memory/file?filename=${encodeURIComponent(filename)}`);
  },
  saveMemoryFile: async (filename: string, content: string) => {
    return fetchApi(`/memory/file?filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
};
