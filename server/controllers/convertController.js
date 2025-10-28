import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../../data/full-address.json");

/** 🧩 Chuẩn hóa chuỗi để so khớp dễ hơn */
function normalize(str) {
  return str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(tinh|thanh pho|quan|huyen|thi xa|xa|phuong|thi tran)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** 🔄 Chuyển đổi địa chỉ thành mã hành chính */
export async function convertAddress(req, res) {
  try {
    const { address } = req.body;

    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Thiếu hoặc sai định dạng 'address'" });
    }

    // 🧠 Phân tích chuỗi (VD: "Xã Bến Nghé, Quận 1, TP Hồ Chí Minh")
    const parts = address.split(",").map((p) => p.trim()).reverse(); // đảo lại: [tỉnh, huyện, xã]
    const [provinceName, districtName, communeName] = parts;

    console.log("📬 Nhận địa chỉ:", address);

    // ==============================
    // 1️⃣ TRA TỪ MONGODB TRƯỚC
    // ==============================
    let province = await Unit.findOne({
      level: "province",
      name: { $regex: normalize(provinceName), $options: "i" },
    });

    let district = null;
    if (province && districtName) {
      district = await Unit.findOne({
        level: "district",
        parentCode: province.code,
        name: { $regex: normalize(districtName), $options: "i" },
      });
    }

    let commune = null;
    if (district && communeName) {
      commune = await Unit.findOne({
        level: "commune",
        parentCode: district.code,
        name: { $regex: normalize(communeName), $options: "i" },
      });
    }

    // ==============================
    // 2️⃣ FALLBACK QUA FILE JSON
    // ==============================
    if (!province || !district || !commune) {
      console.warn("⚠️ MongoDB thiếu dữ liệu → fallback JSON");
      const rawData = fs.readFileSync(filePath, "utf8");
      const provinces = JSON.parse(rawData);

      province =
        province ||
        provinces.find((p) => normalize(p.name).includes(normalize(provinceName)));

      if (province && Array.isArray(province.districts)) {
        district =
          district ||
          province.districts.find((d) =>
            normalize(d.name).includes(normalize(districtName))
          );

        if (district && Array.isArray(district.communes)) {
          commune =
            commune ||
            district.communes.find((c) =>
              normalize(c.name).includes(normalize(communeName))
            );
        }
      }
    }

    // ==============================
    // 3️⃣ KẾT QUẢ TRẢ VỀ
    // ==============================
    return res.json({
      input: address,
      result: {
        province: province?.name || null,
        district: district?.name || null,
        commune: commune?.name || null,
      },
      codes: {
        province: province?.code || null,
        district: district?.code || null,
        commune: commune?.code || null,
      },
      found: !!(province && district && commune),
      source: province ? "MongoDB" : "JSON Fallback",
    });
  } catch (err) {
    console.error("❌ Lỗi khi convert địa chỉ:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
