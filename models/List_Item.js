const mongoose = require("mongoose");
const Joi = require("joi");

const ListItemSchema = new mongoose.Schema({
    listId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "List",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    }
}, { timestamps: true });

const ListItem = mongoose.model("ListItem", ListItemSchema);

module.exports = {ListItem};
