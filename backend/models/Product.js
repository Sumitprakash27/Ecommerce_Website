const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  descriptionShort: {
    type: String,
    required: true,
    trim: true
  },
  descriptionLong: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  categories: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    required: true
  }],
  mainImage: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create slug from title before saving
productSchema.pre('save', function(next) {
  if (!this.isModified('title')) return next();
  this.slug = this.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  next();
});

module.exports = mongoose.model('Product', productSchema);