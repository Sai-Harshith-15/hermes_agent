import { create } from 'zustand';

interface VaultState {
  apiKeys: any[];
  setApiKeys: (keys: any[]) => void;
  addApiKey: (key: any) => void;
  updateApiKey: (key: any) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  apiKeys: [],
  setApiKeys: (keys) => set({ apiKeys: keys }),
  addApiKey: (key) => set((state) => ({ apiKeys: [...state.apiKeys, key] })),
  updateApiKey: (key) => set((state) => {
    const idx = state.apiKeys.findIndex(k => k.id === key.id);
    if (idx !== -1) {
      const copy = [...state.apiKeys];
      copy[idx] = key;
      return { apiKeys: copy };
    }
    return { apiKeys: [...state.apiKeys, key] };
  })
}));
