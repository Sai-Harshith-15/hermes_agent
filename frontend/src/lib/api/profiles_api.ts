import { fetchApi } from './client';

export const profilesApi = {
  getProfiles: async () => {
    return fetchApi('/profiles/');
  },
  updateProfile: async (agentName: string, content: string) => {
    return fetchApi(`/profiles/${encodeURIComponent(agentName)}/config`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  },
  getConfig: async () => {
    return fetchApi('/profiles/config');
  }
};
