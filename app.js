const express = require("express");
const authPath = require("./routes/auth");
const userPath = require("./routes/user");
const cartPath = require("./routes/cart");
const { notFound , errorHandler} = require("./middlewares/errors");
const dotenv = require("dotenv");
const connectToDB = require("./config/db");
const mongoose = require("mongoose");
dotenv.config();

connectToDB();

const app = express();
app.use(express.json());
app.use("/images", express.static("images"));


app.use("/api/auth",authPath);
app.use("/api/user",userPath);
app.use("/api/cart",cartPath);


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT,()=>console.log("Server is running in " + process.env.NODE_ENV + " mode on port " + PORT));
