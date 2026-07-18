const bcrypt = require("bcryptjs");

const admin = [
    {
        email: "admin@gmail.com",
        userName: "Admin",
        birthDate: new Date("1999-01-01"),
        phone: "0999999999",
        password: bcrypt.hashSync("123", 10),   
        profileImage: null, 
        verified: true,
        phoneVerified: true,
        isAdmin: true
         
    }
];

module.exports = {
    admin
};


