const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-store');

const Admin = require('./models/Admin');

async function createDefaultAdmins() {
    try {
        console.log('Creating default admin users...');
        
        // Check if any admin already exists
        const existingAdmin = await Admin.findOne({});
        if (existingAdmin) {
            console.log('Admin users already exist. Updating passwords...');
        }

        const admins = [
            {
                email: 'admin@psengland.com',
                username: 'admin',
                password: 'Admin123!',
                fullName: 'PS England Admin',
                role: 'super_admin',
                permissions: ['manage_products', 'manage_orders', 'manage_customers', 'view_analytics', 'manage_admins'],
                isActive: true
            },
            {
                email: 'manager@psengland.com',
                username: 'manager',
                password: 'Manager123!',
                fullName: 'Store Manager',
                role: 'admin',
                permissions: ['manage_products', 'manage_orders', 'manage_customers'],
                isActive: true
            }
        ];

        for (let adminData of admins) {
            // Check if admin exists
            let admin = await Admin.findOne({ 
                $or: [{ email: adminData.email }, { username: adminData.username }]
            });

            if (admin) {
                // Update existing admin
                admin.password = adminData.password;
                admin.fullName = adminData.fullName;
                admin.role = adminData.role;
                admin.permissions = adminData.permissions;
                admin.isActive = adminData.isActive;
                await admin.save();
                console.log(`✅ Updated admin: ${adminData.email} / ${adminData.username}`);
            } else {
                // Create new admin
                admin = new Admin(adminData);
                await admin.save();
                console.log(`✅ Created admin: ${adminData.email} / ${adminData.username}`);
            }
        }

        console.log('\n🎉 Default admin users ready!');
        console.log('\n📋 Login Credentials:');
        console.log('====================');
        console.log('Super Admin:');
        console.log('  Email/Username: admin@psengland.com or admin');
        console.log('  Password: Admin123!');
        console.log('');
        console.log('Manager:');
        console.log('  Email/Username: manager@psengland.com or manager');
        console.log('  Password: Manager123!');
        console.log('');
        console.log('🔗 Admin Login URL: http://localhost:5000/admin/login.html');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin users:', error);
        process.exit(1);
    }
}

createDefaultAdmins();