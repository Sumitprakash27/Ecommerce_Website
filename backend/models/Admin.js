const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const adminSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'manager'],
        default: 'admin'
    },
    permissions: [{
        type: String,
        enum: [
            'manage_products',
            'manage_orders',
            'manage_customers',
            'view_analytics',
            'manage_admins'
        ]
    }],
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // 2FA fields
    twoFactorSecret: String,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },

    // Login attempt limiting
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },

    // IP Whitelisting
    allowedIPs: [{
        ip: String,
        description: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Activity Logging
    lastActivity: {
        type: Date
    },
    deviceInfo: [{
        deviceId: String,
        browser: String,
        os: String,
        ip: String,
        lastLogin: Date,
        isActive: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    const admin = this;
    if (admin.isModified('password')) {
        admin.password = await bcrypt.hash(admin.password, 10);
    }
    next();
});

// Generate auth token
adminSchema.methods.generateAuthToken = function() {
    const admin = this;
    const token = jwt.sign(
        { _id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    return token;
};

// Check password
adminSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

// Hide sensitive information
adminSchema.methods.toJSON = function() {
    const admin = this;
    const adminObject = admin.toObject();
    
    delete adminObject.password;
    delete adminObject.passwordResetToken;
    delete adminObject.passwordResetExpires;
    
    return adminObject;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;