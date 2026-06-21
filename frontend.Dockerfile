# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy package.json and install dependencies
COPY frontend/package*.json ./
RUN npm install
# Copy the rest of the frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve via NGINX
FROM nginx:alpine
# Copy custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static files from builder
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
