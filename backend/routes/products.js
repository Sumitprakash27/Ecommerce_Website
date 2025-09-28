const router = require('express').Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get product count
router.get('/count', async (req, res) => {
    try {
        const count = await Product.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product count', error: error.message });
    }
});

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { limit = 10, page = 1, q, category } = req.query;
    const query = {};

    // Search filter
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { descriptionShort: { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.categories = category;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 }),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Create product (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    console.log('Search request received:', req.query);
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ results: [] });
    }

    const searchTerm = q.trim();
    console.log('Searching for:', searchTerm);

    const products = await Product.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { descriptionShort: { $regex: searchTerm, $options: 'i' } },
        { descriptionLong: { $regex: searchTerm, $options: 'i' } },
        { categories: { $in: [new RegExp(searchTerm, 'i')] } },
        { slug: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('title price mainImage descriptionShort slug')
    .limit(10);

    console.log(`Found ${products.length} products`);
    res.json({ results: products });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
});

// Update product by ID (admin only)
// Import products from Excel
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const products = xlsx.utils.sheet_to_json(worksheet);

        // Validate Excel data
        const requiredFields = ['title', 'categories', 'price', 'descriptionShort', 'stock', 'mainImage'];
        for (const product of products) {
            const missingFields = requiredFields.filter(field => !product[field]);
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    row: products.indexOf(product) + 2
                });
            }
        }

        // Import products
        const importedProducts = await Product.insertMany(
            products.map(product => ({
                title: product.title,
                categories: Array.isArray(product.categories) ? product.categories : [product.categories],
                price: product.price,
                descriptionShort: product.descriptionShort,
                descriptionLong: product.descriptionLong || product.descriptionShort,
                stock: product.stock,
                mainImage: product.mainImage,
                images: product.images ? product.images.split(',') : [product.mainImage]
            }))
        );

        res.status(201).json({
            message: `Successfully imported ${importedProducts.length} products`,
            products: importedProducts
        });
    } catch (error) {
        res.status(400).json({ message: 'Error importing products', error: error.message });
    }
});

// Get product analytics
router.get('/analytics', auth, isAdmin, async (req, res) => {
    try {
        // Basic analytics
        const totalProducts = await Product.countDocuments();
        const lowStock = await Product.countDocuments({ stock: { $lt: 10 } });
        
        // Category analytics
        const categories = await Product.distinct('categories');
        const productsByCategory = await Promise.all(
            categories.map(async category => ({
                category,
                count: await Product.countDocuments({ categories: category })
            }))
        );

        // Price analytics
        const priceStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);

        // Stock analytics
        const stockStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalStock: { $sum: '$stock' },
                    avgStock: { $avg: '$stock' },
                    outOfStock: {
                        $sum: {
                            $cond: [{ $eq: ['$stock', 0] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Recent products
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title price stock createdAt');

        res.json({
            totalProducts,
            lowStock,
            categories,
            productsByCategory,
            priceAnalytics: priceStats[0],
            stockAnalytics: stockStats[0],
            recentProducts
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
});

module.exports = router;