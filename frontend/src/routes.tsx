import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { KanbanScreen } from './features/kanban/KanbanScreen';
import { SandboxScreen } from './features/sandbox/SandboxScreen';
import { WardenScreen } from './features/warden/WardenScreen';
import { 
  VaultScreen, ProfilesScreen, ObsidianScreen, SessionsScreen, ChatScreen, 
  TunnelsScreen, SettingsScreen, ChannelsScreen, WebhooksScreen, MCPScreen, 
  PluginsScreen, SkillsScreen, ModelsScreen 
} from './features/misc/MiscScreens';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardScreen />} />
      <Route path="/kanban" element={<KanbanScreen />} />
      <Route path="/sandbox" element={<SandboxScreen />} />
      <Route path="/warden" element={<WardenScreen />} />
      <Route path="/vault" element={<VaultScreen />} />
      <Route path="/tunnels" element={<TunnelsScreen />} />
      <Route path="/channels" element={<ChannelsScreen />} />
      <Route path="/chat" element={<ChatScreen />} />
      <Route path="/profiles" element={<ProfilesScreen />} />
      <Route path="/obsidian" element={<ObsidianScreen />} />
      <Route path="/sessions" element={<SessionsScreen />} />
      <Route path="/skills" element={<SkillsScreen />} />
      <Route path="/plugins" element={<PluginsScreen />} />
      <Route path="/models" element={<ModelsScreen />} />
      <Route path="/mcps" element={<MCPScreen />} />
      <Route path="/webhooks" element={<WebhooksScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
