const router = require('express').Router();
const Review = require('../models/Review');
const auth = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const { productId } = req.params;

    const [reviews, total] = await Promise.all([
      Review.find({ productId })
        .populate('userId', 'name avatarUrl')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 }),
      Review.countDocuments({ productId })
    ]);

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Create a review
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rating, text, images } = req.body;
    const review = new Review({
      productId,
      userId: req.user._id,
      rating,
      text,
      images: images || []
    });

    await review.save();
    await review.populate('userId', 'name avatarUrl');
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
});

module.exports = router;