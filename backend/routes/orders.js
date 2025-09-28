const router = require('express').Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Get order statistics (admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const stats = await Order.getOrderStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order statistics', error: error.message });
    }
});

// Get all orders with filtering and pagination (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status;
        const paymentStatus = req.query.paymentStatus;
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;

        // Build query
        let query = {};
        
        // Search filter
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { trackingNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Status filters
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        
        // Date range filter
        if (dateFrom || dateTo) {
            query.orderDate = {};
            if (dateFrom) query.orderDate.$gte = new Date(dateFrom);
            if (dateTo) query.orderDate.$lte = new Date(dateTo);
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('items.product', 'title imageUrl')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Get single order by ID (admin only)
router.get('/:id', auth, isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('items.product', 'title imageUrl category');
            
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
});

// Update order status (admin only)
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { status, trackingNumber, notes } = req.body;
        
        const updateData = { status };
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (notes) updateData.notes = notes;
        
        // Set timestamps based on status
        if (status === 'shipped' && !updateData.shippedDate) {
            updateData.shippedDate = new Date();
        } else if (status === 'delivered' && !updateData.deliveredDate) {
            updateData.deliveredDate = new Date();
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('user', 'name email');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json({ 
            message: `Order status updated to ${status}`,
            order 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
});

// Update payment status (admin only)
router.patch('/:id/payment', auth, isAdmin, async (req, res) => {
    try {
        const { paymentStatus, paymentId } = req.body;
        
        const updateData = { paymentStatus };
        if (paymentId) updateData.paymentId = paymentId;
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json({ 
            message: `Payment status updated to ${paymentStatus}`,
            order 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment status', error: error.message });
    }
});

// Cancel order (admin only)
router.patch('/:id/cancel', auth, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (['delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ 
                message: `Cannot cancel order with status: ${order.status}` 
            });
        }
        
        order.status = 'cancelled';
        if (reason) order.notes = reason;
        await order.save();
        
        res.json({ 
            message: 'Order cancelled successfully',
            order 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling order', error: error.message });
    }
});

// Export orders (admin only)
router.get('/export/csv', auth, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ orderDate: -1 });
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
        
        // Create CSV content
        const csvHeader = 'Order Number,Customer Name,Customer Email,Order Date,Status,Payment Status,Total,Items Count\\n';
        const csvData = orders.map(order => 
            `"${order.orderNumber}","${order.user?.name || 'Unknown'}","${order.user?.email || 'Unknown'}","${order.orderDate}","${order.status}","${order.paymentStatus}","${order.total}","${order.items.length}"`
        ).join('\\n');
        
        res.send(csvHeader + csvData);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting orders', error: error.message });
    }
});

// Get user's orders (authenticated user)
router.get('/user/orders', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product', 'title imageUrl')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Order.countDocuments({ user: req.user._id });
        
        res.json({
            orders,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user orders', error: error.message });
    }
});

// Create new order (authenticated user)
router.post('/', auth, async (req, res) => {
    try {
        const orderData = {
            ...req.body,
            user: req.user._id
        };
        
        const order = new Order(orderData);
        order.calculateTotal();
        await order.save();
        
        await order.populate('items.product', 'title imageUrl');
        
        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        res.status(400).json({ message: 'Error creating order', error: error.message });
    }
});

module.exports = router;