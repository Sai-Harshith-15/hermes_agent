import { fetchApi } from './client';

export const messagingApi = {
  setupGateway: async (platform: string, bot_token: string) => {
    return fetchApi('/messaging/setup', {
      method: 'POST',
      body: JSON.stringify({ platform, bot_token })
    });
  },
  approvePairing: async (user_id: string) => {
    return fetchApi(`/messaging/pairing/${user_id}/approve`, {
      method: 'POST'
    });
  },
  getPairingRequests: async () => {
    return fetchApi('/messaging/pairing');
  },
  restartGateway: async () => {
    // In our backend, setup does a restart. We'll make a dedicated restart route if we want, or just re-trigger setup with empty if backend supports it.
    // Wait, the plan asked to add a dedicated "Restart Gateway" button. 
    // Since messaging.py doesn't have a /restart endpoint explicitly, I will add it to ops_api or just add it here and I should add a /restart endpoint to messaging.py.
    return fetchApi('/messaging/restart', { method: 'POST' });
  }
};
