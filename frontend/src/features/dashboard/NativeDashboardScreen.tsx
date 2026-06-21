import { Monitor } from 'lucide-react';

export function NativeDashboardScreen() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-gray-950">
      <div className="text-center space-y-6 max-w-md">
        <Monitor size={64} className="mx-auto text-gray-700" />
        <h2 className="text-3xl font-bold text-gray-200">Native Hermes Dashboard</h2>
        <p className="text-gray-400">
          The native Streamlit / Textual dashboard is currently offline or running on an inaccessible port. 
          To view it, ensure your local Hermes instance is running `hermes dashboard` on port 8501.
        </p>
        <a href="http://localhost:8501" target="_blank" rel="noreferrer" className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-lg transition-colors">
          Open Localhost:8501
        </a>
      </div>
    </div>
  );
}
