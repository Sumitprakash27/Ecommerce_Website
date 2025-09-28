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
git clone https://github.com/your-username/ecommerce-web-app.git
cd ecommerce-web-app

# Run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:5000
```

### Frontend Setup

The frontend is pre-built and served statically. No additional setup is required.

## Docker Setup (Optional)

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## Testing

Run backend tests:
```bash
cd backend
npm test
```

## Accessibility Checklist

- [x] Semantic HTML structure
- [x] ARIA labels for interactive elements
- [x] Keyboard navigation support
- [x] Color contrast compliance
- [x] Screen reader compatibility
- [x] Responsive design
- [x] Focus management

## Security Features

- JWT authentication
- Password hashing with bcrypt
- File upload validation
- CORS configuration
- Rate limiting
- Input sanitization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Goals

- Lighthouse Performance Score: >90
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Largest Contentful Paint: <2.5s

## Cloud Storage Setup

### AWS S3

1. Create an S3 bucket
2. Set up IAM user with S3 access
3. Add AWS credentials to .env file
4. Update upload middleware to use S3

### Cloudinary

1. Create Cloudinary account
2. Add Cloudinary credentials to .env file
3. Update upload middleware to use Cloudinary

## HTTPS Setup

1. Install SSL certificate
2. Enable HTTPS in Express
3. Configure HSTS
4. Set up CSP headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT