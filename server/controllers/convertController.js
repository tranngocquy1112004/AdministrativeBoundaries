import Unit from "../models/Unit.js";

/**
 * POST /convert
 * Nhận địa chỉ 3 cấp -> Chuẩn hóa và tra cứu trực tiếp từ MongoDB
 */
export async function convertAddress(req, res) {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Thiếu địa chỉ cần chuyển đổi" });
    }

    // 🧩 Chuẩn hóa & tách địa chỉ (VD: "Tỉnh Hà Nội, Huyện Hoàn Kiếm, Xã Hàng Trống")
    const parts = address.split(",").map(p => p.trim());
    if (parts.length < 3) {
      return res.status(400).json({
        error: "Địa chỉ phải có ít nhất 3 cấp (Tỉnh, Huyện, Xã/Phường/Thị trấn)",
      });
    }

    const [provinceName, districtName, communeName] = parts;

    // 🧠 Làm sạch tiền tố phổ biến trong tiếng Việt
    const clean = (text) =>
      text
        .replace(/Tỉnh|Thành phố|TP\.?|Huyện|Quận|Thị xã|Xã|Phường|Thị trấn/gi, "")
        .trim();

    // --- Tìm tỉnh ---
    const province = await Unit.findOne({
      name: { $regex: clean(provinceName), $options: "i" },
      level: "province",
    });

    // --- Tìm huyện thuộc tỉnh ---
    const district = province
      ? await Unit.findOne({
          name: { $regex: clean(districtName), $options: "i" },
          level: "district",
          parentCode: province.code,
        })
      : null;

    // --- Tìm xã thuộc huyện ---
    const commune = district
      ? await Unit.findOne({
          name: { $regex: clean(communeName), $options: "i" },
          level: "commune",
          parentCode: district.code,
        })
      : null;

    // --- Trả về kết quả ---
    res.json({
      original: address,
      matched: {
        province: province?.name || null,
        district: district?.name || null,
        commune: commune?.name || null,
      },
      codes: {
        province: province?.code || null,
        district: district?.code || null,
        commune: commune?.code || null,
      },
      found: !!(province || district || commune),
    });
  } catch (err) {
    console.error("❌ Convert Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
