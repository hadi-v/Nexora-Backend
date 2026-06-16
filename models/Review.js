const mongoose = require("mongoose");
const Joi = require('joi');

const ReviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    unique: true 
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
    minlength:5,
    maxlength: 300
  }
}, { timestamps: true });

const Review = mongoose.model("Review", ReviewSchema);

function validateReview(obj){
    const schema = Joi.object({
        rating:  Joi.number().min(1).max(5).required(),
        comment: Joi.string().trim().min(5).max(300).required()
    });
    return schema.validate(obj);
}

module.exports = { 
    Review,
    validateReview
};
