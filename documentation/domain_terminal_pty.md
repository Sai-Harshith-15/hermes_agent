# Domain: Embedded Chat & PTY Terminal

> [!NOTE]
> **[IMPLEMENTED]**
> *This feature has been successfully implemented in Phase 1 of the deployment strategy.*

## The Concept
The Hermes agent dashboard runs the full Hermes Terminal User Interface (TUI) inside the browser via a PTY (pseudo-terminal) WebSocket connection. This successfully bridges the native TUI to the web browser.

## How It Works

1. **Frontend (`xterm.js`)**
   - The React frontend uses `xterm.js` (with a WebGL renderer plugin for performance) to mount a terminal emulator directly inside a dashboard widget.
   - It connects to `ws://localhost:8000/api/pty`.

2. **Backend (FastAPI)**
   - The FastAPI backend exposes the `/api/pty` WebSocket endpoint.
   - Upon connection, it spawns `hermes --tui` as a PTY child process using a library like `ptyprocess` or python's `pty` module.
   - It continuously reads ANSI output from the child process and streams it down the WebSocket to `xterm.js`.
   - It listens for keystroke strings from the WebSocket and injects them directly into the child process's standard input.

## Benefits
- **Direct Control**: You can type messages, trigger slash commands, and see tool calls stream in exactly as you would if you ran the agent from your native shell.
- **No GUI Duplication**: By rendering the TUI directly, there is no need to rebuild complex streaming chat UIs in React. All agent UI components (spinners, colorized markdown, diffs) handled by textual/rich inside Hermes are natively rendered.
