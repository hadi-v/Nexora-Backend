const mongoose = require("mongoose");
const Joi = require("joi");

const ListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    }
}, { timestamps: true });

ListSchema.index({ userId: 1, name: 1 }, { unique: true });

const List = mongoose.model("List", ListSchema);

function validateList(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(3).max(30).required()
    });
    return schema.validate(obj);
}

module.exports = { 
    List,
    validateList };
