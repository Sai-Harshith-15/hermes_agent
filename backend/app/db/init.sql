-- PostgreSQL Initialization Schema for Hermes Agent Monitor

-- Drop tables if they exist (for easy resetting/re-running migrations)
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS agent_runs CASCADE;
DROP TABLE IF EXISTS api_key_usages CASCADE;
DROP TABLE IF EXISTS api_key_pool CASCADE;
DROP TABLE IF EXISTS host_metrics CASCADE;

-- Table to track server metrics (Oracle ARM Server)
CREATE TABLE host_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cpu_usage NUMERIC(5, 2) NOT NULL,
    ram_used NUMERIC(5, 2) NOT NULL, -- in GB
    ram_total NUMERIC(5, 2) DEFAULT 24.00, -- 24GB
    storage_used NUMERIC(5, 2) NOT NULL, -- in GB
    storage_total NUMERIC(5, 2) DEFAULT 200.00, -- 200GB
    daemon_status VARCHAR(100) DEFAULT 'Active'
);

-- Table to manage LiteLLM/API Keys rotation pool
CREATE TABLE api_key_pool (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL, -- e.g., 'OpenCode', 'OpenRouter', 'DeepSeek'
    model_name VARCHAR(100) NOT NULL,
    api_key_masked VARCHAR(50) NOT NULL, -- e.g., 'sk-zen-...f8a2'
    rpm_limit INT DEFAULT 60,
    current_usage_pct NUMERIC(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Rate-Limited', 'Fallback Ready'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to log actual API calls and token counts
CREATE TABLE api_key_usages (
    id SERIAL PRIMARY KEY,
    key_id INT REFERENCES api_key_pool(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    cost_usd NUMERIC(10, 6) DEFAULT 0.000000,
    latency_ms INT DEFAULT 0,
    status_code INT DEFAULT 200 -- 429 for rate limit hits
);

-- Table to log high-level supervisor agent runs (swe_lead, yt_lead)
CREATE TABLE agent_runs (
    id VARCHAR(50) PRIMARY KEY, -- e.g., sess_9a8b7
    profile_name VARCHAR(50) NOT NULL, -- swe_lead, yt_lead
    role VARCHAR(100) NOT NULL,
    model_route VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Completed', 'Failed', 'Idle'
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE
);

-- Table to log specific worker agent tasks
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY, -- e.g. T-1, T-2
    run_id VARCHAR(50) REFERENCES agent_runs(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    agent_name VARCHAR(50), -- backend_expert, content_writer, video_editor
    status VARCHAR(50) DEFAULT 'Backlog', -- 'Backlog', 'Coding', 'Testing', 'Review', 'Production', 'Error'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for real-time agent output logging
CREATE TABLE agent_logs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) REFERENCES agent_runs(id) ON DELETE CASCADE,
    task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) NOT NULL, -- e.g. '[backend_expert]', '[system]'
    message TEXT NOT NULL,
    log_level VARCHAR(20) DEFAULT 'INFO' -- 'INFO', 'WARNING', 'ERROR'
);

-- Indexes for performance
CREATE INDEX idx_host_metrics_timestamp ON host_metrics(timestamp);
CREATE INDEX idx_logs_run_id ON agent_logs(run_id);
CREATE INDEX idx_logs_timestamp ON agent_logs(timestamp);
CREATE INDEX idx_usages_timestamp ON api_key_usages(timestamp);
