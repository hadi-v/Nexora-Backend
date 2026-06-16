const express =  require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { verifyToken } = require("../middlewares/verifyToken");
const { Cart } = require("../models/Cart");
const { CartItem } = require("../models/Cart_Item");
const { Order , validateNotes } = require("../models/Order");
const { OrderItem } = require("../models/Order_Item");
const { Product } = require("../models/Product");
const { ShippingAddress } = require("../models/Shipping_Address");
const { Governorate } = require("../models/Governorate");
const { Review , validateReview } = require("../models/Review");
const { Report , validateReport } = require("../models/Report");


router.post("/createOrder", verifyToken, asyncHandler(async (req, res) => {

    const { error } = validateNotes(req.body);
    
    if (error){
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id;
    const { shippingAddressId , notes } = req.body;

    const address = await ShippingAddress.findOne({
        _id: shippingAddressId,
        userId: userId
    });

    if (!address) {
        return res.status(404).json({ message: "Shipping address not found" });
    }

    const governorate = await Governorate.findById(address.governorateId);
    if (!governorate) {
        return res.status(404).json({ message: "Governorate not found" });
    }

    const shippingCost = governorate.shippingCost;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return res.status(400).json({ message: "Cart is empty" });
    }

    const cartItems = await CartItem.find({ cartId: cart._id }).populate("productId");

    if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart has no items" });
    }

    for (let item of cartItems) {
    const product = item.productId;

    if (!product.colors.includes(item.color)) {
        return res.status(400).json({
            message: `Color '${item.color}' is no longer available for product '${product.productName}'`
        });
    }
    }

    let totalAmount = 0;
    cartItems.forEach(item => {
        totalAmount += item.productId.price * item.quantity;
    });

    const finalTotal = totalAmount + shippingCost;

    const order = await Order.create({
        buyerId: userId,
        shippingAddressId,
        totalAmount: finalTotal,
        status: "pending",
        notes: notes
    });

    for (let item of cartItems) {
        await OrderItem.create({
            orderId: order._id,
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productId.price
        });
    }

    await CartItem.deleteMany({ cartId: cart._id });

    res.status(201).json({
        message: "Order created successfully",
        orderId: order._id,
        productsTotal: totalAmount,
        shippingCost,
        finalTotal
    });

}));

router.get("/userOrders", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ buyerId: userId });

    const orders = await Order.find({ buyerId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    if (orders.length === 0) {
        return res.status(200).json({
            message: "No orders found",
            page,
            limit,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            orders: []
        });
    }

    for (let order of orders) {
        const items = await OrderItem.find({ orderId: order._id })
            .populate("productId","productName price")
            .lean();
        order.items = items;
    }

    res.status(200).json({
        message: "User orders",
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        count: orders.length,
        orders
    });

}));

router.get("/singleOrder/:orderId", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
        _id: orderId,
        buyerId: userId
    })
    .populate("shippingAddressId")
    .lean();

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const items = await OrderItem.find({ orderId }).populate("productId","productName price ").lean();

    order.items = items;

    res.status(200).json({
        order
    });

}));

router.put("/cancelOrder/:orderId", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
        _id: orderId,
        buyerId: userId
    });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

   if (order.status !== "pending") {
    return res.status(400).json({
        message: `Order cannot be cancelled because it is currently '${order.status}'`
    });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({
        message: "Order cancelled successfully",
        orderId: order._id,
        status: order.status
    });

}));

router.get("/admin/AllUsersOrders", verifyToken, asyncHandler(async (req, res) => {

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: " Admins only allowed" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("buyerId", "fullName email")
        .populate("shippingAddressId")
        .lean();

    for (let order of orders) {
        const items = await OrderItem.find({ orderId: order._id })
            .populate("productId", "productName price")
            .lean();

        order.items = items;
    }

    res.status(200).json({
        message: "All users orders",
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        count: orders.length,
        orders
    });

}));

router.put("/admin/updateStatus/:orderId", verifyToken, asyncHandler(async (req, res) => {

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admins only allowed" });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const orderRank = {
        pending: 1,
        approved: 2,
        shipped: 3,
        delivered: 4,
        rejected: 99
    };

    const currentRank = orderRank[order.status];
    const newRank = orderRank[status];

    if (newRank < currentRank) {
        return res.status(400).json({
            message: `Cannot move from '${order.status}' back to '${status}'`
        });
    }

    if (["delivered", "rejected","cancelled"].includes(order.status)) {
        return res.status(400).json({
            message: `Order is already '${order.status}' and cannot be updated`
        });
    }

    if (status === "approved") {

        const items = await OrderItem.find({ orderId });

        for (let item of items) {
            const product = await Product.findById(item.productId);

            if (!product) continue;

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for product: ${product.productName}`
                });
            }

            product.stock -= item.quantity;
            await product.save();
        }
    }

    order.status = status;
    await order.save();

    res.status(200).json({
        message: "Status updated",
        order
    });

}));

router.post("/reviewOrder/:orderId", verifyToken, asyncHandler(async (req, res) => {

    const { error } = validateReview(req.body);
    
    if (error){
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id;
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    const order = await Order.findOne({ _id: orderId, buyerId: userId });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "delivered") {
        return res.status(400).json({ message: "You can only rate delivered orders" });
    }

    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
        return res.status(400).json({ message: "Order already rated" });
    }

    const newReview = await Review.create({
        orderId,
        userId,
        rating,
        comment
    });

    res.status(201).json({
        message: "Order rated successfully",
        review: newReview
    });

}));

router.post("/reportOrder/:orderId", verifyToken, asyncHandler(async (req, res) => {

    const { error } = validateReport(req.body);
    
    if (error){
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id;
    const { orderId } = req.params;
    const { reportMessage } = req.body;

    const order = await Order.findOne({ _id: orderId, buyerId: userId });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const existingReport = await Report.findOne({ orderId });
    if (existingReport) {
        return res.status(400).json({ message: "You already reported this order" });
    }

    const report = await Report.create({
        orderId,
        userId,
        reportMessage
    });

    res.status(201).json({
        message: "Report submitted successfully",
        report
    });

}));

router.get("/admin/allOrdersReviews", verifyToken, asyncHandler(async (req, res) => {

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admins only allowed" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalReviews = await Review.countDocuments();

    const reviews = await Review.find()
        .populate("orderId", "status totalAmount")
        .populate("userId", "fullName email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        message: "All order reviews",
        page,
        limit,
        totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
        count: reviews.length,
        reviews
    });

}));

router.get("/admin/allOrdersReports", verifyToken, asyncHandler(async (req, res) => {

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admins only allowed" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalReports = await Report.countDocuments();

    const reports = await Report.find()
        .populate("orderId", "status totalAmount")
        .populate("userId", "fullName email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        message: "All order reports",
        page,
        limit,
        totalReports,
        totalPages: Math.ceil(totalReports / limit),
        count: reports.length,
        reports
    });

}));


module.exports = router;
