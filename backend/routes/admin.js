const router = require('express').Router();
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { checkIPWhitelist, logActivity } = require('../middleware/security');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const UAParser = require('ua-parser-js');

// Login attempt limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again after 15 minutes'
});

// Admin Login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, twoFactorToken } = req.body;
        const clientIP = req.ip;
        const userAgent = UAParser(req.headers['user-agent']);
        
        // Find admin by email or username
        const admin = await Admin.findOne({ 
            $or: [
                { email: email }, 
                { email: email.toLowerCase() },
                { username: email },
                { username: email.toLowerCase() }
            ]
        });
        if (!admin) {
            await logFailedLogin(null, email, clientIP, req.headers['user-agent'], 'Invalid credentials');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check for account lock
        if (admin.lockUntil && admin.lockUntil > Date.now()) {
            await logFailedLogin(admin._id, email, clientIP, req.headers['user-agent'], 'Account locked');
            return res.status(423).json({ 
                message: 'Account is locked due to too many failed attempts',
                lockExpires: admin.lockUntil
            });
        }

        // Check if admin is active
        if (!admin.isActive) {
            await logFailedLogin(admin._id, email, clientIP, req.headers['user-agent'], 'Account inactive');
            return res.status(401).json({ message: 'Your account has been deactivated' });
        }

        // Verify password
        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            // Increment login attempts
            admin.loginAttempts += 1;
            
            // Lock account if too many attempts
            if (admin.loginAttempts >= 5) {
                admin.lockUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
                await logFailedLogin(admin._id, email, clientIP, req.headers['user-agent'], 'Account locked - too many attempts');
            } else {
                await logFailedLogin(admin._id, email, clientIP, req.headers['user-agent'], 'Invalid password');
            }
            
            await admin.save();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Reset login attempts on successful password verification
        admin.loginAttempts = 0;
        admin.lockUntil = null;

        // Check 2FA if enabled
        if (admin.twoFactorEnabled) {
            if (!twoFactorToken) {
                return res.status(200).json({
                    requires2FA: true,
                    message: 'Please provide 2FA token'
                });
            }

            const isValidToken = speakeasy.totp.verify({
                secret: admin.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorToken,
                window: 1
            });

            if (!isValidToken) {
                await logFailedLogin(admin._id, email, clientIP, req.headers['user-agent'], 'Invalid 2FA token');
                return res.status(401).json({ message: 'Invalid 2FA token' });
            }
        }

        // Generate token
        const token = admin.generateAuthToken();

        // Update device info and last login
        const deviceId = require('crypto').randomBytes(16).toString('hex');
        const deviceInfo = {
            deviceId,
            browser: `${userAgent.browser.name} ${userAgent.browser.version}`,
            os: `${userAgent.os.name} ${userAgent.os.version}`,
            ip: clientIP,
            lastLogin: new Date(),
            isActive: true
        };

        admin.deviceInfo.push(deviceInfo);
        admin.lastLogin = new Date();
        admin.lastActivity = new Date();
        await admin.save();

        // Log successful login
        await new ActivityLog({
            adminId: admin._id,
            action: 'LOGIN',
            details: {
                deviceId,
                browser: deviceInfo.browser,
                os: deviceInfo.os
            },
            ip: clientIP,
            userAgent: req.headers['user-agent'],
            status: 'success'
        }).save();

        res.json({
            message: 'Login successful',
            token,
            admin: admin.toJSON(),
            deviceId
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Verify admin token
router.get('/verify', auth, isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        if (!admin || !admin.isActive) {
            return res.status(401).json({ message: 'Invalid or inactive admin' });
        }
        
        res.json({
            valid: true,
            admin: admin.toJSON()
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Get current admin profile
router.get('/profile', auth, isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Create new admin (super-admin only)
router.post('/', auth, async (req, res) => {
    try {
        // Check if creator is super-admin
        const creator = await Admin.findById(req.user._id);
        if (creator.role !== 'super-admin') {
            return res.status(403).json({ message: 'Only super-admin can create new admins' });
        }

        const admin = new Admin(req.body);
        await admin.save();
        
        res.status(201).json({
            message: 'Admin created successfully',
            admin: admin.toJSON()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating admin', error: error.message });
    }
});

// Update admin password
router.patch('/password', auth, isAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const admin = await Admin.findById(req.user._id);
        const isValidPassword = await admin.comparePassword(currentPassword);
        
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ message: 'No admin found with this email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        admin.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        admin.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await admin.save();

        // Send reset email (implement your email sending logic here)
        // ...

        res.json({ message: 'Password reset instructions sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Error requesting password reset', error: error.message });
    }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const admin = await Admin.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        admin.password = req.body.password;
        admin.passwordResetToken = undefined;
        admin.passwordResetExpires = undefined;
        await admin.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
});

// Enable 2FA
router.post('/2fa/enable', auth, isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        
        // Generate new secret
        const secret = speakeasy.generateSecret({
            name: `PS England Admin (${admin.email})`
        });
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        
        // Save secret
        admin.twoFactorSecret = secret.base32;
        await admin.save();
        
        res.json({
            message: 'Two-factor authentication setup initiated',
            secret: secret.base32,
            qrCode
        });
    } catch (error) {
        res.status(500).json({ message: 'Error enabling 2FA', error: error.message });
    }
});

// Verify and activate 2FA
router.post('/2fa/verify', auth, isAdmin, async (req, res) => {
    try {
        const { token } = req.body;
        const admin = await Admin.findById(req.user._id);
        
        const isValid = speakeasy.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 1
        });
        
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        
        admin.twoFactorEnabled = true;
        await admin.save();
        
        res.json({ message: 'Two-factor authentication enabled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying 2FA', error: error.message });
    }
});

// Disable 2FA
router.post('/2fa/disable', auth, isAdmin, async (req, res) => {
    try {
        const { password } = req.body;
        const admin = await Admin.findById(req.user._id);
        
        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        
        admin.twoFactorEnabled = false;
        admin.twoFactorSecret = null;
        await admin.save();
        
        res.json({ message: 'Two-factor authentication disabled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error disabling 2FA', error: error.message });
    }
});

// Manage IP whitelist
router.post('/ip-whitelist', auth, isAdmin, async (req, res) => {
    try {
        const { ip, description } = req.body;
        const admin = await Admin.findById(req.user._id);
        
        admin.allowedIPs.push({ ip, description });
        await admin.save();
        
        res.json({
            message: 'IP added to whitelist',
            allowedIPs: admin.allowedIPs
        });
    } catch (error) {
        res.status(500).json({ message: 'Error managing IP whitelist', error: error.message });
    }
});

// Remove IP from whitelist
router.delete('/ip-whitelist/:ip', auth, isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        admin.allowedIPs = admin.allowedIPs.filter(item => item.ip !== req.params.ip);
        await admin.save();
        
        res.json({
            message: 'IP removed from whitelist',
            allowedIPs: admin.allowedIPs
        });
    } catch (error) {
        res.status(500).json({ message: 'Error removing IP from whitelist', error: error.message });
    }
});

// Get activity log
router.get('/activity-log', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        const logs = await ActivityLog.find({ adminId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await ActivityLog.countDocuments({ adminId: req.user._id });
        
        res.json({
            logs,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity log', error: error.message });
    }
});

// Get active sessions
router.get('/sessions', auth, isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        res.json({ sessions: admin.deviceInfo.filter(device => device.isActive) });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sessions', error: error.message });
    }
});

// Terminate session
router.post('/sessions/:deviceId/terminate', auth, isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        const deviceIndex = admin.deviceInfo.findIndex(device => device.deviceId === req.params.deviceId);
        
        if (deviceIndex === -1) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        admin.deviceInfo[deviceIndex].isActive = false;
        await admin.save();
        
        res.json({ message: 'Session terminated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error terminating session', error: error.message });
    }
});

// Helper function to log failed login attempts
async function logFailedLogin(adminId, email, ip, userAgent, reason) {
    try {
        await new ActivityLog({
            adminId,
            action: 'LOGIN_FAILED',
            details: {
                email,
                reason
            },
            ip,
            userAgent,
            status: 'failed'
        }).save();
    } catch (error) {
        console.error('Error logging failed login:', error);
    }
}

module.exports = router;