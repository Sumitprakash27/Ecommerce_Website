const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notifyOnSale: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Wishlist', wishlistSchema);