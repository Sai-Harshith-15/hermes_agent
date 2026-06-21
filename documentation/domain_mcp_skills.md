# Domain: MCP Servers & Skills Hub

## Overview
Hermes Agent is highly extensible through the Model Context Protocol (MCP) and its custom Skills Hub. The dashboard needs to manage these integrations securely and dynamically.

## MCP Server Management
> [!WARNING]
> **[SPECIFICATION - PENDING IMPLEMENTATION]**
> *The backend MCP configuration and management is not yet fully implemented. The current dashboard UI (`MCPScreen`) is a static mockup.*

The target dashboard provides a CRUD (Create, Read, Update, Delete) interface to manage MCP servers.
- **Data Source**: Stored directly in `~/.hermes/config.yaml` under the `mcp_servers:` block.
- **Capabilities**:
  - Add new servers (stdio + HTTP/SSE).
  - Enable/Disable toggles.
  - Test connection against a live server.
  - Browse a catalog to install approved servers with one click.
- **Backend Flow**: The `HermesConfigAdapter` is responsible for parsing and writing these changes to `config.yaml`.

## Skills Hub Browsing + Install
Skills are custom Python/JS tools that agents can equip to perform specific functions.
- **Data Source**: Installed directly to disk at `~/.hermes/skills/`.
- **Capabilities**:
  - Search the hub registry (all sources).
  - Install by ID with live log output streaming to the dashboard.
  - Update all skills button.
- **Backend Flow**: The `HermesSkillsAdapter` handles reading the directory contents and executing the download/update scripts from the central registry.
