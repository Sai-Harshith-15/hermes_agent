# Backend Architecture Structure

## Overview
The backend acts as the "Master Control" and Telemetry Broker. Built with **FastAPI** and **Python**, it receives status updates from the Hermes sub-agents and broadcasts them to the React frontend in real-time. It handles data persistence using **SQLModel** with support for SQLite (local agents) and PostgreSQL (dashboard aggregation).

## Tech Stack
- **Framework:** FastAPI
- **Language:** Python 3.11+
- **ORM:** SQLModel (Pydantic + SQLAlchemy)
- **Database:** PostgreSQL (Cloud/Dashboard), SQLite (Local Hermes instances)
- **Server:** Uvicorn
- **Integration:** LiteLLM proxy logging

## Core Components
1. **Telemetry Router (`api/telemetry_router.py`)**
   - **WebSocket Endpoint:** `/ws` for frontend clients to connect and receive live broadcasts.
   - **Ingestion Endpoint:** POST `/` for agents/simulators to push metrics.
2. **WebSocket Manager (`api/websocket_manager.py`)**
   - Manages active client connections.
   - Handles broadcasting JSON-serialized data efficiently.
3. **Database Models (`models.py`)**
   - Defines `AgentRun`, `AgentLog`, `SystemMetrics`, and `ModelUsage` using SQLModel.
4. **Simulator (`simulate_telemetry.py`)**
   - A background script used for testing to pump fake CPU, RAM, and log data to the FastAPI endpoints.

## Agent Integration
- **Company Loop (`company_loop.sh`)**: The bash script that manages the agent lifecycle.
- **LiteLLM**: Intercepts and logs API requests to compute cost savings and track LLM usage.
