const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-store');

async function createSampleOrders() {
    try {
        console.log('Creating sample orders...');
        
        // Get users and products
        const users = await User.find().limit(5);
        const products = await Product.find().limit(10);
        
        if (users.length === 0 || products.length === 0) {
            console.log('❌ No users or products found. Please create some first.');
            process.exit(1);
        }
        
        // Create sample orders (limited to available products and users)
        const sampleOrders = [
            {
                user: users[0]._id,
                items: [
                    {
                        product: products[0]._id,
                        title: products[0].title,
                        price: products[0].price,
                        quantity: 2,
                        size: 'M',
                        color: 'Black',
                        imageUrl: products[0].imageUrl
                    }
                ],
                subtotal: products[0].price * 2,
                totalAmount: (products[0].price * 2) + 8.99,
                shippingCost: 8.99,
                discountAmount: 0,
                status: 'pending',
                orderStatus: 'pending',
                paymentMethod: 'credit_card',
                paymentDetails: { status: 'pending' },
                paymentStatus: 'pending',
                shippingAddress: {
                    fullName: 'John Smith',
                    street: '123 High Street',
                    city: 'London',
                    zipCode: 'SW1A 1AA',
                    country: 'United Kingdom',
                    phone: '+44 20 1234 5678'
                },
                shippingMethod: 'standard'
            },
            {
                user: users[1]._id,
                items: [
                    {
                        product: products[1]._id,
                        title: products[1].title,
                        price: products[1].price,
                        quantity: 1,
                        size: 'S',
                        color: 'Red',
                        imageUrl: products[1].imageUrl
                    }
                ],
                subtotal: products[1].price,
                totalAmount: products[1].price + 5.99,
                shippingCost: 5.99,
                discountAmount: 0,
                status: 'processing',
                orderStatus: 'processing',
                paymentMethod: 'paypal',
                paymentDetails: { 
                    status: 'completed',
                    transactionId: 'PAY-' + Math.random().toString(36).substr(2, 9)
                },
                paymentStatus: 'paid',
                paymentId: 'PAY-' + Math.random().toString(36).substr(2, 9),
                shippingAddress: {
                    fullName: 'Sarah Johnson',
                    street: '456 King Road',
                    city: 'Manchester',
                    zipCode: 'M1 2AB',
                    country: 'United Kingdom',
                    phone: '+44 161 123 4567'
                },
                shippingMethod: 'express'
            },
            {
                user: users[0]._id,
                items: [
                    {
                        product: products[2]._id,
                        title: products[2].title,
                        price: products[2].price,
                        quantity: 3,
                        size: 'XL',
                        color: 'White',
                        imageUrl: products[2].imageUrl
                    }
                ],
                subtotal: products[2].price * 3,
                totalAmount: products[2].price * 3,
                shippingCost: 0, // Free shipping
                discountAmount: 0,
                status: 'shipped',
                orderStatus: 'shipped',
                paymentMethod: 'debit_card',
                paymentDetails: { 
                    status: 'completed',
                    transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9)
                },
                paymentStatus: 'paid',
                paymentId: 'TXN-' + Math.random().toString(36).substr(2, 9),
                trackingNumber: 'TRK-' + Math.random().toString(36).substr(2, 10).toUpperCase(),
                estimatedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
                shippingAddress: {
                    fullName: 'Mike Brown',
                    street: '789 Queen Street',
                    city: 'Birmingham',
                    zipCode: 'B1 1AA',
                    country: 'United Kingdom',
                    phone: '+44 121 123 4567'
                },
                shippingMethod: 'overnight'
            }
        ];
        
        // Clear existing orders
        await Order.deleteMany({});
        console.log('✅ Cleared existing orders');
        
        // Create orders
        for (let orderData of sampleOrders) {
            const order = new Order(orderData);
            await order.save();
            console.log(`✅ Created order: ${order.orderNumber} - ${order.status}`);
        }
        
        console.log('\\n🎉 Sample orders created successfully!');
        console.log('\\n📊 Order Summary:');
        
        const stats = await Order.getOrderStats();
        console.log(`Total Orders: ${stats.totalOrders}`);
        console.log(`Total Revenue: £${stats.totalRevenue?.toFixed(2) || '0.00'}`);
        console.log(`Average Order Value: £${stats.avgOrderValue?.toFixed(2) || '0.00'}`);
        console.log(`Pending: ${stats.pendingOrders}`);
        console.log(`Processing: ${stats.processingOrders}`);
        console.log(`Shipped: ${stats.shippedOrders}`);
        console.log(`Delivered: ${stats.deliveredOrders}`);
        console.log(`Cancelled: ${stats.cancelledOrders}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating sample orders:', error);
        process.exit(1);
    }
}

createSampleOrders();