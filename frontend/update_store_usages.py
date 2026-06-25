import os
import re

base_dir = "d:/GitRepo/hermes_agent/frontend/src"

for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if 'useDashboardStore' in content:
                # App.tsx
                if 'App.tsx' in file:
                    content = content.replace("import { useDashboardStore } from './store/dashboardStore';", "import { useSettingsStore } from './store/settingsStore';")
                    content = content.replace("} = useDashboardStore();", "} = useSettingsStore();")
                # SessionsScreen.tsx
                elif 'SessionsScreen.tsx' in file:
                    content = content.replace("import { useDashboardStore } from '../../store/dashboardStore';", "import { useSessionStore } from '../../store/sessionStore';")
                    content = content.replace("useDashboardStore()", "useSessionStore()")
                # ObsidianScreen.tsx, SandboxScreen.tsx
                elif 'ObsidianScreen.tsx' in file or 'SandboxScreen.tsx' in file:
                    content = content.replace("import { useDashboardStore } from '../../store/dashboardStore';", "import { useSettingsStore } from '../../store/settingsStore';")
                    content = content.replace("useDashboardStore()", "useSettingsStore()")
                # DashboardScreen.tsx
                elif 'DashboardScreen.tsx' in file:
                    content = content.replace("import { useDashboardStore } from '../../store/dashboardStore';", "import { useSettingsStore } from '../../store/settingsStore';\nimport { useVaultStore } from '../../store/vaultStore';")
                    content = content.replace("const { hostMetrics, apiKeys, logs } = useDashboardStore();", "const { hostMetrics, logs } = useSettingsStore();\n  const { apiKeys } = useVaultStore();")
                else:
                    # In other screens where it's unused, just remove the import
                    content = re.sub(r"import\s*\{\s*useDashboardStore\s*\}\s*from\s*'[^']*(dashboardStore|store/dashboardStore)[^']*';\s*\n?", "", content)

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file}")

print("Store usages updated.")
