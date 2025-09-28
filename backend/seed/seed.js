require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');

const sampleProducts = [
  {
    title: 'Summer Dress',
    descriptionShort: 'Light and breezy summer dress',
    descriptionLong: 'Beautiful floral print summer dress perfect for warm days. Made from 100% cotton.',
    price: 49.99,
    categories: ['women', 'dresses', 'summer'],
    images: [
      'https://example.com/dress1.jpg',
      'https://example.com/dress2.jpg'
    ],
    mainImage: 'https://example.com/dress1.jpg',
    videoUrl: 'https://example.com/dress-video.mp4',
    stock: 100
  },
  {
    title: 'Classic T-Shirt',
    descriptionShort: 'Essential cotton t-shirt',
    descriptionLong: 'Classic crew neck t-shirt made from premium cotton. Available in multiple colors.',
    price: 19.99,
    categories: ['men', 'basics', 't-shirts'],
    images: [
      'https://example.com/tshirt1.jpg',
      'https://example.com/tshirt2.jpg'
    ],
    mainImage: 'https://example.com/tshirt1.jpg',
    stock: 200
  }
];

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Review.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash
    });
    console.log('Created test user');

    // Create products
    const products = await Product.insertMany(sampleProducts);
    console.log('Created sample products');

    // Create reviews
    const reviews = await Review.insertMany(
      products.map(product => ({
        productId: product._id,
        userId: user._id,
        rating: Math.floor(Math.random() * 5) + 1,
        text: 'Great product, highly recommend!',
        images: []
      }))
    );
    console.log('Created sample reviews');

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();