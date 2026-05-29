const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { timestamps: true });

const CartItem = mongoose.model("CartItem", CartItemSchema);

module.exports = { CartItem };
