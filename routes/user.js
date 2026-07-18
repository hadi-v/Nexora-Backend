const express =  require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { User , validateUpdateUser } = require("../models/User");
const { Store , validateUpdateStore } = require("../models/Store");
const { Product } = require("../models/Product");
const { List , validateList } = require("../models/List");
const { ListItem } = require("../models/List_Item");
const { Cart } = require("../models/Cart");
const { CartItem } = require("../models/Cart_Item");
const { BlacklistedToken } = require("../models/BlacklistedToken");
const { ShippingAddress, validateShippingAddressSchema } = require("../models/Shipping_Address");
const { Governorate } = require("../models/Governorate");
const { verifyToken } = require("../middlewares/verifyToken");
const  upload  = require("../middlewares/upload");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();


router.get("/profile", verifyToken, asyncHandler(async (req,res) =>{
    
    const user = await User.findById(req.user.id).select("email userName birthDate phone phoneVerified profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User profile:",
      user
    });
}));

router.put("/updateUser", verifyToken, upload.single("profileImage"), asyncHandler(async (req , res) => {

    const { error } = validateUpdateUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id; 

    let user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (req.body.userName) user.userName = req.body.userName;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
    }
    if (req.file) {

        if (user.profileImage) {
            const oldImagePath = path.join(__dirname, "..", "images", user.profileImage);

            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        user.profileImage = req.file.filename;
    }

    await user.save();

    const { password, ...other } = user._doc;

    res.json({
        message: "User updated successfully",
        user: other
    });

}));

router.delete("/deleteAccount", verifyToken, asyncHandler(async (req, res) => {

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ message: "Account not found" });
    }

    if (user.profileImage) {
        const oldImagePath = path.join(__dirname, "..", "images", user.profileImage);

        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);   
        }
        
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (cart) {
        await CartItem.deleteMany({ cartId: cart._id });
        await Cart.deleteOne({ _id: cart._id });
    }

    await ListItem.deleteMany({ userId: req.user.id });
    await List.deleteMany({ userId: req.user.id });

    await ShippingAddress.deleteMany({ userId: req.user.id });

    await BlacklistedToken.deleteMany({ userId: req.user.id });

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
        message: "Account and all related data deleted successfully"
    });

}));

router.put("/admin/updateStore", verifyToken, upload.single("image"), asyncHandler(async (req, res) => {

    const { error } = validateUpdateStore(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
        return res.status(403).json({ message: "Only admin can update store info" });
    }

    const store = await Store.findOne({ owner: userId });
    if (!store) {
        return res.status(404).json({ message: "Store not found" });
    }

    if (req.body.storeName) store.storeName = req.body.storeName;
    if (req.body.description) store.description = req.body.description;
    if (req.file) {

        if (store.image) {
            const oldImagePath = path.join(__dirname, "..", "images", store.image);

            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        store.image = req.file.filename;
    }

    await store.save();

    res.json({
        message: "Store updated successfully",
        store
    });

}));

router.get("/admin/users", verifyToken, asyncHandler(async (req,res) => {
    
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admin can view users" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();

    const users = await User.find()
        .select("-password")
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        message: "Users:",
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        count: users.length,
        data: users
    });
}));

router.post("/addAddress", verifyToken, asyncHandler(async (req, res) => {

    const { error } = validateShippingAddressSchema(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { governorateId, locationDetails } = req.body;

    const governorate = await Governorate.findById(governorateId);
    if (!governorate) {
        return res.status(404).json({ message: "Governorate not found" });
    }

    const address = new ShippingAddress({
        userId: req.user.id,
        governorateId,
        locationDetails
    });

    await address.save();

    res.status(201).json({
        message: "Shipping address added successfully",
        address
    });

}));

router.delete("/deleteAddress/:id", verifyToken, asyncHandler(async (req, res) => {

    const addressId = req.params.id;

    const address = await ShippingAddress.findById(addressId);
    if (!address) {
        return res.status(404).json({ message: "Address not found" });
    }

    if (address.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "You are not allowed to delete this address" });
    }

    await ShippingAddress.findByIdAndDelete(addressId);

    res.status(200).json({
        message: "Address deleted successfully"
    });

}));

router.get("/addresses", verifyToken, asyncHandler(async (req, res) => {

    const addresses = await ShippingAddress.find({ userId: req.user.id }).populate("governorateId", "name");
    
    res.status(200).json({
        message: "User addresses",
        count: addresses.length,
        data: addresses
    });

}));

router.post("/addToFavourite/:productId", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    let favouriteList = await List.findOne({ userId, name: "favourite" });

    const exists = await ListItem.findOne({
        listId: favouriteList._id,
        productId
    });

    if (exists) {
        return res.status(400).json({ message: "Product already in favourite" });
    }

    const item = await ListItem.create({
        listId: favouriteList._id,
        productId
    });

    res.status(201).json({
        message: "Product added to favourite",
        data: item
    });

}));

router.delete("/removeFromFavourite/:productId", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { productId } = req.params;

    const favouriteList = await List.findOne({ userId, name: "favourite" });

    if (!favouriteList) {
        return res.status(404).json({ message: "Favourite list not found" });
    }

    const item = await ListItem.findOne({
        listId: favouriteList._id,
        productId
    });

    if (!item) {
        return res.status(404).json({ message: "Product not found in favourite" });
    }

    await ListItem.deleteOne({ _id: item._id });

    res.status(200).json({
        message: "Product removed from favourite"
    });

}));

router.get("/favouriteList", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const favouriteList = await List.findOne({ userId, name: "favourite" });

    if (!favouriteList) {
        return res.status(404).json({ message: "Favourite list not found" });
    }

    const items = await ListItem.find({ listId: favouriteList._id })
        .populate("productId", "productName price images description");

    res.status(200).json({
        message: "Favourite products",
        count: items.length,
        data: items
    });

}));

router.post("/createList", verifyToken, asyncHandler(async (req, res) => {

    const { error } = validateList(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id;
    const { name } = req.body;

    const existingList = await List.findOne({ userId, name: name.trim().toLowerCase() });
    if (existingList) {
        return res.status(400).json({ message: "List name already exists" });
    }

    const list = await List.create({
        userId,
        name: name.trim().toLowerCase()
    });

    res.status(201).json({
        message: "List created successfully",
        list
    });

}));

router.post("/addToList", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { listId, productId } = req.body;

    if (!listId || !productId) {
        return res.status(400).json({ message: "listId and productId are required" });
    }

    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
        return res.status(404).json({ message: "List not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const exists = await ListItem.findOne({
        listId,
        productId
    });

    if (exists) {
        return res.status(400).json({ message: "Product already in this list" });
    }

    const item = await ListItem.create({
        listId,
        productId
    });

    res.status(201).json({
        message: "Product added to list",
        data: item
    });

}));

router.delete("/removeFromList", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { listId, productId } = req.body;

    if (!listId || !productId) {
        return res.status(400).json({ message: "listId and productId are required" });
    }

    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
        return res.status(404).json({ message: "List not found" });
    }

    const item = await ListItem.findOne({
        listId,
        productId
    });

    if (!item) {
        return res.status(404).json({ message: "Product not found in this list" });
    }

    await ListItem.deleteOne({ _id: item._id });

    res.status(200).json({
        message: "Product removed from list"
    });

}));

router.get("/list/:listId", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { listId } = req.params;

    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
        return res.status(404).json({ message: "List not found" });
    }

    const items = await ListItem.find({ listId })
        .populate("productId", "productName price images description stock category");

    res.status(200).json({
        message: "List products",
        count: items.length,
        data: items
    });

}));

router.get("/lists", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const lists = await List.find({ userId });

    res.status(200).json({
        message: "User lists",
        count: lists.length,
        data: lists
    });

}));

router.put("/updateListName/:listId", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { listId } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "New list name is required" });
    }

    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
        return res.status(404).json({ message: "List not found" });
    }

    const newName = name.trim().toLowerCase();

    const exists = await List.findOne({
        userId,
        name: newName,
        _id: { $ne: listId }
    });

    if (exists) {
        return res.status(400).json({ message: "List name already exists" });
    }

    list.name = newName;
    await list.save();

    res.status(200).json({
        message: "List name updated successfully",
        list
    });

}));

router.delete("/deleteList/:listId", verifyToken, asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { listId } = req.params;

    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
        return res.status(404).json({ message: "List not found" });
    }

    await ListItem.deleteMany({ listId });

    await List.deleteOne({ _id: listId });

    res.status(200).json({
        message: "List deleted successfully"
    });

}));

module.exports=router
