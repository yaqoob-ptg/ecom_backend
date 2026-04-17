// const express = require('express');
// const asyncHandler = require('express-async-handler');
// const router = express.Router();
// const Order = require('../model/order');
// const Product = require('../model/product');
// const auth = require('../middleware/auth');

// router.use(auth);

// // Get all orders
// router.get('/', asyncHandler(async (req, res) => {
//     try {
//         const orders = await Order.find()
//         .populate('couponCode', 'id couponCode discountType discountAmount')
//         .populate('userID', 'id name').sort({ _id: -1 });
//         res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// router.get('/orderByUserId/:userId', asyncHandler(async (req, res) => {
//     try {
//         const userId = req.params.userId;
//         const orders = await Order.find({ userID: userId })
//             .populate('couponCode', 'id couponCode discountType discountAmount')
//             .populate('userID', 'id name')
//             .sort({ _id: -1 });
//         res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// // Get an order by ID
// router.get('/:id', asyncHandler(async (req, res) => {
//     try {
//         const orderID = req.params.id;
//         const order = await Order.findById(orderID)
//         .populate('couponCode', 'id couponCode discountType discountAmount')
//         .populate('userID', 'id name');
//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found." });
//         }
//         res.json({ success: true, message: "Order retrieved successfully.", data: order });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Create a new order
// router.post('/', asyncHandler(async (req, res) => {
//     const { userID,orderStatus, items, totalPrice, shippingAddress, paymentMethod, couponCode, orderTotal, trackingUrl } = req.body;
//     if (!userID || !items || !totalPrice || !shippingAddress || !paymentMethod || !orderTotal) {
//         return res.status(400).json({ success: false, message: "User ID, items, totalPrice, shippingAddress, paymentMethod, and orderTotal are required." });
//     }

//     try {
//         const order = new Order({ userID,orderStatus, items, totalPrice, shippingAddress, paymentMethod, couponCode, orderTotal, trackingUrl });
//         const newOrder = await order.save();
//         res.json({ success: true, message: "Order created successfully.", data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Update an order
// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const orderID = req.params.id;
//         const { orderStatus, trackingUrl } = req.body;
//         if (!orderStatus) {
//             return res.status(400).json({ success: false, message: "Order Status required." });
//         }

//         const updatedOrder = await Order.findByIdAndUpdate(
//             orderID,
//             { orderStatus, trackingUrl },
//             { new: true }
//         );

//         if (!updatedOrder) {
//             return res.status(404).json({ success: false, message: "Order not found." });
//         }

//         res.json({ success: true, message: "Order updated successfully.", data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Delete an order
// router.delete('/:id', asyncHandler(async (req, res) => {
//     try {
//         const orderID = req.params.id;
//         const deletedOrder = await Order.findByIdAndDelete(orderID);
//         if (!deletedOrder) {
//             return res.status(404).json({ success: false, message: "Order not found." });
//         }
//         res.json({ success: true, message: "Order deleted successfully." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// module.exports = router;




const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const Order = require('../model/order');
const Product = require('../model/product');
const Coupon = require('../model/couponCode');
const auth = require('../middleware/auth');

router.use(auth);

// Get all orders — admin sees only their own, superadmin/moderator sees all
router.get('/', asyncHandler(async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'admin') {
            filter.adminId = req.user._id;
        }

        const orders = await Order.find(filter)
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name')
            .sort({ _id: -1 });

        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get orders by user ID
router.get('/orderByUserId/:userId', asyncHandler(async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ userID: userId })
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name')
            .sort({ _id: -1 });

        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a single order by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Admin can only view their own orders
        if (req.user.role === 'admin' && order.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        res.json({ success: true, message: "Order retrieved successfully.", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create orders — splits by adminId, applies coupon only to the matching admin
router.post('/', asyncHandler(async (req, res) => {
    const {
        userID,
        orderStatus,
        items,           // [{ productID, productName, quantity, price, variant }]
        shippingAddress,
        paymentMethod,
        couponCode,      // coupon code string (optional)
        trackingUrl
    } = req.body;

    if (!userID || !items || !items.length || !shippingAddress || !paymentMethod) {
        return res.status(400).json({
            success: false,
            message: "userID, items, shippingAddress, and paymentMethod are required."
        });
    }

    try {
        // 1. Fetch all products to get their adminId
        const productIDs = items.map(i => i.productID);
        const products = await Product.find({ _id: { $in: productIDs } }).select('_id adminId');

        const productAdminMap = {};
        products.forEach(p => {
            productAdminMap[p._id.toString()] = p.adminId.toString();
        });

        // 2. Group items by adminId
        const adminItemsMap = {};
        for (const item of items) {
            const adminId = productAdminMap[item.productID.toString()];
            if (!adminId) continue; // skip if product not found
            if (!adminItemsMap[adminId]) adminItemsMap[adminId] = [];
            adminItemsMap[adminId].push(item);
        }

        // 3. Resolve coupon if provided
        let couponDoc = null;
        if (couponCode) {
            couponDoc = await Coupon.findOne({ couponCode, status: 'active' });
            if (couponDoc && couponDoc.endDate < new Date()) {
                couponDoc = null; // expired, treat as no coupon
            }
        }

        // 4. Create one order per admin
        const createdOrders = [];

        for (const [adminId, adminItems] of Object.entries(adminItemsMap)) {
            const subtotal = adminItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // Apply coupon only if it belongs to this admin
            let discount = 0;
            let appliedCoupon = null;

            if (couponDoc && couponDoc.adminId.toString() === adminId) {
                if (!couponDoc.minimumPurchaseAmount || subtotal >= couponDoc.minimumPurchaseAmount) {
                    if (couponDoc.discountType === 'fixed') {
                        discount = Math.min(couponDoc.discountAmount, subtotal);
                    } else if (couponDoc.discountType === 'percentage') {
                        discount = parseFloat(((subtotal * couponDoc.discountAmount) / 100).toFixed(2));
                    }
                    appliedCoupon = couponDoc._id;
                }
            }

            const total = parseFloat((subtotal - discount).toFixed(2));

            const order = new Order({
                userID,
                adminId,
                orderStatus: orderStatus || 'pending',
                items: adminItems,
                totalPrice: subtotal,
                shippingAddress,
                paymentMethod,
                couponCode: appliedCoupon,
                orderTotal: { subtotal, discount, total },
                trackingUrl
            });

            const saved = await order.save();
            createdOrders.push(saved._id);
        }

        res.json({
            success: true,
            message: `${createdOrders.length} order(s) created successfully.`,
            data: { orderIds: createdOrders }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update order status (admin can only update their own)
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const { orderStatus, trackingUrl } = req.body;
        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "orderStatus is required." });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (req.user.role === 'admin' && order.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        order.orderStatus = orderStatus;
        if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
        await order.save();

        res.json({ success: true, message: "Order updated successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete order
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (req.user.role === 'admin' && order.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;