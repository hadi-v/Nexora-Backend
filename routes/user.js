const express =  require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { User , validateUpdateUser } = require("../models/User");
const { Store , validateUpdateStore } = require("../models/Store");
const { Category , validateCategory } = require("../models/Category");
const { Product , validateProduct , validateUpdateProduct } = require("../models/Product");
const { verifyToken } = require("../middlewares/verifyToken");
const  upload  = require("../middlewares/upload");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

router.put("/updateUser", verifyToken, asyncHandler(async (req , res) => {

    const { error } = validateUpdateUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id; 

    let user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (req.body.email) user.email = req.body.email;
    if (req.body.userName) user.userName = req.body.userName;
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
    }

    await user.save();

    const { password, ...other } = user._doc;

    res.json({
        message: "User updated successfully",
        user: other
    });

}));

router.put("/updateStore", verifyToken, upload.single("image"),asyncHandler(async (req, res) => {

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
            store.image = req.file.path;
       }
       

    await store.save();

    res.json({
        message: "Store updated successfully",
        store
    });

}));

router.post("/addCategory", verifyToken, asyncHandler(async (req, res) => {

    const { error } = validateCategory(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
        return res.status(403).json({ message: "Only admin can add categories" });
    }

    const existingCategory = await Category.findOne({ categoryName: req.body.categoryName });
    if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({
    categoryName: req.body.categoryName.trim().toLowerCase()
    });

    await category.save();

    res.status(201).json({
        message: "Category added successfully",
        category
    });

}));

router.post("/addProduct", verifyToken, upload.array("images", 6),asyncHandler(async (req, res) => {

    const { error } = validateProduct(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
    return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
    return res.status(403).json({ message: "Only admin can add products" });
    }


    const category = await Category.findOne({categoryName: req.body.categoryName.trim().toLowerCase()});
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }

    const images = req.files.map(file => file.path);

     const existingProduct = await Product.findOne({

    productName: req.body.productName.trim().toLowerCase()
    
    });

    if (existingProduct) {
    return res.status(400).json({ message: "Product already exists" });
    }

    const product = new Product({
        category: category._id,
        productName: req.body.productName.trim().toLowerCase(),
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
        images: images
    });

    await product.save();

    res.status(201).json({
        message: "Product added successfully",
        product
    });

}));

router.get("/products", verifyToken,asyncHandler(async (req, res) => {

    const products = await Product.find().populate("category", "categoryName").sort({ createdAt: -1 }); 

    res.status(200).json({
        message: "Products:",
        count: products.length,
        data: products
    });
}));

router.put("/updateProduct/:id", verifyToken, upload.array("images", 6),asyncHandler(async (req, res) => {

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admin can update products" });
    }

    const { error } = validateUpdateProduct(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    if (req.body.categoryName) {
        const category = await Category.findOne({
            categoryName: req.body.categoryName.trim().toLowerCase()
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        product.category = category._id;
    }

    if (req.body.productName) product.productName = req.body.productName;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = req.body.price;
    if (req.body.stock) product.stock = req.body.stock;
    if (req.files && req.files.length > 0) {

        const newImages = req.files.map(file => file.path);
        product.images = newImages; 

    }   

    await product.save();

    res.status(200).json({
        message: "Product updated successfully",
        product
    });

}));

router.delete("/deleteProduct/:id", verifyToken,asyncHandler(async (req,res) => {

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admin can Delete products" });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if(!product){
        return res.status(404).json({message: "Product Not Found"})
    }

    res.status(200).json({message: "Product deleted successfully"});

}));

router.get("/users", verifyToken,asyncHandler(async (req,res) => {
    
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admin can view users" });
    }
    
    const users = await User.find().select("-password");

    res.status(200).json({
        message: "Users:",
        data: users
    });
}));


module.exports=router
