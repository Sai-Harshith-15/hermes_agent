import { fetchApi } from './client';

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  entrypoint: string;
  enabled: boolean;
}

export const pluginsApi = {
  getPlugins: async (): Promise<PluginManifest[]> => {
    return fetchApi<PluginManifest[]>('/plugins/manifests');
  },
  togglePlugin: async (pluginName: string, enabled: boolean): Promise<any> => {
    return fetchApi(`/plugins/${pluginName}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }
};
