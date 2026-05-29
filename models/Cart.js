const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true  
    }
}, { timestamps: true });

const Cart = mongoose.model("Cart", CartSchema);

module.exports = { Cart };