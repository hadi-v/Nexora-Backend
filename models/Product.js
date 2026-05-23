const mongoose = require("mongoose");
const Joi = require('joi');

const ProductSchema = new mongoose.Schema({

    category:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Category",
    },
    productName:{
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    description:{
        type: String,
        required: true,
        trim: true
    },
    price:{
        type: Number,
        required: true,
        min: 0
    },
    stock:{
        type: Number,
        required: true,
        min: 0
    },
    images: {
    type: [String],   
    default: []
    }
}, {timestamps: true});


const Product = mongoose.model("Product" , ProductSchema);

function validateProduct(obj){
    const schema = Joi.object({
        categoryName: Joi.string().min(3).required(),
        productName:  Joi.string().trim().min(3).required(),
        description: Joi.string().trim(),
        price: Joi.number().min(0).required(),
        stock: Joi.number().min(0).required(),
        images: Joi.array().items(Joi.string())
    });
    return schema.validate(obj);
}
function validateUpdateProduct(obj){
    const schema = Joi.object({
        categoryName: Joi.string().min(3),
        productName:  Joi.string().trim().min(3),
        description: Joi.string().trim(),
        price: Joi.number().min(0),
        stock: Joi.number().min(0),
        images: Joi.array().items(Joi.string())
    });
    return schema.validate(obj);
}

module.exports = {
    Product,
    validateProduct,
    validateUpdateProduct
}