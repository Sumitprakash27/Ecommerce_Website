const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
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
        title: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        size: String,
        color: String,
        imageUrl: String
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    shippingAddress: {
        fullName: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'razorpay', 'paypal', 'cod', 'credit_card', 'debit_card', 'stripe', 'cash_on_delivery']
    },
    paymentDetails: {
        transactionId: String,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'paid', 'refunded'],
            default: 'pending'
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: String,
    shippingMethod: {
        type: String,
        required: true
    },
    trackingNumber: String,
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    estimatedDeliveryDate: Date,
    totalAmount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        required: true
    },
    couponApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    statusHistory: [{
        status: String,
        date: {
            type: Date,
            default: Date.now
        },
        comment: String
    }]
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

// Instance method to calculate total
orderSchema.methods.calculateTotal = function() {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.total = this.subtotal + (this.tax || 0) + (this.shippingCost || 0) - (this.discount || 0);
    return this.total;
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
                avgOrderValue: { $avg: '$total' },
                pendingOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                processingOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
                },
                shippedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
                },
                deliveredOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                },
                cancelledOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
    };
};

module.exports = mongoose.model('Order', orderSchema);