const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const addressSchema = new mongoose.Schema({
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: {
        type: Boolean,
        default: false
    }
});

const sizePreferencesSchema = new mongoose.Schema({
    category: String,
    size: String
});

const savedPaymentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['card', 'upi']
    },
    lastFourDigits: String,
    cardType: String,
    expiryMonth: String,
    expiryYear: String,
    isDefault: Boolean
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  addresses: [addressSchema],
  cart: [{
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        default: 1
    },
    size: String,
    color: String
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  sizePreferences: [sizePreferencesSchema],
  savedPayments: [savedPaymentSchema],
  phoneNumber: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say']
  },
  lastLogin: Date,
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    deviceInfo: String
  }],
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  socialProvider: {
    type: String,
    enum: ['google', 'facebook', 'twitter'],
    default: null
  },
  socialId: String,
  avatar: String,
  notificationPreferences: {
    email: {
        marketing: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
        productAlerts: { type: Boolean, default: true }
    },
    push: {
        marketing: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
        productAlerts: { type: Boolean, default: true }
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save middleware to hash password (DISABLED - we hash manually in routes)
// userSchema.pre('save', async function(next) {
//   const user = this;
//   if (user.isModified('passwordHash')) {
//     const salt = await bcrypt.genSalt(10);
//     user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
//   }
//   next();
// });

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Generate authentication token
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    { 
      _id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  return token;
};

// Add to cart method
userSchema.methods.addToCart = async function(productId, quantity = 1, size = null, color = null) {
  const existingItem = this.cart.find(item => 
    item.product.toString() === productId.toString() &&
    item.size === size &&
    item.color === color
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.cart.push({ product: productId, quantity, size, color });
  }

  return this.save();
};

// Remove from cart method
userSchema.methods.removeFromCart = function(productId, size = null, color = null) {
  this.cart = this.cart.filter(item => 
    !(item.product.toString() === productId.toString() &&
      item.size === size &&
      item.color === color)
  );
  return this.save();
};

// Update cart item quantity
userSchema.methods.updateCartItemQuantity = function(productId, quantity, size = null, color = null) {
  const cartItem = this.cart.find(item => 
    item.product.toString() === productId.toString() &&
    item.size === size &&
    item.color === color
  );

  if (cartItem) {
    cartItem.quantity = quantity;
    return this.save();
  }
  return Promise.reject(new Error('Cart item not found'));
};

// Add to wishlist method
userSchema.methods.addToWishlist = function(productId) {
  if (!this.wishlist.includes(productId)) {
    this.wishlist.push(productId);
  }
  return this.save();
};

// Remove from wishlist method
userSchema.methods.removeFromWishlist = function(productId) {
  this.wishlist = this.wishlist.filter(item => item.toString() !== productId.toString());
  return this.save();
};

// Add address method
userSchema.methods.addAddress = function(addressData) {
  if (addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  this.addresses.push(addressData);
  return this.save();
};

// Update address method
userSchema.methods.updateAddress = function(addressId, addressData) {
  const address = this.addresses.id(addressId);
  if (!address) return Promise.reject(new Error('Address not found'));

  if (addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  Object.assign(address, addressData);
  return this.save();
};

// Delete address method
userSchema.methods.deleteAddress = function(addressId) {
  this.addresses = this.addresses.filter(addr => addr._id.toString() !== addressId.toString());
  return this.save();
};

// Add payment method
userSchema.methods.addPaymentMethod = function(paymentData) {
  if (paymentData.isDefault) {
    this.savedPayments.forEach(payment => payment.isDefault = false);
  }
  this.savedPayments.push(paymentData);
  return this.save();
};

// Remove payment method
userSchema.methods.removePaymentMethod = function(paymentId) {
  this.savedPayments = this.savedPayments.filter(payment => 
    payment._id.toString() !== paymentId.toString()
  );
  return this.save();
};

// Update notification preferences
userSchema.methods.updateNotificationPreferences = function(channel, type, value) {
  if (this.notificationPreferences?.[channel]?.hasOwnProperty(type)) {
    this.notificationPreferences[channel][type] = value;
    return this.save();
  }
  return Promise.reject(new Error('Invalid notification channel or type'));
};

// Add login history
userSchema.methods.addLoginHistory = function(ipAddress, deviceInfo) {
  this.lastLogin = new Date();
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    deviceInfo
  });
  return this.save();
};

// Update account status
userSchema.methods.updateAccountStatus = function(status) {
  if (!['active', 'suspended', 'deactivated'].includes(status)) {
    return Promise.reject(new Error('Invalid account status'));
  }
  this.accountStatus = status;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);