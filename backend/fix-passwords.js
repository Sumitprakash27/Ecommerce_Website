const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-store');

const User = require('./models/User');

async function fixExistingUsers() {
    try {
        console.log('Starting user password migration...');
        
        // Find all users
        const users = await User.find({});
        console.log(`Found ${users.length} users to fix`);
        
        for (let user of users) {
            // Set a default password for existing users: "TempPass123!"
            const tempPassword = "TempPass123!";
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            
            // Update the user with properly hashed password
            await User.updateOne(
                { _id: user._id },
                { passwordHash: hashedPassword }
            );
            
            console.log(`Fixed password for user: ${user.email}`);
        }
        
        console.log('Password migration completed!');
        console.log('All existing users now have the temporary password: TempPass123!');
        console.log('They can use this to login and then change their password.');
        
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

fixExistingUsers();