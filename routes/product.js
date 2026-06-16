const express =  require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { User } = require("../models/User");
const { Category , validateCategory } = require("../models/Category");
const { Product , validateProduct , validateUpdateProduct } = require("../models/Product");
const { verifyToken } = require("../middlewares/verifyToken");
const  upload  = require("../middlewares/upload");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();


router.post("/admin/addCategory", verifyToken, asyncHandler(async (req, res) => {

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

    const existingCategory = await Category.findOne({ categoryName: req.body.categoryName.trim().toLowerCase() });
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

router.post("/admin/addProduct", verifyToken, upload.array("images", 6),asyncHandler(async (req, res) => {

    if (req.body.colors) {
    try {
        req.body.colors = JSON.parse(req.body.colors);
    } catch (err) {
        return res.status(400).json({ message: "Invalid colors format" });
      }
    }

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

    const existingProduct = await Product.findOne({productName: req.body.productName.trim().toLowerCase()});

    if (existingProduct) {
    return res.status(400).json({ message: "Product already exists" });
    }

    const product = new Product({
        category: category._id,
        productName: req.body.productName.trim().toLowerCase(),
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
        images: images,
        colors: req.body.colors
    });

    await product.save();

    res.status(201).json({
        message: "Product added successfully",
        product
    });

}));

router.get("/products", verifyToken, asyncHandler(async (req, res) => {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();

    const products = await Product.find()
        .populate("category", "categoryName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        message: "Products:",
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        count: products.length,
        data: products
    });
}));

router.get("/filter", asyncHandler(async (req, res) => {

    const { name, minPrice, maxPrice, category } = req.query;

    let filter = {};

    if (name) {
        filter.productName = {
            $regex: name,
            $options: "i"
        };
    }
    if (minPrice && maxPrice) {
        filter.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    } 
    else if (minPrice) {
        filter.price = { $gte: Number(minPrice) };
    } 
    else if (maxPrice) {
        filter.price = { $lte: Number(maxPrice) };
    }

    if (category) {
        const cat = await Category.findOne({
            categoryName: { $regex: category, $options: "i" }
        });

        if (!cat) {
            return res.status(404).json({ message: "Category not found" });
        }

        filter.category = cat._id;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(filter);

    const productsList = await Product.find(filter)
        .populate("category", ["_id", "categoryName"])
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        message: "Filtered products",
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        count: productsList.length,
        data: productsList
    });

}));

router.put("/admin/updateProduct/:id", verifyToken, upload.array("images", 6),asyncHandler(async (req, res) => {

    if (req.body.colors) {
    try {
        req.body.colors = JSON.parse(req.body.colors);
    } catch (err) {
        return res.status(400).json({ message: "Invalid colors format" });
    }
    }

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

    if (req.body.productName) product.productName = req.body.productName.trim().toLowerCase();
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = req.body.price;
    if (req.body.stock) product.stock = req.body.stock;
    if (req.files && req.files.length > 0) {

        const newImages = req.files.map(file => file.path);
        product.images = newImages; 

    }  
    if (req.body.colors) product.colors = req.body.colors;

    await product.save();

    res.status(200).json({
        message: "Product updated successfully",
        product
    });

}));

router.delete("/admin/deleteProduct/:id", verifyToken,asyncHandler(async (req,res) => {

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admin can Delete products" });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if(!product){
        return res.status(404).json({message: "Product Not Found"})
    }

    res.status(200).json({message: "Product deleted successfully"});

}));


module.exports=router