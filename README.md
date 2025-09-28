# 🛒 E-Commerce Web Application

A modern, responsive e-commerce web application built with HTML, CSS, JavaScript, and Node.js.

## 🌟 Features

- **Responsive Design**: Mobile-first approach with perfect mobile and desktop layouts
- **User Authentication**: Secure login/signup with JWT tokens
- **Product Catalog**: Dynamic product display with search and filtering
- **Shopping Cart**: Add to cart, quantity management, and checkout process
- **Admin Panel**: Complete admin dashboard for product and order management
- **Order Management**: Track orders and order history
- **File Uploads**: Product image upload functionality
- **MongoDB Database**: Robust data storage with Mongoose ODM

## 🚀 Live Demo

**🌐 Live Website**: [Coming Soon - Will be deployed to Railway/Heroku]

**👤 Demo Credentials:**
- Admin: `admin@example.com` / `admin123`
- User: Create your own account or use demo account

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with CSS Grid and Flexbox
- Mobile-first approach

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- Multer for file uploads
- bcrypt for password hashing

**Deployment:**
- Docker containerization
- Docker Compose for development
- Ready for cloud deployment (Heroku, Railway, DigitalOcean)

## 🏃‍♂️ Quick Start

### Option 1: Using Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/Sumitprakash27/Ecommerce_Website.git
cd Ecommerce_Website

# Run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:5000
```

### Option 2: Manual Setup
```bash
# Clone the repository
git clone https://github.com/Sumitprakash27/Ecommerce_Website.git
cd Ecommerce_Website

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Start the backend server
npm start

# Open frontend in browser
# Open index.html in your browser or use a local server
```

## 🌐 Deployment

### Deploy to Railway (Easiest)
1. Fork this repository
2. Go to [Railway](https://railway.app)
3. Connect your GitHub account
4. Deploy from your forked repository
5. Add environment variables in Railway dashboard

### Deploy to Heroku
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

## 📞 Support

If you have any questions or need help, please create an issue in the GitHub repository.

⭐ Give a star if this project helped you!
