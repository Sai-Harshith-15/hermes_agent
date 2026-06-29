import { fetchApi } from './client';

export const kanbanApi = {
  getTasks: async (limit: number = 100) => {
    return fetchApi(`/kanban/tasks?limit=${limit}`);
  },
  getWorkflows: async (limit: number = 50) => {
    return fetchApi(`/kanban/workflows?limit=${limit}`);
  },
  updateTaskStatus: async (taskId: string, status: string) => {
    return fetchApi(`/kanban/tasks/${taskId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }
};
