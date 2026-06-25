import re
import os

with open('d:/GitRepo/hermes_agent/frontend/src/features/misc/MiscScreens.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = content[:content.find('export function')]

components = [
    ('VaultScreen', 'vault/VaultScreen.tsx'),
    ('ProfilesScreen', 'profiles/ProfilesScreen.tsx'),
    ('ObsidianScreen', 'memory/ObsidianScreen.tsx'),
    ('SessionsScreen', 'sessions/SessionsScreen.tsx'),
    ('ChatScreen', 'chat/ChatScreen.tsx'),
    ('TunnelsScreen', 'tunnels/TunnelsScreen.tsx'),
    ('SettingsScreen', 'settings/SettingsScreen.tsx'),
    ('ChannelsScreen', 'channels/ChannelsScreen.tsx'),
    ('WebhooksScreen', 'webhooks/WebhooksScreen.tsx'),
    ('MCPScreen', 'mcp/MCPScreen.tsx'),
    ('PluginsScreen', 'plugins/PluginsScreen.tsx'),
    ('SkillsScreen', 'skills/SkillsScreen.tsx'),
    ('ModelsScreen', 'models/ModelsScreen.tsx'),
    ('ThemesScreen', 'themes/ThemesScreen.tsx')
]

# Find the start of each export function and other loose imports
# Actually regex is better: `export function Name`
matches = list(re.finditer(r'(?:import .*?;\n)*export function (\w+)\(\)', content))
for i, match in enumerate(matches):
    start = match.start()
    if i < len(matches) - 1:
        end = matches[i+1].start()
    else:
        end = len(content)
    
    comp_code = content[start:end]
    name = match.group(1)
    
    # find path
    path = None
    for c_name, c_path in components:
        if name == c_name:
            path = f"d:/GitRepo/hermes_agent/frontend/src/features/{c_path}"
            break
            
    if path:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            # Need to adjust relative imports
            # ../../ -> ../../ (since we went from features/misc to features/name, depth is the same)
            f.write(imports + comp_code)
            print(f"Wrote {path}")
