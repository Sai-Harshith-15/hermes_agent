import { fetchApi } from './client';

export const tunnelsApi = {
  getTunnelUrl: async () => {
    return fetchApi('/tunnels/url');
  }
};
