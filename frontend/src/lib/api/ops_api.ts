import { fetchApi } from './client';

export const opsApi = {
  runDoctor: async () => {
    return fetchApi('/ops/doctor', { method: 'POST' });
  },
  runAudit: async () => {
    return fetchApi('/ops/audit', { method: 'POST' });
  },
  runBackup: async () => {
    return fetchApi('/ops/backup', { method: 'POST' });
  }
};
