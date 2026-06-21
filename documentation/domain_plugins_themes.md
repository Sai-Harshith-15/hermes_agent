# Domain: Theme & Plugin Systems



## Overview
To provide a premium and customizable experience, the target Hermes Mission Control frontend will support dynamic theming and a plugin SDK for community extensions.

## Theme System
The dashboard includes built-in themes and supports custom overrides.
- **Built-in Themes**: Hermes Teal, Midnight, Ember, Mono, Cyberpunk, Rosé.
- **Custom Themes**: Loaded dynamically from `~/.hermes/dashboard-themes/` as YAML files.
- **Capabilities**: 
  - 3-layer palette (background/midground/foreground).
  - Typography stack definitions.
  - Layout density and radius settings.
  - Component chrome overrides and custom CSS.
- **Hot-swappable**: All themes can be applied instantly from a palette icon in the header without refreshing the app.

## Plugin System
The plugin system allows the dashboard to be extended without rebuilding the React application or dealing with node modules.
- **Storage**: Plugins live in `~/.hermes/plugins/<name>/dashboard/`.
- **Structure**: Each plugin contains a `manifest.json`, a JS bundle, and an optional Python backend.
- **SDK**: A Plugin SDK is exposed globally on `window.__HERMES_PLUGIN_SDK__`.
- **Capabilities**: Plugins can add new tabs, replace built-in pages, or inject widgets into shell slots (sidebar, header).
