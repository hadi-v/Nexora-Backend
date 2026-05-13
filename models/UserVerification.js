const mongoose = require("mongoose");

const UserVerificationSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true
    },
    otp:{
        type: String,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now

    },
    expiresAt:{
         type: Date,
        default: Date.now
    }
});


const UserVerification = mongoose.model("UserVerification" ,UserVerificationSchema);

module.exports = {UserVerification}