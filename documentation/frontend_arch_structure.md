# Frontend Architecture Structure

## Overview
The frontend is built using **React** with **Vite** for fast bundling, utilizing **TypeScript** for type safety. Styling is handled via **Tailwind CSS v4** (`@tailwindcss/postcss`). The core purpose is to serve as a live telemetry dashboard to monitor the Hermes agents, simulating "security cameras" for the "Free Office".

## Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Lucide React (Icons)
- **Data Visualization:** Recharts
- **Communication:** WebSockets (Live telemetry), Axios (HTTP API calls)

## Core Components
1. **Telemetry Dashboard (`App.tsx`)**
   - Establishes a WebSocket connection to the backend (`ws://localhost:8000/api/telemetry/ws`).
   - Listens for real-time telemetry events.
   - Categorizes events into active models, server metrics (CPU/RAM), recent logs, and active agents.
2. **Widgets/Panels**
   - **System Resources:** Displays live CPU and RAM usage mimicking Oracle Free Tier constraints.
   - **Active Agents:** Shows statuses of the "Freelance Workers" (Coders, Video Editors).
   - **Cost Savings Tracker:** Monitors theoretical savings from using local Ollama models vs. paid APIs.
   - **Live Feed:** A scrolling terminal-like log view.

## State Management
State is managed locally within React components using `useState` and `useEffect` for real-time updates from WebSocket feeds.

## Routing
Currently a single-page application (SPA). Future expansion can use `react-router-dom` to separate configuration and analytics views.
