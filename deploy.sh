#!/bin/bash

# E-Commerce App Deployment Script
echo "🚀 Starting E-Commerce App Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Application deployed successfully!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   Frontend: http://localhost:3000"
    echo "   API: http://localhost:5000"
    echo ""
    echo "👤 Default Admin Credentials:"
    echo "   Email: admin@example.com"
    echo "   Password: admin123"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Change the default admin password"
    echo "   2. Update JWT_SECRET in production"
    echo "   3. Configure email settings for password reset"
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop app: docker-compose down"
    echo "   Restart: docker-compose restart"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi