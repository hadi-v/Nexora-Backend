const mongoose = require("mongoose");
const Joi = require('joi');


const CategorySchema = new mongoose.Schema({
    categoryName:{

        type: String,
        required: true,
        trim: true,
        minlength: 3

    }
})

const Category = mongoose.model("Category" , CategorySchema );

function validateCategory(obj){
    const schema = Joi.object({
        categoryName: Joi.string().trim().min(3).required(),
    });
    return schema.validate(obj);
}

module.exports = {
    Category,
    validateCategory
}