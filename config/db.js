const mongoose = require("mongoose");

async function connectToDB(){

    try {
        await mongoose.connect(process.env.MONGO_URL) ; 
        console.log("Connected to mongodb.......");
        
    } catch (error) {
      console.log("Connection Failed",error)  
    }

}

module.exports=connectToDB;
