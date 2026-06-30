import { Activity, Server, HardDrive, Cpu, AlertTriangle, Bot, Clock, Play, Square } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useVaultStore } from '../../store/vaultStore';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function DashboardScreen() {
  const { hostMetrics, logs } = useSettingsStore();
  const { apiKeys } = useVaultStore();

  const { data: tasks = [] } = useQuery({
    queryKey: ['dashboardTasks'],
    queryFn: hermesApi.getTasks,
  });

  const activeJobs = tasks.filter((t: any) => t.status !== 'Done').slice(0, 3);

  const alerts = logs
    .filter(log => log.log_level === 'WARNING' || log.log_level === 'ERROR')
    .slice(-3)
    .reverse();

  const activeKeysCount = apiKeys.filter(k => k.status === 'Active' || k.status === 'Fallback Ready').length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      
      {/* Avant-Garde Header */}
      <motion.div variants={itemVariants} className="flex flex-col">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500 tracking-tighter">
          Pipeline Analytics
        </h2>
        <p className="text-gray-500 text-xs tracking-[0.2em] uppercase mt-1">Real-time system telemetry</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Oracle A1 CPU" value={`${hostMetrics.cpu_usage || 0}%`} icon={Cpu} subtext={hostMetrics.daemon_status || "Online"} color="text-emerald-400" bgColor="bg-emerald-500/10" glow="shadow-emerald-500/5" />
        <StatCard title="Memory (RAM)" value={`${hostMetrics.ram_used || 0} / ${hostMetrics.ram_total || 24}`} unit="GB" icon={Server} subtext="Ollama GGUF Loaded" color="text-indigo-400" bgColor="bg-indigo-500/10" glow="shadow-indigo-500/5" />
        <StatCard title="Block Storage" value={`${hostMetrics.storage_used || 0} / ${hostMetrics.storage_total || 200}`} unit="GB" icon={HardDrive} subtext="SQLite & Models" color="text-amber-400" bgColor="bg-amber-500/10" glow="shadow-amber-500/5" />
        <StatCard title="Active API Keys" value={`${activeKeysCount}`} icon={Bot} subtext={`${apiKeys.length} keys in rotation`} color="text-cyan-400" bgColor="bg-cyan-500/10" glow="shadow-cyan-500/5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 h-full">
            <h3 className="text-sm font-semibold tracking-wide text-gray-300 mb-6 flex items-center uppercase">
              <Activity className="mr-2 text-emerald-500" size={16}/> Active Jobs
            </h3>
            <div className="space-y-3">
              {activeJobs.length > 0 ? (
                activeJobs.map((job: any, i: number) => (
                  <JobRow 
                    key={i} 
                    name={job.title} 
                    schedule={job.epic || "Ad-hoc"} 
                    status={job.status} 
                    lastRun="Active" 
                    type={job.priority || "Normal"} 
                  />
                ))
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">No active jobs in queue.</div>
              )}
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 to-amber-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 h-full">
            <h3 className="text-sm font-semibold tracking-wide text-gray-300 mb-6 flex items-center uppercase">
              <AlertTriangle className="mr-2 text-amber-500" size={16}/> System Alerts
            </h3>
            <ul className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alt, i) => (
                  <AlertItem key={i} text={`${alt.source}: ${alt.message}`} time="Real-Time" type={alt.log_level === 'ERROR' ? 'critical' : 'warning'} />
                ))
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">No active system alerts.</div>
              )}
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  subtext: string;
  icon: any;
  color: string;
  bgColor: string;
  glow: string;
}

function StatCard({ title, value, unit, subtext, icon: Icon, color, bgColor, glow }: StatCardProps) {
  return (
    <motion.div variants={itemVariants} className={`relative overflow-hidden bg-gray-900/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl ${glow} group hover:bg-gray-900/50 transition-colors`}>
      <div className="flex items-start justify-between mb-8">
        <h3 className="text-[10px] tracking-widest text-gray-500 uppercase font-semibold">{title}</h3>
        <div className={`p-2 rounded-xl ${bgColor} ${color} shadow-inner`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex items-baseline space-x-1">
        <p className="text-3xl font-bold tracking-tighter text-white">{value}</p>
        {unit && <span className="text-sm font-medium text-gray-500">{unit}</span>}
      </div>
      <p className="text-xs text-gray-500 truncate mt-2 tracking-wide">{subtext}</p>
      
      {/* Subtle background glow effect on hover */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${bgColor} blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none`}></div>
    </motion.div>
  );
}

function JobRow({ name, schedule, status, lastRun, type }: { name: string, schedule: string, status: string, lastRun: string, type: string }) {
  const isRunning = status === 'Running';
  return (
    <div className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all cursor-default">
      <div className="flex items-center space-x-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRunning ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-gray-800 text-gray-500'}`}>
          {isRunning ? <Play size={14} className="ml-0.5" /> : <Square size={12} />}
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-gray-200 group-hover:text-white transition-colors">{name}</p>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider mt-0.5">{schedule} • {type}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-widest ${isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>{status}</span>
        <p className="text-[10px] text-gray-500 mt-2 flex items-center font-medium"><Clock size={10} className="mr-1"/> {lastRun}</p>
      </div>
    </div>
  );
}

function AlertItem({ text, time, type }: { text: string, time: string, type: 'warning' | 'info' | 'critical' }) {
  const colors = {
    warning: 'text-amber-400 bg-amber-400/10',
    info: 'text-blue-400 bg-blue-400/10',
    critical: 'text-rose-400 bg-rose-400/10'
  };
  return (
    <li className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${colors[type].split(' ')[1].replace('/10', '')} shadow-[0_0_8px_currentColor] opacity-80`}></div>
      <div className="flex-1">
        <p className="text-sm text-gray-300 leading-relaxed font-medium">{text}</p>
        <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-widest font-bold">{time}</p>
      </div>
    </li>
  );
}
