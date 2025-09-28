const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-store');

const User = require('./models/User');

async function setEmailVerified() {
    try {
        console.log('Setting all users as email verified...');
        
        // Update all users to have emailVerified: true
        const result = await User.updateMany(
            {},  // Update all users
            { emailVerified: true }
        );
        
        console.log(`Updated ${result.modifiedCount} users`);
        console.log('All users are now marked as email verified');
        
        process.exit(0);
    } catch (error) {
        console.error('Update error:', error);
        process.exit(1);
    }
}

setEmailVerified();