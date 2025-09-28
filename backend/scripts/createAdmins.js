const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Check if super-admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: 'super-admin' });
        
        if (existingSuperAdmin) {
            console.log('Super admin already exists');
            process.exit(0);
        }

        // Create super-admin
        const superAdmin = new Admin({
            name: 'Admin',
            email: 'admin',  // Using username instead of email
            password: 'admin@2004', // Specified password
            role: 'super-admin',
            permissions: [
                'manage_products',
                'manage_orders',
                'manage_customers',
                'view_analytics',
                'manage_admins'
            ]
        });

        await superAdmin.save();
        console.log('Super admin created successfully');
        
        // Create default admin
        const defaultAdmin = new Admin({
            name: 'Store Admin',
            email: 'store@psengland.com', // Change this to store admin email
            password: 'Store@123!', // Change this to secure password
            role: 'admin',
            permissions: [
                'manage_products',
                'manage_orders',
                'manage_customers',
                'view_analytics'
            ]
        });

        await defaultAdmin.save();
        console.log('Default admin created successfully');

    } catch (error) {
        console.error('Error creating admin accounts:', error);
    }
    
    process.exit(0);
};

createSuperAdmin();