import Unit from "../models/Unit.js";

/**
 * POST /convert
 * Nhận địa chỉ 3 cấp -> Trả về dạng chuẩn hóa từ MongoDB
 */
export async function convertAddress(req, res) {
  try {
    const { address } = req.body;
    if (!address)
      return res.status(400).json({ error: "Thiếu địa chỉ cần chuyển đổi" });

    // 🧩 Tách và chuẩn hóa các phần địa chỉ
    const parts = address.split(",").map(p => p.trim());
    if (parts.length < 3) {
      return res
        .status(400)
        .json({ error: "Địa chỉ phải có ít nhất 3 cấp (Tỉnh, Huyện, Xã)" });
    }

    const [provinceName, districtName, communeName] = parts;

    // 🔍 1. Tìm TỈNH / THÀNH PHỐ
    const province = await Unit.findOne({
      name: { $regex: provinceName.replace(/Tỉnh|Thành phố/gi, "").trim(), $options: "i" },
      level: "province"
    });

    // 🔍 2. Tìm HUYỆN / QUẬN thuộc tỉnh đó
    const district = province
      ? await Unit.findOne({
          name: { $regex: districtName.replace(/Huyện|Quận|Thị xã|Thành phố/gi, "").trim(), $options: "i" },
          level: "district",
          parentCode: province.code
        })
      : null;

    // 🔍 3. Tìm XÃ / PHƯỜNG thuộc huyện đó
    const commune = district
      ? await Unit.findOne({
          name: { $regex: communeName.replace(/Xã|Phường|Thị trấn/gi, "").trim(), $options: "i" },
          level: "commune",
          parentCode: district.code
        })
      : null;

    // 🧾 Trả kết quả
    res.json({
      original: address,
      matched: {
        province: province?.name || null,
        district: district?.name || null,
        commune: commune?.name || null
      },
      codes: {
        province: province?.code || null,
        district: district?.code || null,
        commune: commune?.code || null
      },
      found: !!(province || district || commune)
    });
  } catch (err) {
    console.error("❌ Convert Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
