import React from 'react';
import { Activity, Server, HardDrive, Cpu, AlertTriangle, Bot, CheckCircle, Clock, Play, Square } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

export function DashboardScreen() {
  const { hostMetrics, apiKeys, logs } = useDashboardStore();

  const alerts = logs
    .filter(log => log.log_level === 'WARNING' || log.log_level === 'ERROR')
    .slice(-3)
    .reverse();

  const activeKeysCount = apiKeys.filter(k => k.status === 'Active' || k.status === 'Fallback Ready').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Oracle A1 CPU" value={`${hostMetrics.cpu_usage || 0}%`} icon={Cpu} subtext={hostMetrics.daemon_status || "Online"} color="text-blue-400" bgColor="bg-blue-500/10" />
        <StatCard title="Memory (RAM)" value={`${hostMetrics.ram_used || 0} / ${hostMetrics.ram_total || 24} GB`} icon={Server} subtext="Ollama GGUF Loaded" color="text-purple-400" bgColor="bg-purple-500/10" />
        <StatCard title="Block Storage" value={`${hostMetrics.storage_used || 0} / ${hostMetrics.storage_total || 200} GB`} icon={HardDrive} subtext="SQLite & Models" color="text-amber-400" bgColor="bg-amber-500/10" />
        <StatCard title="Active API Keys" value={`${activeKeysCount}`} icon={Bot} subtext={`${apiKeys.length} keys in rotation`} color="text-emerald-400" bgColor="bg-emerald-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center"><Activity className="mr-2 text-emerald-500" size={20}/> Pipeline Pulse (Active Jobs)</h3>
          <div className="space-y-4">
            <JobRow name="company_loop.sh" schedule="Every 5 mins" status="Running" lastRun="Active Now" type="System" />
            <JobRow name="yt_video_assembler" schedule="Daily @ 08:00" status="Sleeping" lastRun="14 hours ago" type="Media" />
            <JobRow name="liteLLM_budget_reset" schedule="Hourly" status="Completed" lastRun="45 mins ago" type="Network" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center"><AlertTriangle className="mr-2 text-amber-500" size={20}/> Telemetry Alerts</h3>
          <ul className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alt, i) => (
                <AlertItem key={i} text={`${alt.source}: ${alt.message}`} time="Real-Time" type={alt.log_level === 'ERROR' ? 'critical' : 'warning'} />
              ))
            ) : (
              <>
                <AlertItem text="DeepSeek API Key approaching RPM limit." time="10m ago" type="warning" />
                <AlertItem text="Oracle CPU dropped below 10% momentarily. NeverIdle engaged." time="3h ago" type="critical" />
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, subtext, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-100 mb-1">{value}</p>
      <p className="text-xs text-gray-500 truncate">{subtext}</p>
    </div>
  );
}

function JobRow({ name, schedule, status, lastRun, type }: { name: string, schedule: string, status: string, lastRun: string, type: string }) {
  const isRunning = status === 'Running';
  return (
    <div className="flex items-center justify-between bg-gray-950 p-3 rounded-lg border border-gray-800">
      <div className="flex items-center space-x-3">
        {isRunning ? <Play size={16} className="text-emerald-500" /> : <Square size={16} className="text-gray-600" />}
        <div>
          <p className="text-sm font-medium text-gray-200">{name}</p>
          <p className="text-[10px] text-gray-500 font-mono">{schedule} • {type}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>{status}</span>
        <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-end"><Clock size={10} className="mr-1"/> {lastRun}</p>
      </div>
    </div>
  );
}

function AlertItem({ text, time, type }: { text: string, time: string, type: 'warning' | 'info' | 'critical' }) {
  const colors = {
    warning: 'border-amber-500/50 text-amber-400',
    info: 'border-blue-500/50 text-blue-400',
    critical: 'border-red-500/50 text-red-400'
  };
  return (
    <li className={`flex flex-col bg-gray-950 p-3 rounded-lg border-l-4 ${colors[type]} text-sm`}>
      <span>{text}</span>
      <span className="text-[10px] text-gray-500 mt-1 uppercase">{time}</span>
    </li>
  );
}
