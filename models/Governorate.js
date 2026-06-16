const mongoose = require("mongoose");

const GovernorateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2
  },
  shippingCost: {
       type: Number,
       required: true 
      }
}, { timestamps: true });

const Governorate = mongoose.model("Governorate", GovernorateSchema);

module.exports = { Governorate };
