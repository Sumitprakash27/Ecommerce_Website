# PS England E-Commerce Platform - Admin Panel

## Admin Panel Access

The admin panel has been successfully set up with the following features:

### 🔗 Admin Login URL
```
http://localhost:5000/admin/login.html
```

### 👨‍💼 Admin Credentials

#### Super Admin Account
- **Email/Username:** admin@psengland.com or admin
- **Password:** Admin123!
- **Role:** Super Admin
- **Permissions:** Full access to all features

#### Manager Account  
- **Email/Username:** manager@psengland.com or manager
- **Password:** Manager123!
- **Role:** Manager
- **Permissions:** Products, Orders, Customers management

### 🎯 Admin Panel Features

✅ **Secure Authentication**
- JWT-based authentication
- Account lockout after failed attempts
- 2FA support (optional)
- Session management

✅ **Modern Dashboard**
- Real-time statistics
- User count, product count displays
- Recent activity monitoring
- Quick action shortcuts

✅ **User Management**
- View all registered users
- User statistics and analytics
- Account status management

✅ **Product Management**
- Product CRUD operations
- Inventory management
- Category management

✅ **Responsive Design**
- Works on desktop and mobile
- Collapsible sidebar
- Bootstrap-based UI

### 🚀 Getting Started

1. **Start the server:**
   ```bash
   cd backend
   node server.js
   ```

2. **Access admin login:**
   - Open: http://localhost:5000/admin/login.html
   - Use the credentials above

3. **Quick Login:**
   - Click the "Super Admin" or "Manager" buttons for instant login
   - Or manually enter credentials

### 🛠️ API Endpoints

#### Admin Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/verify` - Token verification
- `GET /api/admin/profile` - Admin profile

#### Dashboard Statistics
- `GET /api/users/count` - Total users count
- `GET /api/products/count` - Total products count

### 🔒 Security Features

- **Password Requirements:** Minimum 8 characters
- **Account Lockout:** 5 failed attempts = 15 minutes lockout
- **JWT Tokens:** 24-hour expiration
- **Role-Based Access:** Different permission levels
- **Activity Logging:** All admin actions are logged

### 📱 User Interface

**Login Page Features:**
- Modern gradient design
- Quick login buttons for demo
- 2FA token support
- Responsive layout
- Real-time validation

**Dashboard Features:**
- Statistics cards with live data
- Collapsible sidebar navigation
- Quick action buttons
- Recent activity feed
- Mobile-friendly design

### 🌐 Main Application Access

- **Frontend:** http://localhost:5000/
- **User Login:** Standard user authentication
- **Search:** Real-time product search
- **Cart:** Shopping cart functionality

### 📧 Support

For technical support or questions, contact: admin@psengland.com

---

**Note:** This is a development setup. For production deployment, ensure you:
- Change default passwords
- Set up environment variables
- Configure HTTPS
- Implement additional security measures
- Set up proper database backups