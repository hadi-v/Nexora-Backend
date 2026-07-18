const express =  require("express");
const router = express.Router();
const { Cart } = require("../models/Cart");
const { CartItem } = require("../models/Cart_Item");
const { Product } = require("../models/Product");
const asyncHandler = require("express-async-handler");
const { verifyToken } = require("../middlewares/verifyToken");
const dotenv = require("dotenv");
dotenv.config();


router.post("/addToCart", verifyToken, asyncHandler(async (req, res) => {

    const { productId, quantity, color } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    if (!color) {
        return res.status(400).json({ message: "Color is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    if (!product.colors.includes(color.toLowerCase())) {
        return res.status(400).json({
            message: `Color '${color}' is not available for this product`});
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
        cart = await Cart.create({ userId: req.user.id });
    }

    let cartItem = await CartItem.findOne({
        cartId: cart._id,
        productId: productId,
        color: color.toLowerCase()
    }).populate("productId", "productName price");

    if (cartItem) {

        if (cartItem.quantity + quantity > product.stock) {
            return res.status(400).json({
                message: `Only ${product.stock} items available in stock`
            });
        }

        cartItem.quantity += quantity;
        await cartItem.save();

    } else {

        if (quantity > product.stock) {
            return res.status(400).json({
                message: `Only ${product.stock} items available in stock`
            });
        }

        cartItem = await CartItem.create({
            cartId: cart._id,
            productId,
            quantity,
            color: color.toLowerCase()
        });
    }

    res.status(200).json({
        message: "Product added to cart",
        cartItem
    });

}));

router.get("/userCart", verifyToken, asyncHandler(async (req, res) => {

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
        return res.status(200).json({
            message: "Cart is empty",
            items: [],
            total: 0
        });
    }

    const items = await CartItem.find({ cartId: cart._id })
        .populate("productId", "productName price");

    let total = 0;

    const totalItems = items.map(item => {
        const product = item.productId;
        const subtotal = product.price * item.quantity;
        total += subtotal;

        return {
            productName: product.productName,
            price: product.price,
            quantity: item.quantity,
            color: item.color, 
            subtotal
        };
    });

    res.status(200).json({
        message: "User cart",
        items: totalItems,
        total
    });

}));

router.delete("/removeItem/:productId", verifyToken, asyncHandler(async (req, res) => {

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    const deletedItem = await CartItem.findOneAndDelete({
        cartId: cart._id,
        productId: req.params.productId
    });

    if (!deletedItem) {
        return res.status(404).json({ message: "Product not found in cart" });
    }

    res.status(200).json({
        message: "Product removed from cart"
    });

}));

router.patch("/updateQuantity/:productId", verifyToken, asyncHandler(async (req, res) => {

    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    const cartItem = await CartItem.findOne({
        cartId: cart._id,
        productId: req.params.productId
    });

    if (!cartItem) {
        return res.status(404).json({ message: "Product not found in cart" });
    }

    const product = await Product.findById(req.params.productId);
    if (quantity > product.stock) {
        return res.status(400).json({
            message: `Only ${product.stock} items available in stock`
        });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
        message: "Quantity updated successfully",
        cartItem
    });

}));

router.delete("/clearCart", verifyToken, asyncHandler(async (req, res) => {

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    await CartItem.deleteMany({ cartId: cart._id });

    res.status(200).json({
        message: "Cart cleared successfully"
    });

}));

router.get("/totalItems", verifyToken, asyncHandler(async (req, res) => {

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
        return res.status(200).json({ totalItems: 0 });
    }

    const items = await CartItem.find({ cartId: cart._id });

    let totalItems = 0;

    for (let item of items) {
        totalItems += item.quantity;
    }

    res.status(200).json({ 
        message: "Total Items",
        totalItems });

}));

module.exports = router;
