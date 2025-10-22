import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Address from "../models/Address.js";
dotenv.config();

const __dirname = path.resolve();
const dataPath = path.join(__dirname, "data/full-address.json");

async function importData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/administrative_boundaries");
    console.log("✅ MongoDB connected");

    const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log(`📦 Found ${jsonData.length} provinces`);

    await Address.deleteMany({});
    await Address.insertMany(jsonData);

    console.log("✅ Import completed successfully!");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error importing:", err);
    mongoose.connection.close();
  }
}

importData();