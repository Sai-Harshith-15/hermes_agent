# Domain: System Operations & Webhooks

## Overview
A comprehensive overview of system administration, background operations, and credential routing managed by the Hermes Mission Control Dashboard.

## Credential Pool UI
Instead of hardcoded single API keys (e.g. 5x OpenCode, 3x OpenRouter), the Hermes architecture dynamically utilizes per-provider rotating API key pools.
- **Interface**: The dashboard allows you to add or remove keys for providers (OpenRouter, Anthropic, OpenAI) dynamically.
- **Behavior**: Hermes will round-robin these keys to balance rate limits and distribute costs.

## Webhook Subscription Management
The dashboard allows for the configuration of inbound and outbound event triggers.
- **Capabilities**:
  - Create, enable, or disable webhook routes.
  - Define event filters and delivery targets.
  - Direct-delivery modes.
- **Security**: Upon creation, the dashboard displays the route URL alongside a one-time HMAC secret for request verification.

## Shell Hooks Management
Provides consent-gated security for system-level executions.
- **Features**: Create and remove shell hooks (defining event, command, matcher, and timeout constraints).
- **Data Source**: Safely stored in `~/.hermes/shell-hooks-allowlist.json`.

## Checkpoints Management
Hermes maintains a `/rollback` filesystem checkpoint store to protect against destructive agent actions.
- **Interface**: View historical system checkpoints and selectively prune them to manage disk space.

## System Operations
The dashboard acts as the unified interface for system health and maintenance.
- **Doctor Check**: Runs diagnostic scripts to ensure `~/.hermes` and local prerequisites are intact.
- **Security Audit**: Scans active configurations and exposed ports.
- **Backup / Restore**: Safely zip/unzip `hermes_state.db` and config directories.
- **Live Output**: All operations stream live log output directly into the page without freezing the UI.
