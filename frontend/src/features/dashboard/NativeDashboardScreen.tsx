

export function NativeDashboardScreen() {
  // Using relative URL works perfectly in production since FastAPI serves the frontend.
  // In dev mode, Vite's proxy should forward /api requests to FastAPI.
  return (
    <div className="w-full h-full bg-gray-950">
      <iframe
        src="/api/proxy/hermes-dashboard/"
        className="w-full h-full border-none"
        title="Native Hermes Dashboard"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
