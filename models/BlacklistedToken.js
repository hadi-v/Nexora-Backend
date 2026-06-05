const mongoose = require("mongoose");

const BlacklistedTokenSchema = new mongoose.Schema({
    token:
     {
         type: String, 
        required: true
     },
    userId:
     { type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
     }
});

const BlacklistedToken = mongoose.model("BlacklistedToken", BlacklistedTokenSchema);
 
module.exports = {BlacklistedToken};