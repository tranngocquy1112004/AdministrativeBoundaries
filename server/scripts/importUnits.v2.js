import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Unit from "../v1/models/Unit.js";

dotenv.config();

const dataPath = path.resolve("data/full-address-v2.json");

async function importUnitsV2() {
  try {
    console.log("🟡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/administrative_boundaries");
    console.log("✅ Connected to MongoDB");

    if (!fs.existsSync(dataPath)) throw new Error(`❌ Không tìm thấy file: ${dataPath}`);
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log(`📦 V2: Found ${data.length} provinces`);

    await Unit.collection.createIndex({ uniqueKey: 1 }, { unique: true });
    await Unit.collection.createIndex({ schemaVersion: 1, level: 1, parentCode: 1 });

    // Optional: clear only v2 data
    await Unit.deleteMany({ schemaVersion: 'v2' });
    console.log("🧹 Cleared old v2 data");

    const createUnit = async (doc) => {
      try {
        await Unit.create(doc);
      } catch (err) {
        if (err.code === 11000) console.warn(`⚠️ Duplicate uniqueKey: ${doc.uniqueKey}`);
        else console.error("❌ Insert error:", err.message);
      }
    };

    for (const province of data) {
      const provinceCode = String(province.code);
      const provinceDoc = {
        schemaVersion: 'v2',
        name: province.name,
        code: provinceCode,
        level: 'province',
        parentCode: null,
        uniqueKey: `v2-province-${provinceCode}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await createUnit(provinceDoc);

      const wards = Array.isArray(province.wards) ? province.wards : [];
      for (const ward of wards) {
        const wardCode = String(ward.code);
        const wardDoc = {
          schemaVersion: 'v2',
          name: ward.name,
          code: wardCode,
          level: 'commune', // map ward → commune để đồng nhất level
          parentCode: provinceCode,
          uniqueKey: `v2-commune-${wardCode}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await createUnit(wardDoc);
      }
    }

    console.log("✅ V2 import completed");
  } catch (err) {
    console.error("❌ importUnitsV2 failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

importUnitsV2();


