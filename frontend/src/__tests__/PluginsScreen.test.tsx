import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PluginsScreen } from '../features/plugins/PluginsScreen';
import { pluginsApi } from '../lib/api/plugins_api';

// Mock the API so we don't make real network requests
vi.mock('../lib/api/plugins_api', () => ({
  pluginsApi: {
    getPlugins: vi.fn(),
    togglePlugin: vi.fn(),
  },
}));

describe('PluginsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an empty state when no plugins are found', async () => {
    (pluginsApi.getPlugins as any).mockResolvedValueOnce([]);

    render(<PluginsScreen />);

    // Wait for the plugins to be fetched and the state to update
    await waitFor(() => {
      expect(screen.getByText('Hermes Plugins')).toBeInTheDocument();
      expect(screen.getByText(/No plugins found/i)).toBeInTheDocument();
    });
  });

  it('renders a list of plugins when data is returned', async () => {
    const mockPlugins = [
      {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Tester',
        entrypoint: 'bundle.js',
        enabled: true,
      },
    ];

    (pluginsApi.getPlugins as any).mockResolvedValueOnce(mockPlugins);

    render(<PluginsScreen />);

    // Wait for the plugin to appear in the UI
    await waitFor(() => {
      expect(screen.getByText('test-plugin')).toBeInTheDocument();
      expect(screen.getByText('A test plugin')).toBeInTheDocument();
      expect(screen.getByText('Tester')).toBeInTheDocument();
    });
  });

  it('toggles a plugin when the toggle button is clicked', async () => {
    const mockPlugins = [
      {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Tester',
        entrypoint: 'bundle.js',
        enabled: true,
      },
    ];

    (pluginsApi.getPlugins as any).mockResolvedValue(mockPlugins);
    (pluginsApi.togglePlugin as any).mockResolvedValueOnce({ status: 'success' });

    render(<PluginsScreen />);

    await waitFor(() => {
      expect(screen.getByText('test-plugin')).toBeInTheDocument();
    });

    const toggleBtn = document.getElementById('plugin-toggle-test-plugin');
    expect(toggleBtn).toBeInTheDocument();
    
    // Simulate clicking the toggle button
    fireEvent.click(toggleBtn!);

    // Ensure togglePlugin was called with the correct arguments (id, new state)
    await waitFor(() => {
      expect(pluginsApi.togglePlugin).toHaveBeenCalledWith('test-plugin', false);
      expect(pluginsApi.getPlugins).toHaveBeenCalledTimes(2); // Initial load + refresh after toggle
    });
  });
});

