import { fetchApi } from './client';

export const checkpointsApi = {
  getCheckpoints: async () => {
    return fetchApi('/ops/checkpoints');
  },
  pruneCheckpoint: async (filename: string) => {
    return fetchApi(`/ops/checkpoints/${encodeURIComponent(filename)}`, { method: 'DELETE' });
  }
};
