const mongoose = require("mongoose");
const Joi = require('joi');
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        maxlength: 30,
        unique: true
    },
    userName:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    birthDate:{
        type: Date,
        required: true
    },
    phone:{               
        type: String,
        required: true
    },
    phoneVerified: {
    type: Boolean,
    default: false
    },
    isAdmin:{
        type: Boolean,
        default: false
    },
    verified:{
        type: Boolean,
        default: false
    }
}, {timestamps: true});

UserSchema.methods.generateToken = function(req){
    return jwt.sign(
        {
            id: this._id,
            isAdmin: this.isAdmin,
        },
        process.env.JWT_SECRET_KEY
    );
}

const User = mongoose.model("User" , UserSchema);

function validateRegisterUser(obj){
    const schema = Joi.object({
        email:  Joi.string().trim().min(7).max(30).required().email(),
        userName: Joi.string().trim().min(3).max(20).required(),
        password: Joi.string().trim().min(3).required(),
        birthDate: Joi.date().required(),
        phone: Joi.string().pattern(/^09\d{8}$/).required().messages({"string.pattern.base": "Phone number must start with 09 and be 10 digits"})
    });
    return schema.validate(obj);
}

function validateLoginUser(obj){
    const schema = Joi.object({
        email:  Joi.string().trim().min(7).max(30).required().email(),
        password: Joi.string().trim().min(3).required(),
    });
    return schema.validate(obj);
}

function validateUpdateUser(obj){
    const schema = Joi.object({
        userName: Joi.string().trim().min(3).max(20),
        password: Joi.string().trim().min(3),
        phone: Joi.string().pattern(/^09\d{8}$/).messages({"string.pattern.base": "Phone number must start with 09 and be 10 digits"})
    });
    return schema.validate(obj);
}

function validateNewPassword(obj) {
    const schema = Joi.object({
        newPassword: Joi.string().trim().min(3),
    });
    return schema.validate(obj);
}

module.exports = {
    User,
    validateRegisterUser,
    validateLoginUser,
    validateUpdateUser,
    validateNewPassword
}