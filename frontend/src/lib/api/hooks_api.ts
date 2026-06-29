import { fetchApi } from './client';

export const hooksApi = {
  // Webhooks
  getWebhooks: async () => {
    return fetchApi('/ops/hooks/webhooks');
  },
  createWebhook: async (data: { name: string; target_url: string; event_filter?: string }) => {
    return fetchApi('/ops/hooks/webhooks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  toggleWebhook: async (hookId: string) => {
    return fetchApi(`/ops/hooks/webhooks/${hookId}/toggle`, { method: 'POST' });
  },

  // Shell Hooks
  getShellHooks: async () => {
    return fetchApi('/ops/hooks/shell');
  },
  createShellHook: async (hook: { event: string; command: string; matcher: string; timeout?: number }) => {
    return fetchApi('/ops/hooks/shell', {
      method: 'POST',
      body: JSON.stringify(hook)
    });
  },
  deleteShellHook: async (event: string) => {
    return fetchApi(`/ops/hooks/shell/${encodeURIComponent(event)}`, { method: 'DELETE' });
  },
  approveShellHook: async (event: string) => {
    return fetchApi(`/ops/hooks/shell/${encodeURIComponent(event)}/approve`, { method: 'POST' });
  }
};
