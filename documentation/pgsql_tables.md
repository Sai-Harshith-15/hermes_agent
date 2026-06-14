# PostgreSQL Database Schema

## Overview
The database uses **SQLModel** to map Python objects to PostgreSQL tables. It stores historical telemetry, agent statuses, and resource usage to monitor the Oracle Cloud Free Tier limits and system performance.

## Tables

### 1. `agent_runs`
Tracks individual task executions by agents.
- `id`: UUID (Primary Key)
- `agent_name`: String (e.g., "Code Agent", "Video Agent")
- `task`: String
- `status`: String ("running", "completed", "failed")
- `start_time`: DateTime
- `end_time`: DateTime (Optional)

### 2. `agent_logs`
Stores detailed logs and events emitted by the agents.
- `id`: UUID (Primary Key)
- `run_id`: UUID (Foreign Key to `agent_runs`)
- `timestamp`: DateTime
- `level`: String ("INFO", "WARNING", "ERROR")
- `message`: String

### 3. `system_metrics`
Monitors the Oracle VM resources. Crucial for ensuring CPU usage stays above 10% to prevent instance reclamation.
- `id`: UUID (Primary Key)
- `timestamp`: DateTime
- `cpu_percent`: Float
- `ram_mb`: Float
- `disk_gb`: Float

### 4. `model_usage`
Tracks LLM invocations and cost savings.
- `id`: UUID (Primary Key)
- `timestamp`: DateTime
- `model_name`: String (e.g., "ollama/llama3", "gpt-4")
- `provider`: String ("local", "openrouter")
- `tokens_prompt`: Integer
- `tokens_completion`: Integer
- `cost_saved`: Float (Calculated equivalent cost if run on paid APIs)
