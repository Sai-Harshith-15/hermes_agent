import { create } from 'zustand';

interface SessionState {
  agentRuns: any[];
  setAgentRuns: (runs: any[]) => void;
  updateAgentRun: (run: any) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  agentRuns: [],
  setAgentRuns: (runs) => set({ agentRuns: runs }),
  updateAgentRun: (run) => set((state) => {
    const idx = state.agentRuns.findIndex(r => r.id === run.id);
    if (idx !== -1) {
      const copy = [...state.agentRuns];
      copy[idx] = run;
      return { agentRuns: copy };
    }
    return { agentRuns: [...state.agentRuns, run] };
  })
}));
