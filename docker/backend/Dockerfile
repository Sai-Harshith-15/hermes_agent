FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create shared directory
RUN mkdir -p /shared

# The code will be mounted as a volume
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
