import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Unit from "../models/Unit.js";

dotenv.config();

const __dirname = path.resolve();
const dataPath = path.join(__dirname, "data/full-address.json");

async function importUnits() {
  try {
    console.log("🟡 Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb://127.0.0.1:27017/administrative_boundaries"
    );
    console.log("✅ Connected to MongoDB");

    if (!fs.existsSync(dataPath)) {
      throw new Error(`❌ Không tìm thấy file dữ liệu tại: ${dataPath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log(`📦 Found ${jsonData.length} provinces`);

    await Unit.deleteMany({});
    console.log("🧹 Cleared old data");

    for (const province of jsonData) {
      await Unit.create({
        name: province.name,
        code: province.code,
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Một số file JSON có thể chỉ có communes mà không có districts
      if (Array.isArray(province.communes)) {
        for (const commune of province.communes) {
          await Unit.create({
            name: commune.name,
            code: commune.code,
            level: "commune",
            parentCode: province.code,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    console.log("✅ importUnits completed successfully!");
  } catch (err) {
    console.error("❌ importUnits failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

importUnits();
