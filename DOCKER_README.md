# E-Commerce Web App - Docker Deployment

This guide will help you deploy the e-commerce web application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "web app"
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000
   - MongoDB: localhost:27017

## Environment Configuration

Before deploying to production, update the environment variables in `.env.production`:

- `JWT_SECRET`: Change to a secure random string
- `ADMIN_EMAIL`: Set your admin email
- `ADMIN_PASSWORD`: Set a secure admin password
- Email settings (optional): Configure for password reset functionality

## Features Included

- **Frontend**: Complete e-commerce interface with responsive design
- **Backend API**: RESTful API with authentication and authorization
- **Database**: MongoDB with persistent data storage
- **Admin Panel**: Product and order management
- **File Uploads**: Product image handling
- **Security**: JWT authentication, password hashing, rate limiting

## API Endpoints

- `GET /api/products` - Get all products
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /admin/api/*` - Admin endpoints

## Database Schema

The application uses MongoDB with the following collections:
- `users` - User accounts and authentication
- `products` - Product catalog
- `orders` - Order history and tracking
- `sessions` - User sessions

## Deployment Options

### Option 1: Local Development
```bash
docker-compose up
```

### Option 2: Production Deployment
1. Update environment variables
2. Use production MongoDB instance
3. Configure reverse proxy (Nginx/Apache)
4. Set up SSL certificates
5. Configure domain name

### Option 3: Cloud Deployment (Docker Hub)
1. Build and tag image:
   ```bash
   docker build -t your-username/ecommerce-app .
   docker push your-username/ecommerce-app
   ```

2. Deploy on cloud platforms:
   - Heroku
   - DigitalOcean
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances

## Troubleshooting

1. **Port conflicts**: Change ports in docker-compose.yml
2. **MongoDB connection**: Ensure MongoDB container is running
3. **File uploads**: Check volume mounts for uploads directory
4. **Environment variables**: Verify .env file configuration

## Security Notes

- Change default JWT secret
- Use strong admin passwords
- Configure HTTPS in production
- Set up proper firewall rules
- Regular security updates

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.