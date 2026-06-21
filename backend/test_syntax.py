import sys
import os

# Add the backend directory to python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

try:
    from app.main import app
    print("SUCCESS: FastAPI app loaded without syntax or import errors.")
    
    # Audit endpoints
    routes = [route.path for route in app.routes]
    print("\nRegistered Routes:")
    for r in sorted(routes):
        print(f" - {r}")
        
    required_routes = [
        "/api/proxy/hermes-dashboard/{path:path}",
        "/api/v1/sessions/",
        "/api/v1/sessions/{session_id}/messages",
        "/api/v1/kanban/tasks",
        "/api/v1/kanban/workflows",
        "/api/v1/profiles/",
        "/api/v1/profiles/config",
        "/api/v1/config/yaml",
        "/api/v1/config/env",
        "/api/v1/ops/doctor",
        "/api/v1/ops/audit",
        "/api/v1/ops/backup"
    ]
    
    missing = []
    for req in required_routes:
        if req not in routes and not any(r for r in routes if r.startswith(req.split("{")[0])):
            missing.append(req)
            
    if missing:
        print("\nWARNING: Missing required routes:")
        for m in missing:
            print(f" - {m}")
    else:
        print("\nSUCCESS: All required routes from the implementation plan are present.")
        
except Exception as e:
    import traceback
    print("ERROR loading app:")
    traceback.print_exc()
    sys.exit(1)
