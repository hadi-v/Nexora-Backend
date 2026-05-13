const bcrypt = require("bcryptjs");

const admin = [
    {
        email: "admin@gmail.com",
        userName: "Admin",
        password: bcrypt.hashSync("123", 10),    
        verified: true,
        isAdmin: true
         
    }
];

module.exports = {
    admin
};


