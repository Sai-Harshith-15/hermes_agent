import { fetchApi } from './client';

export const skillsApi = {
  getSkills: async () => {
    return fetchApi('/skills/');
  },
  getCuratorStatus: async () => {
    return fetchApi('/skills/curator');
  },
  toggleCurator: async (action: 'pause' | 'resume') => {
    return fetchApi(`/skills/curator/toggle?action=${action}`, { method: 'POST' });
  },
  toggleSkill: async (skillId: string, enabled: boolean) => {
    return fetchApi('/skills/toggle', {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId, enabled })
    });
  },
  installSkill: async (skillId: string) => {
    return fetchApi('/skills/install', {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId })
    });
  },
  updateAll: async () => {
    return fetchApi('/skills/update-all', { method: 'POST' });
  }
};
