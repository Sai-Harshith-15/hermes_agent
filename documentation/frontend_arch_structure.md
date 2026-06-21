# Frontend Architecture Structure

## Overview
The frontend is built using **React** with **Vite** for fast bundling, utilizing **TypeScript** for type safety. Styling is handled via **Tailwind CSS v4** (`@tailwindcss/postcss`). Its primary purpose is to serve as the main dashboard (Mission Control) to manage, monitor, and directly interact with Hermes agents.

## Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Lucide React (Icons)
- **Data Visualization:** Recharts
- **Communication:** WebSockets (Live telemetry via `/ws/telemetry`), Custom fetch wrappers.

## Core Components
1. **Telemetry & Dashboard (`App.tsx` & `DashboardScreen.tsx`)**
   - Establishes a WebSocket connection (`ws://localhost:8000/ws/telemetry`) for read-only events.
   - Categorizes events into active models, server metrics (CPU/RAM), recent logs, and active agents.
2. **Session Details & History (`MiscScreens.tsx`)**
   - Displays live session tracking and basic memory retrieval via `ObsidianScreen` using search APIs.
3. **Management UIs (`MiscScreens.tsx`)**
   - Includes static placeholder UI for MCP Servers, Tunnels, Output Channels, and Credential Vaults. Currently powered by basic REST endpoints (`hermesApi`, `controlApi`).

## [SPECIFICATION - PENDING IMPLEMENTATION]
*The following features are designed but not yet implemented in the codebase:*
- **Theme & Plugin Systems:** 

## Implemented Features
- **Terminal Emulator & Embedded Chat:** A native `TerminalScreen.tsx` using `@xterm/xterm` with the WebGL renderer. It connects to the `/api/pty` WebSocket to run the full Hermes TUI inside the browser.
- **Dynamic Routing:** API and WebSocket endpoints dynamically resolve using `window.location.origin` and `window.location.host`, ensuring flawless compatibility with Cloudflare Tunnels under the single-port architecture.
  - **Themes**: Hot-swappable color palettes managed via `~/.hermes/dashboard-themes/`.
  - **Plugins**: A Plugin SDK exposed on `window.__HERMES_PLUGIN_SDK__`, allowing custom UI extensions without rebuilding React.

## State Management
State is managed locally within React components using standard hooks (`useState`, `useEffect`) combined with custom stores to handle WebSocket data streams and terminal instances.

## Routing
While currently heavily centralized, the app uses React to segment views into specific panels for Configuration, Telemetry Analytics, and the Terminal interface.
