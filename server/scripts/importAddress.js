import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Unit from "../models/Unit.js";

dotenv.config();

const __dirname = path.resolve();
const dataPath = path.join(__dirname, "data/full-address.json");

async function importAddress() {
  try {
    console.log("🟡 Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/administrative_boundaries"
    );
    console.log("✅ Connected to MongoDB");

    if (!fs.existsSync(dataPath)) {
      throw new Error(`Không tìm thấy file dữ liệu tại: ${dataPath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log(`📦 Đọc ${jsonData.length} tỉnh/thành từ full-address.json`);

    await Unit.deleteMany({});
    console.log("🧹 Đã xoá toàn bộ dữ liệu cũ trong collection 'units'");

    for (const province of jsonData) {
      // 👉 Thêm cấp tỉnh
      await Unit.create({
        name: province.name,
        code: province.code,
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 👉 Thêm cấp xã/phường trực tiếp dưới tỉnh
      if (province.communes && Array.isArray(province.communes)) {
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

    console.log("✅ Import completed successfully!");
  } catch (err) {
    console.error("❌ Import failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

importAddress();
