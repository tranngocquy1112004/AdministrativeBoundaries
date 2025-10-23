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
      // 👉 Thêm cấp tỉnh
      try {
        await Unit.create({
          name: province.name,
          code: province.code,
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (err) {
        if (err.code === 11000) {
          console.warn(`⚠️ Duplicate province code: ${province.code} - ${province.name}`);
          continue;
        }
        throw err;
      }

      // 👉 Thêm cấp huyện/quận (nếu có)
      if (province.districts && Array.isArray(province.districts)) {
        for (const district of province.districts) {
          try {
            await Unit.create({
              name: district.name,
              code: district.code,
              level: "district",
              parentCode: province.code,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } catch (err) {
            if (err.code === 11000) {
              console.warn(`⚠️ Duplicate district code: ${district.code} - ${district.name}`);
              continue;
            }
            throw err;
          }

          // 👉 Thêm cấp xã/phường dưới huyện
          if (district.communes && Array.isArray(district.communes)) {
            for (const commune of district.communes) {
              try {
                await Unit.create({
                  name: commune.name,
                  code: commune.code,
                  level: "commune",
                  parentCode: district.code,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              } catch (err) {
                if (err.code === 11000) {
                  console.warn(`⚠️ Duplicate commune code: ${commune.code} - ${commune.name}`);
                  continue;
                }
                throw err;
              }
            }
          }
        }
      }

      // 👉 Thêm cấp xã/phường trực tiếp dưới tỉnh (nếu không có huyện)
      if (province.communes && Array.isArray(province.communes)) {
        for (const commune of province.communes) {
          try {
            await Unit.create({
              name: commune.name,
              code: commune.code,
              level: "commune",
              parentCode: province.code,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } catch (err) {
            if (err.code === 11000) {
              console.warn(`⚠️ Duplicate commune code: ${commune.code} - ${commune.name}`);
              continue;
            }
            throw err;
          }
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
