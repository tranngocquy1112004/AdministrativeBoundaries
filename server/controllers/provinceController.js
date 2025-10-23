import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";

// ✅ Setup path tuyệt đối cho full-address.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../../data/full-address.json");

export async function getProvinces(req, res) {
  try {
    // ⚙️ Ưu tiên MongoDB
    const provinces = await Unit.find({ level: "province" }).lean();

    if (provinces.length > 0) {
      console.log("✅ Loaded provinces from MongoDB");
      return res.json(provinces);
    }

    // 🔁 Nếu Mongo rỗng hoặc lỗi → fallback JSON
    console.warn("⚠️ MongoDB empty → reading from JSON file");
    const rawData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(rawData);
    return res.json(
      data.map((p) => ({
        code: p.code,
        name: p.name,
        administrativeLevel: p.administrativeLevel,
      }))
    );
  } catch (err) {
    console.error("❌ MongoDB failed → using fallback JSON:", err);
    try {
      const rawData = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(rawData);
      return res.json(
        data.map((p) => ({
          code: p.code,
          name: p.name,
          administrativeLevel: p.administrativeLevel,
        }))
      );
    } catch (jsonErr) {
      console.error("❌ JSON fallback failed:", jsonErr);
      return res.status(500).json({ error: "Failed to load provinces" });
    }
  }
}
