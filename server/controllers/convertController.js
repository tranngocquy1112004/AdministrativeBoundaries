import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../../data/full-address.json");

// 🔹 Hàm chuẩn hóa chuỗi
function normalize(str) {
  return str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Tỉnh|Thành phố|Phường|Xã|Thị trấn/gi, "")
    .trim()
    .toLowerCase();
}

export async function convertAddress(req, res) {
  try {
    const { address } = req.body;
    if (!address)
      return res.status(400).json({ error: "Thiếu địa chỉ cần chuyển đổi" });

    const parts = address.split(",").map((p) => p.trim());
    if (parts.length < 2)
      return res
        .status(400)
        .json({ error: "Địa chỉ phải có ít nhất 2 cấp (Tỉnh, Xã/Phường)" });

    const [provinceName, communeName] = parts;
    const provinceNorm = normalize(provinceName);
    const communeNorm = normalize(communeName);

    console.log("🧩 Nhận địa chỉ:", address);

    // ---------------------------
    // 1️⃣ ƯU TIÊN LẤY TỪ MONGO
    // ---------------------------
    let province = await Unit.findOne({
      name: { $regex: provinceName.replace(/Tỉnh|Thành phố/gi, "").trim(), $options: "i" },
      level: "province",
    });

    let commune = null;
    if (province) {
      commune = await Unit.findOne({
        name: { $regex: communeName.replace(/Phường|Xã|Thị trấn/gi, "").trim(), $options: "i" },
        level: "commune",
        parentCode: province.code,
      });
    }

    // ---------------------------
    // 2️⃣ FALLBACK QUA FILE JSON
    // ---------------------------
    if (!province || !commune) {
      console.warn("⚠️ Fallback JSON → Searching locally");
      const rawData = fs.readFileSync(filePath, "utf8");
      const provinces = JSON.parse(rawData);

      province =
        province ||
        provinces.find((p) =>
          new RegExp(provinceName.replace(/Tỉnh|Thành phố/gi, "").trim(), "i").test(p.name)
        );

      if (province && Array.isArray(province.communes)) {
        commune =
          commune ||
          province.communes.find((c) =>
            new RegExp(communeName.replace(/Phường|Xã|Thị trấn/gi, "").trim(), "i").test(c.name)
          );
      }
    }

    // ---------------------------
    // 3️⃣ TRẢ KẾT QUẢ
    // ---------------------------
    return res.json({
      original: address,
      matched: {
        province: province?.name || null,
        commune: commune?.name || null,
      },
      codes: {
        province: province?.code || null,
        commune: commune?.code || null,
      },
      found: !!(province && commune),
    });
  } catch (err) {
    console.error("❌ Convert Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
