# Multi-stage build for better optimization
FROM node:18-slim AS backend

# Create app directory
WORKDIR /app

# Install app dependencies for backend
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source
COPY backend/ .

# Create uploads directory
RUN mkdir -p uploads

# Stage 2: Final image
FROM node:18-slim

# Install nginx to serve frontend files
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend from previous stage
COPY --from=backend /app ./

# Copy frontend files
COPY index.html cart.html checkout.html login.html signup.html product-detail.html orders.html order-success.html forgot-password.html forgot-username.html reset-password.html test-auth.html ./public/
COPY style.css mobile-enhancements.css navbar-enhancements.css search-styles.css ./public/
COPY js/ ./public/js/
COPY admin/ ./public/admin/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 80 5000

# Start both nginx and node
CMD ["/start.sh"]