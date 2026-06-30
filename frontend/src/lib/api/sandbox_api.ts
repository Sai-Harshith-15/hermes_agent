import { fetchApi } from './client';

export const sandboxApi = {
  listFiles: async (path: string = "") => {
    return fetchApi(`/sandbox/files?path=${encodeURIComponent(path)}`);
  },
  readFile: async (path: string) => {
    return fetchApi(`/sandbox/file?path=${encodeURIComponent(path)}`);
  },
  writeFile: async (path: string, content: string) => {
    return fetchApi(`/sandbox/file?path=${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }
};
