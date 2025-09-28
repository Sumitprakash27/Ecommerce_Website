const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateToken = require('../middleware/authenticateToken');

// Cart Schema
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    totalItems: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate totals before saving
cartSchema.pre('save', function() {
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.updatedAt = new Date();
});

// Create Cart model
const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
        
        if (!cart) {
            cart = new Cart({ userId: req.user.id, items: [] });
            await cart.save();
        }
        
        res.json(cart);
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Error retrieving cart', error: error.message });
    }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Import Product model dynamically to avoid circular dependency
        const Product = require('../models/Product');
        
        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        let cart = await Cart.findOne({ userId: req.user.id });
        
        if (!cart) {
            cart = new Cart({ userId: req.user.id, items: [] });
        }
        
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );
        
        if (existingItemIndex >= 0) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.items.push({
                productId: productId,
                quantity: quantity,
                price: product.price * 83 // Convert to INR
            });
        }
        
        await cart.save();
        
        // Populate and return updated cart
        cart = await Cart.findById(cart._id).populate('items.productId');
        
        res.json({ 
            message: 'Item added to cart successfully', 
            cart: cart 
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
});

// Update cart item quantity
router.put('/update/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Valid quantity is required' });
        }
        
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        
        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }
        
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate('items.productId');
        
        res.json({ 
            message: 'Cart updated successfully', 
            cart: updatedCart 
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart', error: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate('items.productId');
        
        res.json({ 
            message: 'Item removed from cart successfully', 
            cart: updatedCart 
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        
        cart.items = [];
        await cart.save();
        
        res.json({ 
            message: 'Cart cleared successfully', 
            cart: cart 
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
});

module.exports = router;