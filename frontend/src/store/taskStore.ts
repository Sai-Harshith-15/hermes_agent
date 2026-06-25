import { create } from 'zustand';

interface TaskState {
  tasks: any[];
  setTasks: (tasks: any[]) => void;
  updateTask: (task: any) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks: tasks }),
  updateTask: (task) => set((state) => {
    const idx = state.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      const copy = [...state.tasks];
      copy[idx] = task;
      return { tasks: copy };
    }
    return { tasks: [...state.tasks, task] };
  })
}));
