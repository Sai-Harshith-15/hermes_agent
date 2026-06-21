# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy package.json and install dependencies
COPY frontend/package*.json ./
RUN npm install
# Copy the rest of the frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend and serve everything
FROM python:3.11-slim
WORKDIR /app

# Install dependencies for python and general tools
RUN apt-get update && apt-get install -y \
    gcc \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy python requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ /app/backend/

# Copy the built React app from the frontend builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Set python path
ENV PYTHONPATH=/app/backend

# Expose port 8000
EXPOSE 8000

# Command to run the unified single-port server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
