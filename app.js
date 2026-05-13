const express = require("express");
const authPath = require("./routes/auth");
const { notFound , errorHandler} = require("./middlewares/errors");
const dotenv = require("dotenv");
const connectToDB = require("./config/db");
const mongoose = require("mongoose");
dotenv.config();

connectToDB();

const app = express();
app.use(express.json());

app.use("/api/auth",authPath);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT,()=>console.log("Server is running in " + process.env.NODE_ENV + " mode on port " + PORT));
