import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MCPScreen } from '../src/features/mcp/MCPScreen';
import { VaultScreen } from '../src/features/vault/VaultScreen';
import { OpsScreen } from '../src/features/settings/SettingsScreen';
import { SessionsScreen } from '../src/features/sessions/SessionsScreen';
import { AnalyticsScreen } from '../src/features/dashboard/AnalyticsScreen';
import { KanbanScreen } from '../src/features/kanban/KanbanScreen';
import { WardenScreen } from '../src/features/warden/WardenScreen';
import { ProfilesScreen } from '../src/features/profiles/ProfilesScreen';
import { SandboxScreen } from '../src/features/sandbox/SandboxScreen';

// Mock dependencies
vi.mock('../src/lib/api/mcp_api', () => ({
  mcpApi: {
    getServers: vi.fn().mockResolvedValue([{ name: 'test_server', type: 'stdio', command_or_url: 'echo hello' }])
  }
}));

vi.mock('../src/lib/api/vault_api', () => ({
  vaultApi: {
    getKeys: vi.fn().mockResolvedValue([{ provider: 'openai', key_id: 'OPENAI_KEY_1', masked_key: 'sk-op-****' }])
  }
}));

vi.mock('../src/lib/api/sessions_api', () => ({
  sessionsApi: {
    getSessions: vi.fn().mockResolvedValue([]),
    searchSessions: vi.fn().mockResolvedValue([])
  }
}));

vi.mock('../src/lib/api/profiles_api', () => ({
  profilesApi: {
    getProfiles: vi.fn().mockResolvedValue([
      { agent_name: 'test_agent', system_prompt: 'mock prompt', has_memories: false }
    ]),
    updateProfile: vi.fn().mockResolvedValue({ status: 'success' })
  }
}));

vi.mock('../src/lib/api/sandbox_api', () => ({
  sandboxApi: {
    listFiles: vi.fn().mockResolvedValue([
      { path: 'test.py', name: 'test.py', is_dir: false }
    ]),
    readFile: vi.fn().mockResolvedValue({ content: 'print("hello")' }),
    writeFile: vi.fn().mockResolvedValue({ status: 'success' })
  }
}));

// Mock window.matchMedia for xterm.js
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('../src/lib/api/analytics_api', () => ({
  analyticsApi: {
    getDaily: vi.fn().mockResolvedValue([{ day: '2026-06-25', 'deepseek-chat_input': 100, 'deepseek-chat_output': 200, total_cost: 0.05 }])
  }
}));

vi.mock('../src/lib/api/kanban_api', () => ({
  kanbanApi: {
    getTasks: vi.fn().mockResolvedValue([{ id: 'T-1', status: 'todo', title: 'Test Task' }]),
    getWorkflows: vi.fn().mockResolvedValue([]),
    updateTaskStatus: vi.fn().mockResolvedValue({ status: 'success' })
  }
}));

vi.mock('../src/lib/api/warden_api', () => ({
  wardenApi: {
    getEvents: vi.fn().mockResolvedValue([
      { id: 1, event_type: 'KEY_PROBE', severity: 'WARNING', reasoning: 'Mock', action_taken: 'Suggested Key Rotation', timestamp: new Date().toISOString() }
    ]),
    triggerProbe: vi.fn().mockResolvedValue({ status: 'Key probe triggered' }),
    triggerLoopDetection: vi.fn().mockResolvedValue({ status: 'Loop detection triggered' }),
    heal: vi.fn().mockResolvedValue({ status: 'success' })
  }
}));

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

describe('Phase 3: MCPScreen', () => {
  it('renders MCP servers', async () => {
    render(<MCPScreen />, { wrapper });
    expect(await screen.findByText(/test_server/i)).toBeInTheDocument();
  });
});

describe('Phase 4: VaultScreen', () => {
  it('renders vault keys', async () => {
    render(<VaultScreen />, { wrapper });
    expect(await screen.findByText(/OPENAI_KEY_1/i)).toBeInTheDocument();
  });
});

describe('Phase 2: SessionsScreen', () => {
  it('renders active sessions text', async () => {
    render(<SessionsScreen />, { wrapper });
    expect(await screen.findByText(/Active Sessions/i)).toBeInTheDocument();
  });
});

describe('Phase 7: AnalyticsScreen', () => {
  it('renders token usage text', async () => {
    render(<AnalyticsScreen />, { wrapper });
    expect(await screen.findByText(/Token Usage/i)).toBeInTheDocument();
  });
});

describe('Phase 7: KanbanScreen', () => {
  it('renders todo column and task', async () => {
    render(<KanbanScreen />, { wrapper });
    const els = await screen.findAllByText(/Todo/i);
    expect(els.length).toBeGreaterThan(0);
  });
});

describe('Phase 8: WardenScreen', () => {
  it('renders warden overseer dashboard', async () => {
    render(<WardenScreen />, { wrapper });
    expect(await screen.findByText(/Warden Overseer/i)).toBeInTheDocument();
    expect(await screen.findByText(/Approve Heal/i)).toBeInTheDocument();
  });
});

describe('Phase 9: ProfilesScreen & SandboxScreen', () => {
  it('renders profiles screen and agent', async () => {
    render(<ProfilesScreen />, { wrapper });
    expect(await screen.findByText(/test_agent/i)).toBeInTheDocument();
  });

  it('renders sandbox file tree', async () => {
    render(<SandboxScreen />, { wrapper });
    expect(await screen.findByText(/File Explorer/i)).toBeInTheDocument();
    expect(await screen.findByText(/test.py/i)).toBeInTheDocument();
  });
});
