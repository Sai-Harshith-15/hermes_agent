
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wardenApi } from '../../lib/api/warden_api';
import { ShieldAlert, Activity, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export function WardenScreen() {
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['wardenEvents'],
    queryFn: wardenApi.getEvents,
    refetchInterval: 10000,
  });

  const probeMutation = useMutation({
    mutationFn: wardenApi.triggerProbe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardenEvents'] });
    }
  });

  const loopMutation = useMutation({
    mutationFn: wardenApi.triggerLoopDetection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardenEvents'] });
    }
  });

  const healMutation = useMutation({
    mutationFn: ({ eventId, action }: { eventId: number; action: string }) => wardenApi.heal(eventId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardenEvents'] });
    }
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ShieldAlert className="mr-2 text-emerald-500" />
            Warden Overseer
          </h2>
          <p className="text-sm text-gray-400">Self-healing mechanisms and anomaly detection logs.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => loopMutation.mutate()}
            disabled={loopMutation.isPending}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          >
            <RefreshCw size={16} className={`mr-2 ${loopMutation.isPending ? 'animate-spin' : ''}`} />
            Scan for Loops
          </button>
          <button 
            onClick={() => probeMutation.mutate()}
            disabled={probeMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          >
            <Activity size={16} className={`mr-2 ${probeMutation.isPending ? 'animate-pulse' : ''}`} />
            Probe API Keys
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/30 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Event Type</th>
              <th className="px-6 py-4 font-medium">Target</th>
              <th className="px-6 py-4 font-medium">Reasoning</th>
              <th className="px-6 py-4 font-medium">Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading Warden Events...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">No anomalies detected. System healthy.</td></tr>
            ) : (
              events.map((event: any) => (
                <tr key={event.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{new Date(event.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center text-xs font-bold uppercase ${event.severity === 'CRITICAL' ? 'text-red-400' : event.severity === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {event.severity === 'CRITICAL' ? <AlertTriangle size={14} className="mr-1" /> : event.severity === 'WARNING' ? <AlertTriangle size={14} className="mr-1" /> : <CheckCircle size={14} className="mr-1" />}
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{event.key_ref ? `Key ID: ${event.key_ref}` : event.agent_ref ? `Agent: ${event.agent_ref}` : 'System'}</td>
                  <td className="px-6 py-4 text-gray-300 max-w-xs truncate" title={event.reasoning}>{event.reasoning}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {event.action_taken === "Suggested Key Rotation" || event.action_taken === "Pause Agent" ? (
                      <div className="flex items-center space-x-2">
                        <span>{event.action_taken}</span>
                        <button
                          onClick={() => healMutation.mutate({ eventId: event.id, action: event.action_taken })}
                          disabled={healMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                        >
                          Approve Heal
                        </button>
                      </div>
                    ) : (
                      event.action_taken
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
