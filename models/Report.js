const mongoose = require("mongoose");
const Joi = require('joi');

const ReportSchema = new mongoose.Schema({
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
  reportMessage: {
    type: String,
    required: true,
    minlength:10,
    maxlength: 500
  }
}, { timestamps: true });

const Report = mongoose.model("Report", ReportSchema);

function validateReport(obj){
    const schema = Joi.object({
        reportMessage: Joi.string().trim().min(10).max(500).required()
    });
    return schema.validate(obj);
}

module.exports = {
     Report,
     validateReport
    };
