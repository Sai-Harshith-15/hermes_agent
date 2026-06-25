import os
import re

log_content = """
src/features/skills/SkillsScreen.tsx(12,61): error TS6133: 'updateEnv' is declared but its value is never read.
src/features/skills/SkillsScreen.tsx(12,72): error TS6133: 'runOp' is declared but its value is never read.
src/features/skills/SkillsScreen.tsx(13,7): error TS6133: 'Editor' is declared but its value is never read.
src/features/themes/ThemesScreen.tsx(2,1): error TS6192: All imports in import declaration are unused.
src/features/themes/ThemesScreen.tsx(8,1): error TS6133: 'useDashboardStore' is declared but its value is never read.
src/features/themes/ThemesScreen.tsx(9,1): error TS6192: All imports in import declaration are unused.
src/features/themes/ThemesScreen.tsx(10,1): error TS6133: 'hermesApi' is declared but its value is never read.
src/features/themes/ThemesScreen.tsx(11,1): error TS6133: 'controlApi' is declared but its value is never read.
src/features/themes/ThemesScreen.tsx(12,1): error TS6192: All imports in import declaration are unused.
src/features/themes/ThemesScreen.tsx(13,7): error TS6133: 'Editor' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(3,3): error TS6133: 'Terminal' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(3,13): error TS6133: 'Bot' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(4,3): error TS6133: 'Database' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(4,20): error TS6133: 'Settings' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(4,30): error TS6133: 'Search' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(4,38): error TS6133: 'Plus' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(5,16): error TS6133: 'Edit3' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(5,23): error TS6133: 'Save' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(6,3): error TS6133: 'Tv' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(6,7): error TS6133: 'Link' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(6,13): error TS6133: 'Shield' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(6,21): error TS6133: 'ToggleLeft' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(8,1): error TS6133: 'useDashboardStore' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(9,1): error TS6192: All imports in import declaration are unused.
src/features/tunnels/TunnelsScreen.tsx(10,1): error TS6133: 'hermesApi' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(11,1): error TS6133: 'controlApi' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(12,20): error TS6133: 'getConfigYaml' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(12,35): error TS6133: 'updateConfigYaml' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(12,53): error TS6133: 'getEnv' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(12,61): error TS6133: 'updateEnv' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(12,72): error TS6133: 'runOp' is declared but its value is never read.
src/features/tunnels/TunnelsScreen.tsx(13,7): error TS6133: 'Editor' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(3,3): error TS6133: 'Terminal' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(3,13): error TS6133: 'Bot' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(4,3): error TS6133: 'Database' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(4,13): error TS6133: 'Globe' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(4,30): error TS6133: 'Search' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(5,3): error TS6133: 'CheckCircle' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(5,16): error TS6133: 'Edit3' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(5,23): error TS6133: 'Save' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(6,3): error TS6133: 'Tv' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(6,7): error TS6133: 'Link' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(6,13): error TS6133: 'Shield' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(6,21): error TS6133: 'ToggleLeft' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(8,1): error TS6133: 'useDashboardStore' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(9,1): error TS6192: All imports in import declaration are unused.
src/features/vault/VaultScreen.tsx(10,1): error TS6133: 'hermesApi' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(11,1): error TS6133: 'controlApi' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(12,20): error TS6133: 'getConfigYaml' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(12,35): error TS6133: 'updateConfigYaml' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(12,53): error TS6133: 'getEnv' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(12,61): error TS6133: 'updateEnv' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(12,72): error TS6133: 'runOp' is declared but its value is never read.
src/features/vault/VaultScreen.tsx(13,7): error TS6133: 'Editor' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(3,3): error TS6133: 'Terminal' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(3,13): error TS6133: 'Bot' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(4,3): error TS6133: 'Database' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(4,13): error TS6133: 'Globe' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(4,20): error TS6133: 'Settings' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(4,30): error TS6133: 'Search' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(5,3): error TS6133: 'CheckCircle' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(5,16): error TS6133: 'Edit3' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(5,23): error TS6133: 'Save' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(6,3): error TS6133: 'Tv' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(6,13): error TS6133: 'Shield' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(6,21): error TS6133: 'ToggleLeft' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(8,1): error TS6133: 'useDashboardStore' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(9,1): error TS6192: All imports in import declaration are unused.
src/features/webhooks/WebhooksScreen.tsx(10,1): error TS6133: 'hermesApi' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(11,1): error TS6133: 'controlApi' is declared but its value is never read.
src/features/webhooks/WebhooksScreen.tsx(12,1): error TS6192: All imports in import declaration are unused.
src/features/webhooks/WebhooksScreen.tsx(13,7): error TS6133: 'Editor' is declared but its value is never read.
"""

file_to_unused = {}
for line in log_content.strip().split('\n'):
    m = re.match(r'^(.*?)\(\d+,\d+\): error TS6133: \'(.*?)\'', line)
    if m:
        path, var = m.groups()
        file_to_unused.setdefault(path, set()).add(var)
    m2 = re.match(r'^(.*?)\(\d+,\d+\): error TS6192', line)
    if m2:
        path = m2.group(1)
        file_to_unused.setdefault(path, set()).add('__ALL__')

base_dir = "d:/GitRepo/hermes_agent/frontend"
for path, unused in file_to_unused.items():
    full_path = os.path.join(base_dir, path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        new_lines = []
        for i, line in enumerate(lines):
            # Only process imports (first 20 lines)
            if i < 20 and ('import' in line or 'const Editor' in line):
                if '__ALL__' in unused and 'lucide-react' not in line and 'react' not in line and 'Editor' not in line:
                    continue # simplify: don't auto-remove all imports, the regex below will strip the specific vars
                
                # if it's the Editor line
                if 'Editor' in unused and 'const Editor' in line:
                    continue
                
                # strip unused vars from the import line
                new_line = line
                for var in unused:
                    if var != '__ALL__':
                        new_line = re.sub(r'\b' + var + r'\b\s*,?', '', new_line)
                
                # cleanup empty imports like `import { } from`
                new_line = re.sub(r'\{\s*,\s*', '{ ', new_line)
                new_line = re.sub(r',\s*\}', ' }', new_line)
                new_line = re.sub(r',\s*,', ',', new_line)
                
                if re.search(r'\{\s*\}', new_line):
                    continue # remove empty import line
                
                new_lines.append(new_line)
            else:
                new_lines.append(line)
                
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Fixed {path}")
