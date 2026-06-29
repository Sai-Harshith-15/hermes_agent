import { fetchApi } from './client';

export const mcpApi = {
  getServers: async () => {
    return fetchApi('/mcp');
  },
  addServer: async (mcp: any) => {
    return fetchApi('/mcp', {
      method: 'POST',
      body: JSON.stringify(mcp)
    });
  },
  deleteServer: async (name: string) => {
    return fetchApi(`/mcp/${name}`, {
      method: 'DELETE'
    });
  },
  testServer: async (mcp: any) => {
    return fetchApi('/mcp/test', {
      method: 'POST',
      body: JSON.stringify(mcp)
    });
  }
};
