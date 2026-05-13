const { Store } = require("../models/Store");
const { User } = require("../models/User");
const { admin } = require("./data");
const connectToDB = require("../config/db");
const dotenv = require("dotenv");
dotenv.config();

connectToDB();

const importAdminAndStore = async () => {
    try {
        const createdAdmins = await User.insertMany(admin);
        const adminUser = createdAdmins[0];

        console.log("Admin Imported");

        await Store.create({
            owner: adminUser._id,
            storeName: "Nexora",
            description: "Your Shopping World",
            image: "default-avatar.png"
        });

        console.log("Store Imported");

        process.exit();

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

if (process.argv[2] === "-import-admin-store") {
    importAdminAndStore();
}
