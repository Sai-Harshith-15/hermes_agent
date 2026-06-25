import os

api_files = [
    'sessions_api.ts', 'mcp_api.ts', 'messaging_api.ts', 'profiles_api.ts', 
    'skills_api.ts', 'vault_api.ts', 'ops_api.ts', 'analytics_api.ts', 
    'tunnels_api.ts', 'checkpoints_api.ts', 'hooks_api.ts', 'themes_api.ts', 'plugins_api.ts'
]

base_dir = "d:/GitRepo/hermes_agent/frontend/src/lib/api"
os.makedirs(base_dir, exist_ok=True)

for file in api_files:
    path = os.path.join(base_dir, file)
    if not os.path.exists(path):
        domain = file.replace('_api.ts', '')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(f"import {{ fetchApi }} from './client';\n\n")
            f.write(f"export const {domain}Api = {{\n")
            f.write(f"  // Add {domain} endpoints here\n")
            f.write("};\n")

print("Created API clients.")
