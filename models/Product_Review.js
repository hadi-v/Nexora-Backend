const mongoose = require("mongoose");
const Joi = require("joi");

const ProductReviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        minlength: 5,
        maxlength: 300
    }

}, { timestamps: true });

const ProductReview = mongoose.model("ProductReview", ProductReviewSchema);

function validateProductReview(obj) {
    const schema = Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().min(5).max(300)
    });
    return schema.validate(obj);
}

module.exports = {
    ProductReview,
    validateProductReview
};
