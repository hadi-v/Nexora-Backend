const mongoose = require("mongoose");
const Joi = require('joi');

const StoreSchema = new mongoose.Schema({

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
        unique: true
    },
    storeName:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
    },
    description:{
        type: String,
        required: true,
        trim: true,
    },
    image:{
        type: String,
        default: "default-avatar.png"
    }
}, {timestamps: true});


const Store = mongoose.model("Store" , StoreSchema);

function validateUpdateStore(obj){
    const schema = Joi.object({
        storeName:  Joi.string().trim().min(3).max(20),
        description: Joi.string().trim(),
        image: Joi.string()
    });
    return schema.validate(obj);
}

module.exports = {
    Store,
    validateUpdateStore
}