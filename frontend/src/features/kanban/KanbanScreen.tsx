
import { Plus, TerminalSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { hermesApi } from '../../lib/api/hermes_api';

export function KanbanScreen() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: hermesApi.getTasks
  });

  const getTasksByStatus = (status: string) => tasks.filter((t: any) => (t.status || 'todo').toLowerCase() === status);

  const Column = ({ title, tasksInCol, borderColor }: { title: string, tasksInCol: any[], borderColor: string }) => (
    <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-800 flex flex-col h-[70vh] min-w-[280px]">
      <div className={`p-3 border-t-4 ${borderColor} bg-gray-900 rounded-t-lg font-semibold text-gray-200 text-sm flex justify-between items-center`}>
        <span>{title}</span>
        <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs text-gray-400">{tasksInCol.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
        {tasksInCol.map((task: any) => (
          <div key={task.id || task.task_id || Math.random()} className="bg-gray-800 border border-gray-700 p-3 rounded shadow-sm hover:border-gray-500 cursor-grab transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400 font-mono text-[10px] bg-gray-900 px-1.5 py-0.5 rounded">{task.id || task.task_id || 'T-XXX'}</span>
              {task.agent_name && (
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] uppercase font-bold tracking-wider truncate max-w-[120px]">
                  {task.agent_name}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-200 mb-3 leading-tight">{task.title || task.description || 'Untitled Task'}</p>
            
            <details className="group">
              <summary className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer list-none flex items-center mb-1 transition-colors">
                <TerminalSquare size={12} className="mr-1" />
                <span className="group-open:hidden">Show JSON Payload</span>
                <span className="hidden group-open:inline">Hide JSON Payload</span>
              </summary>
              <pre className="text-[10px] bg-gray-950 p-2 rounded text-gray-400 font-mono overflow-x-auto border border-gray-800 mt-1 max-h-32 custom-scrollbar">
                {JSON.stringify(task.payload || task, null, 2)}
              </pre>
            </details>

          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Missions & Working Agents</h2>
          <p className="text-sm text-gray-400">Live view of tasks distributed across sub-agents.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
          <Plus size={16} className="mr-2"/> Inject Task
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-gray-400 p-6 flex-1 flex items-center justify-center">Loading tasks from kanban.db...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          <Column title="Todo" tasksInCol={getTasksByStatus('todo')} borderColor="border-gray-500" />
          <Column title="In Progress" tasksInCol={getTasksByStatus('in-progress')} borderColor="border-blue-500" />
          <Column title="Blocked" tasksInCol={getTasksByStatus('blocked')} borderColor="border-red-500" />
          <Column title="Done" tasksInCol={getTasksByStatus('done')} borderColor="border-emerald-500" />
        </div>
      )}
    </div>
  );
}
