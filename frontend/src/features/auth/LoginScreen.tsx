import React, { useState } from 'react';
import { ChevronRight, Network } from 'lucide-react';
import { login as apiLogin, setupAdmin } from '../../lib/api/auth';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSetup, setIsSetup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiLogin(username, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setupAdmin(username, password);
      setIsSetup(false);
      setError('Setup complete. You can now login.');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
      
      <div className="z-10 w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Network size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Hermes Pulse</h2>
        <p className="text-sm text-center text-gray-400 mb-8">Secure multi-tenant orchestration gateway.</p>
        
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}

        <form onSubmit={isSetup ? handleSetup : handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">USERNAME</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <span>{isSetup ? 'Complete Setup' : 'Establish Connection'}</span>
            <ChevronRight size={18} />
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSetup(!isSetup)}
            className="text-xs text-gray-500 hover:text-gray-400"
          >
            {isSetup ? 'Return to Login' : 'First time? Setup Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}
