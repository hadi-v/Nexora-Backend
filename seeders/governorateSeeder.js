const { Governorate } = require("../models/Governorate");
const connectToDB = require("../config/db");
const dotenv = require("dotenv");
dotenv.config();

connectToDB(); 

const governorates = [
  { name: "Damascus", shippingCost: 50000 },
  { name: "Rif Dimashq", shippingCost: 60000 },
  { name: "Homs", shippingCost: 65000 },
  { name: "Hama", shippingCost: 65000 },
  { name: "Aleppo", shippingCost: 70000 },
  { name: "Latakia", shippingCost: 80000 },
  { name: "Tartus", shippingCost: 75000 },
  { name: "Daraa", shippingCost: 60000 },
  { name: "Al-Suwayda", shippingCost: 60000 },
  { name: "Quneitra", shippingCost: 55000 },
  { name: "Idlib", shippingCost: 75000 },
  { name: "Deir El-Zor", shippingCost: 90000 },
  { name: "Al-Raqqah", shippingCost: 85000 },
  { name: "Al-Hasakah", shippingCost: 95000 }
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
