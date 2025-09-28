# E-Commerce App Deployment Script for Windows
Write-Host "🚀 Starting E-Commerce App Deployment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start the application
Write-Host "🔨 Building and starting the application..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$runningServices = docker-compose ps --filter "status=running"
if ($runningServices -match "Up") {
    Write-Host "✅ Application deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access your application at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   API: http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "👤 Default Admin Credentials:" -ForegroundColor Cyan
    Write-Host "   Email: admin@example.com" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Change the default admin password" -ForegroundColor White
    Write-Host "   2. Update JWT_SECRET in production" -ForegroundColor White
    Write-Host "   3. Configure email settings for password reset" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   View logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "   Stop app: docker-compose down" -ForegroundColor White
    Write-Host "   Restart: docker-compose restart" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed. Check logs with: docker-compose logs" -ForegroundColor Red
    exit 1
}