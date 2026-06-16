import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../routes';

vi.mock('../features/dashboard/DashboardScreen', () => ({
  DashboardScreen: () => <div data-testid="dashboard-screen">Dashboard</div>
}));

vi.mock('../features/kanban/KanbanScreen', () => ({
  KanbanScreen: () => <div data-testid="kanban-screen">Kanban</div>
}));

describe('AppRoutes', () => {
  it('renders DashboardScreen on default route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
  });

  it('renders KanbanScreen on /kanban route', () => {
    render(
      <MemoryRouter initialEntries={['/kanban']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId('kanban-screen')).toBeInTheDocument();
  });
});
