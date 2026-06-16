FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy source
COPY frontend/ .

# We use this container to build the assets.
# The docker-compose command will run `npm run build` and copy to a volume.
CMD ["npm", "run", "build"]
