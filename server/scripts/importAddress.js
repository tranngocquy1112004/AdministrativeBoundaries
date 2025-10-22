import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Unit from "../models/Unit.js"; // 👉 dùng model Unit thay vì Address
dotenv.config();

const __dirname = path.resolve();
const dataPath = path.join(__dirname, "data/full-address.json");

/**
 * 🔁 Đệ quy tách dữ liệu đa cấp (province → district → commune)
 */
function flattenUnits(data, parentCode = null, level = "province") {
  const flat = [];

  data.forEach(item => {
    const { name, code, boundary, districts, communes } = item;

    // Ghi bản ghi hiện tại
    flat.push({
      name: name?.replace(/^Tỉnh |^Thành phố /i, "").trim(),
      code,
      level,
      parentCode,
      boundary: boundary || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: []
    });

    // Nếu có danh sách huyện
    if (districts?.length) {
      flat.push(...flattenUnits(districts, code, "district"));
    }

    // Nếu có danh sách xã
    if (communes?.length) {
      flat.push(...flattenUnits(communes, code, "commune"));
    }
  });

  return flat;
}

/**
 * 🚀 Import dữ liệu vào MongoDB
 */
async function importData() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/administrative_boundaries"
    );
    console.log("✅ MongoDB connected");

    // Đọc dữ liệu
    const text = fs.readFileSync(dataPath, "utf8");
    const raw = JSON.parse(text);

    // Làm phẳng dữ liệu
    const flattened = flattenUnits(raw);
    console.log(`📦 Found ${flattened.length} administrative units`);

    // Xóa dữ liệu cũ
    await Unit.deleteMany({});
    console.log("🧹 Old data cleared.");

    // Ghi dữ liệu mới
    await Unit.insertMany(flattened);
    console.log("✅ Import completed successfully!");
  } catch (err) {
    console.error("❌ Error importing:", err);
  } finally {
    await mongoose.connection.close();
  }
}

importData();
