import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../../data/full-address.json");

export async function getCommunes(req, res) {
  try {
    const { provinceID } = req.params;

    // ⚙️ Ưu tiên MongoDB
    let communes = [];
    if (provinceID) {
      const districts = await Unit.find({ level: "district", parentCode: provinceID }).lean();
      const districtCodes = districts.map((d) => d.code);
      communes = await Unit.find({ level: "commune", parentCode: { $in: districtCodes } }).lean();
    } else {
      communes = await Unit.find({ level: "commune" }).lean();
    }

    if (communes.length > 0) {
      console.log("✅ Loaded communes from MongoDB");
      return res.json(communes);
    }

    // 🔁 Nếu Mongo rỗng → fallback JSON
    console.warn("⚠️ MongoDB empty → reading from JSON file");
    const rawData = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(rawData);

    if (provinceID) {
      const province = provinces.find((p) => p.code === provinceID);
      if (!province) return res.status(404).json({ error: "Province not found" });

      let allCommunes = [];
      province.districts?.forEach((d) => {
        allCommunes.push(...(d.communes || []));
      });
      return res.json(allCommunes);
    } else {
      let allCommunes = [];
      provinces.forEach((p) => {
        p.districts?.forEach((d) => {
          allCommunes.push(...(d.communes || []));
        });
      });
      return res.json(allCommunes);
    }
  } catch (err) {
    console.error("❌ MongoDB failed → using fallback JSON:", err);
    try {
      const rawData = fs.readFileSync(filePath, "utf8");
      const provinces = JSON.parse(rawData);

      let allCommunes = [];
      provinces.forEach((p) => {
        p.districts?.forEach((d) => {
          allCommunes.push(...(d.communes || []));
        });
      });
      return res.json(allCommunes);
    } catch (jsonErr) {
      console.error("❌ JSON fallback failed:", jsonErr);
      return res.status(500).json({ error: "Failed to load communes" });
    }
  }
}
