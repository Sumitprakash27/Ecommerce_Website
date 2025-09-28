const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Get user count (admin only)
router.get('/count', auth, isAdmin, async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user count', error: error.message });
    }
});

// Get all users (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        // Add pagination and filtering
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status;
        const role = req.query.role;

        // Build query
        let query = {};
        
        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Status filter
        if (status) {
            if (status === 'active') query.isActive = true;
            else if (status === 'inactive') query.isActive = false;
            else if (status === 'verified') query.isVerified = true;
            else if (status === 'unverified') query.isVerified = false;
        }

        // Get users with their order statistics
        const users = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    orderCount: { $size: '$orders' },
                    totalSpent: { $sum: '$orders.total' }
                }
            },
            {
                $project: {
                    password: 0,
                    orders: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]).skip(skip).limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get single user by ID (admin only)
router.get('/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Update user (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, email, phone, isActive, isVerified } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isVerified !== undefined) updateData.isVerified = isVerified;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

// Toggle user status (admin only)
router.patch('/:id/toggle-status', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.isActive = !user.isActive;
        await user.save();
        
        res.json({ 
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status', error: error.message });
    }
});

// Export users (admin only)
router.get('/export', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
        
        // Create CSV content
        const csvHeader = 'ID,Name,Email,Phone,Active,Verified,Created At\n';
        const csvData = users.map(user => 
            `${user._id},"${user.name || ''}","${user.email}","${user.phone || ''}",${user.isActive},${user.isVerified},"${user.createdAt}"`
        ).join('\n');
        
        res.send(csvHeader + csvData);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting users', error: error.message });
    }
});

// Get single user details (admin only)
router.get('/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(req.params.id) }
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    orderCount: { $size: '$orders' },
                    totalSpent: { $sum: '$orders.total' },
                    lastOrder: { $max: '$orders.createdAt' }
                }
            },
            {
                $project: {
                    password: 0
                }
            }
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Update user status (active/inactive) (admin only)
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = req.body.isActive;
        await user.save();

        res.json({ message: 'User status updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status', error: error.message });
    }
});

// Get user statistics (admin only)
router.get('/stats/overview', auth, isAdmin, async (req, res) => {
    try {
        const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: false })
        ]);

        const userStats = await User.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'orders'
                }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    activeCustomers: {
                        $sum: {
                            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                        }
                    },
                    totalOrders: { $sum: { $size: '$orders' } },
                    averageOrdersPerCustomer: {
                        $avg: { $size: '$orders' }
                    }
                }
            }
        ]);

        res.json({
            totalUsers,
            activeUsers,
            inactiveUsers,
            statistics: userStats[0]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
    }
});

module.exports = router;