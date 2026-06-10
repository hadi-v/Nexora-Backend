const mongoose = require("mongoose");
const Joi = require("joi");

const ShippingAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  governorateId: {   
    type: mongoose.Schema.Types.ObjectId,
    ref: "Governorate",
    required: true
  },
  locationDetails: { 
    type: String,
    required: true,
    trim: true,
    minlength: 5
  }
}, { timestamps: true });

const ShippingAddress = mongoose.model("ShippingAddress", ShippingAddressSchema);

function validateShippingAddressSchema(obj){
    const schema = Joi.object({
        governorateId:  Joi.string().required(),
        locationDetails: Joi.string().trim().min(5).max(200).required()
    });
    return schema.validate(obj);
}

module.exports = { 
    ShippingAddress,
    validateShippingAddressSchema
 };
