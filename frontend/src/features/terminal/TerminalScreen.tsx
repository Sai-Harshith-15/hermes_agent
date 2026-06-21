import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { PTY_WS_URL } from '../../lib/api/client';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function TerminalScreen() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#030712', // gray-950
        foreground: '#e5e7eb', // gray-200
        cursor: '#10b981', // emerald-500
        selectionBackground: 'rgba(16, 185, 129, 0.3)',
      },
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    
    try {
      const webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
    } catch (e) {
      console.warn('WebGL addon could not be loaded, falling back to canvas', e);
    }

    fitAddon.fit();
    xtermRef.current = term;

    const connectWs = () => {
      try {
        const ws = new WebSocket(PTY_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          term.focus();
        };

        ws.onmessage = (event) => {
          term.write(event.data);
        };

        ws.onclose = () => {
          setIsConnected(false);
          term.write('\r\n\x1b[31m[Disconnected from Hermes PTY]\x1b[0m\r\n');
        };

        ws.onerror = () => {
          setError('Failed to connect to Hermes PTY WebSocket.');
        };

        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });
      } catch (err) {
        setError('Failed to establish WebSocket connection.');
      }
    };

    connectWs();

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) wsRef.current.close();
      term.dispose();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-gray-400 font-mono text-xs">hermes --tui</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          {error ? (
            <span className="text-red-400 flex items-center"><AlertCircle size={14} className="mr-1"/> {error}</span>
          ) : isConnected ? (
            <span className="text-emerald-400 flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div> Live</span>
          ) : (
            <span className="text-yellow-400 flex items-center"><RefreshCw size={14} className="mr-1 animate-spin"/> Connecting...</span>
          )}
        </div>
      </div>
      
      {/* Terminal Container */}
      <div className="flex-1 p-2 overflow-hidden" ref={terminalRef}></div>
    </div>
  );
}
