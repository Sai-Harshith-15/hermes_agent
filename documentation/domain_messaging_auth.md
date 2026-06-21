# Domain: Messaging Channels & Pairing

## Overview
Hermes can communicate securely with external platforms. The Mission Control dashboard allows you to configure these channels and manage user access without digging into raw config files.

## Messaging Channels UI
The dashboard features an integrated setup interface for various messaging platforms.
- **Supported Platforms**: Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, Email, SMS, BlueBubbles, DingTalk, Feishu, WeCom, etc.
- **Configuration**: Per-platform setup forms are provided. Toggles allow you to enable or disable specific platforms on the fly.
- **Testing**: Includes a "Test Connection" and "Restart Gateway" button for each integration.
- **Data Source**: Changes are safely written to `~/.hermes/.env` and `~/.hermes/config.yaml`.

## Pairing Management
Because exposing Hermes to messaging platforms can be a security risk, it uses a strict pairing system for authorization.
- **The Flow**:
  1. A user attempts to talk to Hermes via an external channel (e.g., Telegram).
  2. Hermes sends them a unique pairing code and pauses their access.
  3. The administrator uses the Mission Control Dashboard to review pending pairing codes and approve or revoke access.
- **Interface**: The Pairing Management UI tracks all connected and pending messaging users.
