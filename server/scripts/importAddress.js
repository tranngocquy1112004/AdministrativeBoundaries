import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Address from "../models/Address.js";

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

    await Address.deleteMany({});
    console.log("🧹 Đã xoá toàn bộ dữ liệu cũ trong collection 'addresses'");

    for (const province of jsonData) {
      // 👉 Thêm cấp tỉnh vào Address collection
      try {
        await Address.create({
          name: province.name,
          code: province.code,
          englishName: province.englishName || "",
          administrativeLevel: province.administrativeLevel || "Tỉnh",
          provinceCode: province.code,
          provinceName: province.name,
          decree: province.decree || "",
          level: "province",
          parentCode: null,
          boundary: province.boundary || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          history: province.history || []
        });
      } catch (err) {
        if (err.code === 11000) {
          console.warn(`⚠️ Duplicate province code: ${province.code} - ${province.name}`);
          continue;
        }
        throw err;
      }

      // 👉 Thêm cấp huyện/quận (nếu có) vào Address collection
      if (province.districts && Array.isArray(province.districts)) {
        for (const district of province.districts) {
          try {
            await Address.create({
              name: district.name,
              code: district.code,
              englishName: district.englishName || "",
              administrativeLevel: district.administrativeLevel || "Huyện",
              provinceCode: province.code,
              provinceName: province.name,
              decree: district.decree || "",
              level: "district",
              parentCode: province.code,
              boundary: district.boundary || null,
              createdAt: new Date(),
              updatedAt: new Date(),
              history: district.history || []
            });
          } catch (err) {
            if (err.code === 11000) {
              console.warn(`⚠️ Duplicate district code: ${district.code} - ${district.name}`);
              continue;
            }
            throw err;
          }

          // 👉 Thêm cấp xã/phường dưới huyện vào Address collection
          if (district.communes && Array.isArray(district.communes)) {
            for (const commune of district.communes) {
              try {
                await Address.create({
                  name: commune.name,
                  code: commune.code,
                  englishName: commune.englishName || "",
                  administrativeLevel: commune.administrativeLevel || "Xã",
                  provinceCode: province.code,
                  provinceName: province.name,
                  decree: commune.decree || "",
                  level: "commune",
                  parentCode: district.code,
                  boundary: commune.boundary || null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  history: commune.history || []
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

      // 👉 Thêm cấp xã/phường trực tiếp dưới tỉnh vào Address collection
      if (province.communes && Array.isArray(province.communes)) {
        for (const commune of province.communes) {
          try {
            await Address.create({
              name: commune.name,
              code: commune.code,
              englishName: commune.englishName || "",
              administrativeLevel: commune.administrativeLevel || "Xã",
              provinceCode: province.code,
              provinceName: province.name,
              decree: commune.decree || "",
              level: "commune",
              parentCode: province.code,
              boundary: commune.boundary || null,
              createdAt: new Date(),
              updatedAt: new Date(),
              history: commune.history || []
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

    console.log("✅ Import completed successfully!");
  } catch (err) {
    console.error("❌ Import failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

importAddress();
