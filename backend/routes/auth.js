const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Signup
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Manually hash the password (don't rely on pre-save middleware)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create new user directly using Model.create
    const savedUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword
    });
    
    console.log('User created successfully:', savedUser._id);

    // Generate JWT
    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email, role: savedUser.role || 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        isVerified: savedUser.emailVerified || true  // Default to true for now
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.email);
    console.log('Stored passwordHash length:', user.passwordHash ? user.passwordHash.length : 'null');
    console.log('Input password length:', password ? password.length : 'null');

    // Directly compare password with stored hash
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('Password validation result:', validPassword);
    
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.emailVerified || true  // Default to true if emailVerified field doesn't exist
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, password reset instructions will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // In a real app, send email here with resetToken
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ 
      message: 'If the email exists, password reset instructions will be sent',
      // For development purposes, include the token
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error requesting password reset', error: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(password, saltRounds);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Forgot Username
router.post('/forgot-username', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, username recovery instructions will be sent' });
    }

    // In a real app, send email here with the username
    console.log(`Username recovery for ${email}: ${user.name}`);
    
    res.json({ 
      message: 'If the email exists, username recovery instructions will be sent',
      // For development purposes, include the username
      username: user.name
    });
  } catch (error) {
    console.error('Forgot username error:', error);
    res.status(500).json({ message: 'Error requesting username recovery', error: error.message });
  }
});

// Social Login Routes
// Google OAuth Login
router.post('/social-login/google', async (req, res) => {
  try {
    const { token, profile } = req.body;
    
    // In a real app, verify the Google token with Google's API
    // For demo purposes, we'll use the provided profile data
    
    let user = await User.findOne({ email: profile.email });
    
    if (!user) {
      // Create new user from Google profile
      user = await User.create({
        name: profile.name,
        email: profile.email,
        passwordHash: '', // No password for social login
        emailVerified: true,
        socialProvider: 'google',
        socialId: profile.id,
        avatar: profile.picture
      });
    } else {
      // Update existing user with social info if not already set
      if (!user.socialProvider) {
        user.socialProvider = 'google';
        user.socialId = profile.id;
        user.avatar = profile.picture;
        await user.save();
      }
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google login failed', error: error.message });
  }
});

// Facebook OAuth Login
router.post('/social-login/facebook', async (req, res) => {
  try {
    const { accessToken, profile } = req.body;
    
    // In a real app, verify the Facebook token with Facebook's API
    // For demo purposes, we'll use the provided profile data
    
    let user = await User.findOne({ email: profile.email });
    
    if (!user) {
      // Create new user from Facebook profile
      user = await User.create({
        name: profile.name,
        email: profile.email,
        passwordHash: '', // No password for social login
        emailVerified: true,
        socialProvider: 'facebook',
        socialId: profile.id,
        avatar: profile.picture?.data?.url
      });
    } else {
      // Update existing user with social info if not already set
      if (!user.socialProvider) {
        user.socialProvider = 'facebook';
        user.socialId = profile.id;
        user.avatar = profile.picture?.data?.url;
        await user.save();
      }
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({ message: 'Facebook login failed', error: error.message });
  }
});

// Twitter OAuth Login
router.post('/social-login/twitter', async (req, res) => {
  try {
    const { token, tokenSecret, profile } = req.body;
    
    // In a real app, verify the Twitter token with Twitter's API
    // For demo purposes, we'll use the provided profile data
    
    let user = await User.findOne({ 
      $or: [
        { email: profile.email },
        { socialId: profile.id, socialProvider: 'twitter' }
      ]
    });
    
    if (!user) {
      // Create new user from Twitter profile
      user = await User.create({
        name: profile.name || profile.screen_name,
        email: profile.email || `${profile.screen_name}@twitter.local`,
        passwordHash: '', // No password for social login
        emailVerified: true,
        socialProvider: 'twitter',
        socialId: profile.id,
        avatar: profile.profile_image_url_https
      });
    } else {
      // Update existing user with social info if not already set
      if (!user.socialProvider) {
        user.socialProvider = 'twitter';
        user.socialId = profile.id;
        user.avatar = profile.profile_image_url_https;
        await user.save();
      }
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Twitter login error:', error);
    res.status(500).json({ message: 'Twitter login failed', error: error.message });
  }
});

module.exports = router;