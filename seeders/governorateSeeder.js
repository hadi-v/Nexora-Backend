const { Governorate } = require("../models/Governorate");
const connectToDB = require("../config/db");
const dotenv = require("dotenv");
dotenv.config();

connectToDB(); 

const governorates = [
  { name: "Damascus" },
  { name: "Rif Dimashq" },
  { name: "Homs" },
  { name: "Hama" },
  { name: "Aleppo" },
  { name: "Latakia" },
  { name: "Tartus" },
  { name: "Daraa" },
  { name: "Al-Suwayda" },
  { name: "Quneitra" },
  { name: "Idlib" },
  { name: "Deir El-Zor" },
  { name: "Al-Raqqah" },
  { name: "Al-Hasakah" }
];

async function seedGovernorates() {
  try {
    console.log("Seeding governorates...");

    await Governorate.deleteMany();
    await Governorate.insertMany(governorates);

    console.log("Governorates seeded successfully");
    process.exit(0);

  } catch (err) {
    console.log("Seeder Error:", err);
    process.exit(1);
  }
}

seedGovernorates();
