import { fetchApi } from './client';

export const themesApi = {
  getThemes: async () => {
    return fetchApi('/messaging/themes');
  }
};
