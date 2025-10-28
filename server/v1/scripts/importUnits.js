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

    // Kiểm tra file JSON
    if (!fs.existsSync(dataPath)) {
      throw new Error(`❌ Không tìm thấy file dữ liệu tại: ${dataPath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log(`📦 Found ${jsonData.length} provinces in JSON`);

    // 🧹 Xóa toàn bộ dữ liệu cũ
    await Unit.deleteMany({});
    console.log("🧹 Cleared old data");

    // 🔑 Tạo unique index
    await Unit.collection.createIndex({ uniqueKey: 1 }, { unique: true });
    await Unit.collection.createIndex({ schemaVersion: 1, level: 1, parentCode: 1 });
    console.log("🔑 Created unique index for uniqueKey");

    // ===================================
    // ⚙️ Hàm tiện ích tạo dữ liệu
    // ===================================
    const createUnit = async (item, level, parentCode = null, parentName = null) => {
      const code = String(item.code || "").trim();
      if (!code) {
        console.warn(`⚠️ Bỏ qua ${level} không có code: ${item.name}`);
        return;
      }

      const uniqueKey = `v1-${level}-${code}`;
      const doc = {
        schemaVersion: 'v1',
        name: item.name,
        code,
        englishName: item.englishName || "",
        administrativeLevel: item.administrativeLevel || "",
        provinceCode: item.provinceCode || null,
        provinceName: item.provinceName || null,
        decree: item.decree || "",
        level,
        parentCode: parentCode ? String(parentCode) : null,
        uniqueKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await Unit.create(doc);
      } catch (err) {
        if (err.code === 11000) {
          console.warn(`⚠️ Duplicate ${level} code: ${item.code} (${item.name})`);
        } else {
          console.error(`❌ Error creating ${level} ${item.name}:`, err.message);
        }
      }
    };

    // ===================================
    // 🔁 Bắt đầu import dữ liệu
    // ===================================
    for (const province of jsonData) {
      await createUnit(province, "province");

      // 🏙️ Huyện/Quận
      const districtsList =
        province.districts || province.children || province.wards || [];

      if (Array.isArray(districtsList)) {
        for (const district of districtsList) {
          await createUnit(district, "district", province.code, province.name);

          // 🏘️ Xã/Phường/Thị trấn thuộc huyện
          const communesList =
            district.communes || district.wards || district.children || [];

          if (Array.isArray(communesList)) {
            for (const commune of communesList) {
              await createUnit(commune, "commune", district.code, district.name);
            }
          }
        }
      }

      // 🏡 Xã trực thuộc tỉnh (nếu không có huyện)
      const provinceCommunes =
        province.communes || province.wards || province.children || [];

      if (Array.isArray(provinceCommunes)) {
        for (const commune of provinceCommunes) {
          await createUnit(commune, "commune", province.code, province.name);
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
