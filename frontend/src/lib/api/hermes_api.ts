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
  }
};
