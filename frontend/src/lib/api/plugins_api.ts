import { fetchApi } from './client';

export const pluginsApi = {
  getPlugins: async () => {
    return fetchApi('/plugins/manifests');
  }
};
