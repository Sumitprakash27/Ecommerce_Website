const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
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
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        size: String,
        color: String,
        price: Number
    }],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    appliedCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    discountAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate total amount before save
cartSchema.pre('save', async function(next) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    if (this.discountAmount) {
        this.totalAmount -= this.discountAmount;
    }
    next();
});

module.exports = mongoose.model('Cart', cartSchema);