/**
 * Themes API — client-side only.
 *
 * The backend has no `/messaging/themes` endpoint, so this module provides
 * a set of built-in themes and persists the active selection to localStorage.
 * When a backend themes route is implemented, swap `getThemes` / `applyTheme`
 * to call `fetchApi` instead.
 */

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'emerald-dark',
    name: 'Emerald Dark (Default)',
    colors: {
      primary: '#10b981',
      background: '#030712',
      surface: '#111827',
      text: '#e5e7eb',
    },
  },
  {
    id: 'cyan-dark',
    name: 'Cyan Dark',
    colors: {
      primary: '#06b6d4',
      background: '#020617',
      surface: '#0f172a',
      text: '#e2e8f0',
    },
  },
  {
    id: 'violet-dark',
    name: 'Violet Dark',
    colors: {
      primary: '#8b5cf6',
      background: '#0a0014',
      surface: '#130a2e',
      text: '#ede9fe',
    },
  },
  {
    id: 'amber-dark',
    name: 'Amber Dark',
    colors: {
      primary: '#f59e0b',
      background: '#0c0900',
      surface: '#1c1300',
      text: '#fef3c7',
    },
  },
];

const STORAGE_KEY = 'hermes_active_theme';

export const themesApi = {
  /**
   * Returns all available themes. Uses built-in list; extend with a
   * fetchApi() call when the backend exposes a themes endpoint.
   */
  getThemes: async (): Promise<Theme[]> => {
    return Promise.resolve(BUILTIN_THEMES);
  },

  /**
   * Persists the chosen theme id to localStorage and applies CSS custom properties.
   */
  applyTheme: async (themeId: string): Promise<{ status: string }> => {
    const theme = BUILTIN_THEMES.find((t) => t.id === themeId);
    if (!theme) {
      return Promise.reject(new Error(`Unknown theme: ${themeId}`));
    }

    localStorage.setItem(STORAGE_KEY, themeId);

    // Apply CSS variables to :root for future global theme support
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    return Promise.resolve({ status: 'applied' });
  },

  /**
   * Returns the currently active theme id (from localStorage) or the default.
   */
  getActiveThemeId: (): string => {
    return localStorage.getItem(STORAGE_KEY) ?? 'emerald-dark';
  },
};
