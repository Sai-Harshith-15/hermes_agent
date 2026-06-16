import { Plus } from 'lucide-react';
import { injectTask } from '../../lib/api/client';
import { useDashboardStore } from '../../store/dashboardStore';

export function KanbanScreen() {
  const { tasks, setTasks } = useDashboardStore();

  const handleInjectTask = async () => {
    const title = prompt("Enter Task Title:");
    if (!title) return;
    const newTask = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      agent_name: 'backend_expert',
      status: 'Backlog'
    };

    try {
      const saved = await injectTask(newTask);
      setTasks([...tasks, saved]);
    } catch (err) {
      setTasks([...tasks, newTask]);
    }
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const Column = ({ title, tasksInCol, borderColor }: { title: string, tasksInCol: any[], borderColor: string }) => (
    <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-800 flex flex-col h-[70vh] min-w-[200px]">
      <div className={`p-3 border-t-4 ${borderColor} bg-gray-900 rounded-t-lg font-semibold text-gray-200 text-sm flex justify-between items-center`}>
        <span>{title}</span>
        <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs text-gray-400">{tasksInCol.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
        {tasksInCol.map(task => (
          <div key={task.id} className="bg-gray-800 border border-gray-700 p-3 rounded shadow-sm hover:border-gray-500 cursor-grab transition-colors">
            <p className="text-sm text-gray-200 mb-2">{task.title}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-mono">{task.id}</span>
              {task.agent_name && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md truncate max-w-[100px]">{task.agent_name}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">SWE Agile Loop</h2>
          <p className="text-sm text-gray-400">Autonomous code {'->'} test {'->'} review {'->'} deploy cycle.</p>
        </div>
        <button onClick={handleInjectTask} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
          <Plus size={16} className="mr-2"/> Inject Task
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <Column title="Backlog" tasksInCol={getTasksByStatus('Backlog')} borderColor="border-gray-500" />
        <Column title="Coding" tasksInCol={getTasksByStatus('Coding')} borderColor="border-blue-500" />
        <Column title="Testing" tasksInCol={getTasksByStatus('Testing')} borderColor="border-purple-500" />
        <Column title="Code Review (Local)" tasksInCol={getTasksByStatus('Review')} borderColor="border-amber-500" />
        <Column title="Production/Deploy" tasksInCol={getTasksByStatus('Production')} borderColor="border-emerald-500" />
        <Column title="Error/Refactor" tasksInCol={getTasksByStatus('Error')} borderColor="border-red-500" />
      </div>
    </div>
  );
}
