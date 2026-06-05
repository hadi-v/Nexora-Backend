const bcrypt = require("bcryptjs");

const admin = [
    {
        email: "admin@gmail.com",
        userName: "Admin",
        birthDate: new Date("1999-01-01"),
        password: bcrypt.hashSync("123", 10),    
        verified: true,
        isAdmin: true
         
    }
];

module.exports = {
    admin
};


