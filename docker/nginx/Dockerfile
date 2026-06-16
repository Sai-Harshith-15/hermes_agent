FROM nginx:alpine

# Remove default nginx conf
RUN rm /etc/nginx/conf.d/default.conf

# Add our custom conf
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/

# Expose port 80
EXPOSE 80
