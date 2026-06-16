const mongoose = require("mongoose");
const Joi = require('joi');

const OrderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  shippingAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShippingAddress",
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: {
  type: String,
  trim: true,
  maxlength:500,
  default: ""
  },
  status: {
    type: String,
    enum: ["pending","approved","shipped","rejected", "delivered", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

const Order = mongoose.model("Order", OrderSchema);

function validateNotes(obj){
    const schema = Joi.object({
        shippingAddressId: Joi.string().required(),
        notes: Joi.string().trim().max(500)
    });
    return schema.validate(obj);
}

module.exports = { 
  Order,
  validateNotes
};
