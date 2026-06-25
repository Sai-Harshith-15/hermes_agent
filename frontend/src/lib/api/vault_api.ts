import { API_BASE_URL as BASE_URL, fetchApi } from './client';

export const vaultApi = {
  addKey: async (provider: string, key: string) => {
    return fetchApi('/vault/add', {
      method: 'POST',
      body: JSON.stringify({ provider, key })
    });
  },
  revealKey: async (key_id: string) => {
    return fetchApi('/vault/reveal', {
      method: 'POST',
      body: JSON.stringify({ key_id })
    });
  },
  rotateKey: async (key_id: string) => {
    return fetchApi('/vault/rotate', {
      method: 'POST',
      body: JSON.stringify({ key_id })
    });
  }
};
