import { fetchApi } from './client';

export const analyticsApi = {
  getDaily: async () => {
    return fetchApi('/analytics/daily');
  },
  getSummary: async () => {
    return fetchApi('/telemetry/analytics');
  }
};
