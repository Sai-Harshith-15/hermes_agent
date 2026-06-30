import { Monitor } from 'lucide-react';

export function NativeDashboardScreen() {
  return (
    <div className="h-full w-full flex flex-col p-2 bg-gray-950">
      <div className="flex-1 w-full border border-gray-800 rounded-lg overflow-hidden relative bg-black">
        <iframe 
          src="/docs" 
          className="absolute inset-0 w-full h-full border-none"
          title="Native Dashboard Proxy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
