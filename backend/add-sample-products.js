const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-store');

const Product = require('./models/Product');

const sampleProducts = [
  {
    title: 'Summer Dress',
    slug: 'summer-dress',
    descriptionShort: 'Light and breezy summer dress',
    descriptionLong: 'Beautiful floral print summer dress perfect for warm days. Made from 100% cotton.',
    price: 49.99,
    categories: ['women', 'dresses', 'summer'],
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'
    ],
    mainImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    stock: 100
  },
  {
    title: 'Classic T-Shirt',
    slug: 'classic-t-shirt',
    descriptionShort: 'Essential cotton t-shirt',
    descriptionLong: 'Classic crew neck t-shirt made from premium cotton. Available in multiple colors.',
    price: 19.99,
    categories: ['men', 'basics', 't-shirts'],
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
    ],
    mainImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    stock: 200
  },
  {
    title: 'Running Shoes',
    slug: 'running-shoes',
    descriptionShort: 'Comfortable running shoes',
    descriptionLong: 'High-performance running shoes with excellent cushioning and support.',
    price: 89.99,
    categories: ['unisex', 'shoes', 'sports'],
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
    ],
    mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    stock: 150
  },
  {
    title: 'Leather Handbag',
    slug: 'leather-handbag',
    descriptionShort: 'Stylish leather handbag',
    descriptionLong: 'Premium leather handbag with multiple compartments. Perfect for daily use.',
    price: 129.99,
    categories: ['women', 'accessories', 'bags'],
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400'
    ],
    mainImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    stock: 75
  },
  {
    title: 'Denim Jacket',
    slug: 'denim-jacket',
    descriptionShort: 'Classic denim jacket',
    descriptionLong: 'Timeless denim jacket with vintage wash. Perfect for layering.',
    price: 69.99,
    categories: ['unisex', 'jackets', 'denim'],
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400'
    ],
    mainImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    stock: 120
  }
];

async function addSampleProducts() {
  try {
    console.log('Adding sample products...');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Add sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Added ${products.length} sample products:`);
    
    products.forEach(product => {
      console.log(`- ${product.title} ($${product.price})`);
    });
    
    console.log('Sample products added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample products:', error);
    process.exit(1);
  }
}

addSampleProducts();