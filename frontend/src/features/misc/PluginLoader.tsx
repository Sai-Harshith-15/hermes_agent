import { useEffect } from 'react';
import { fetchApi } from '../../lib/api/client';

export function PluginLoader() {
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const manifests = await fetchApi('/plugins/manifests');
        
        manifests.forEach((manifest: any) => {
          if (manifest.entry_path) {
            console.log(`[PluginLoader] Mounting plugin: ${manifest.name}`);
            const script = document.createElement('script');
            script.type = 'module';
            script.src = manifest.entry_path;
            script.async = true;
            document.head.appendChild(script);
          }
        });
      } catch (err) {
        console.error('[PluginLoader] Failed to load plugin manifests', err);
      }
    };

    loadPlugins();
  }, []);

  return null; // This component doesn't render anything visible
}
