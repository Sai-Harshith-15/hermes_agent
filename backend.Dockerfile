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

# Set python path
ENV PYTHONPATH=/app/backend

# Expose port 8000
EXPOSE 8000

# Command to run the backend server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
