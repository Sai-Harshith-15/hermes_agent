import os
import re
import subprocess

def run_tsc():
    try:
        result = subprocess.run(["cmd", "/c", "npx tsc --noEmit"], capture_output=True, text=True, cwd="d:/GitRepo/hermes_agent/frontend")
        return result.stdout
    except Exception as e:
        return str(e)

base_dir = "d:/GitRepo/hermes_agent/frontend"

for _ in range(5):
    print("Running tsc...")
    log_content = run_tsc()
    
    if "error TS" not in log_content:
        print("Build succeeded!")
        break

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

    if not file_to_unused:
        print("No more unused imports to fix, but build still fails.")
        print(log_content)
        break

    for path, unused in file_to_unused.items():
        full_path = os.path.join(base_dir, path)
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            new_lines = []
            for i, line in enumerate(lines):
                # Process imports up to line 20
                if i < 20 and ('import' in line or 'const Editor' in line):
                    if '__ALL__' in unused and 'lucide-react' not in line and 'react' not in line and 'Editor' not in line:
                        continue
                    if 'Editor' in unused and 'const Editor' in line:
                        continue
                    
                    new_line = line
                    for var in unused:
                        if var != '__ALL__':
                            new_line = re.sub(r'\b' + var + r'\b\s*,?', '', new_line)
                    
                    new_line = re.sub(r'\{\s*,\s*', '{ ', new_line)
                    new_line = re.sub(r',\s*\}', ' }', new_line)
                    new_line = re.sub(r',\s*,', ',', new_line)
                    
                    if re.search(r'import\s+\{\s*\}\s+from', new_line):
                        continue # remove empty import line
                        
                    new_lines.append(new_line)
                else:
                    new_lines.append(line)
                    
            with open(full_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print(f"Fixed {path}")
