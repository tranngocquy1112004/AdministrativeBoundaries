import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";
import UnitHistory from "../models/UnitHistory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../../data/full-address.json");

// =============================
// 🔹 LẤY DANH SÁCH TỈNH (3 CẤP)
// =============================
export async function getProvinces(req, res) {
  try {
    const provinces = await Unit.find({
      level: "province",
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }).lean();

    if (provinces.length > 0) {
      console.log(`✅ Loaded ${provinces.length} provinces from MongoDB`);

      const districts = await Unit.find({ level: "district" }).lean();
      const communes = await Unit.find({ level: "commune" }).lean();

      const fullData = provinces.map((p) => ({
        ...p,
        districts: districts
          .filter((d) => d.parentCode === p.code)
          .map((d) => ({
            ...d,
            communes: communes.filter((c) => c.parentCode === d.code),
          })),
      }));

      return res.json(fullData);
    }

    // 🔸 Fallback sang JSON nếu Mongo trống
    console.warn("⚠️ MongoDB empty → reading from JSON file");
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return res.json(data);
  } catch (err) {
    console.error("❌ getProvinces failed:", err);
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw);
      return res.json(data);
    } catch (jsonErr) {
      console.error("❌ JSON fallback failed:", jsonErr);
      return res.status(500).json({ error: "Failed to load provinces" });
    }
  }
}

// =============================
// 🔹 LẤY CHI TIẾT 1 TỈNH (3 CẤP)
// =============================
export async function getProvinceByCode(req, res) {
  try {
    const { provinceCode } = req.params;

    // Ưu tiên MongoDB
    const province = await Unit.findOne({ code: provinceCode, level: "province" }).lean();
    if (province) {
      const districts = await Unit.find({ level: "district", parentCode: provinceCode }).lean();
      const communes = await Unit.find({ level: "commune" }).lean();

      const fullProvince = {
        ...province,
        districts: districts.map((d) => ({
          ...d,
          communes: communes.filter((c) => c.parentCode === d.code),
        })),
      };

      return res.json(fullProvince);
    }

    // 🔸 Fallback JSON
    console.warn("⚠️ MongoDB not found → reading from JSON");
    const raw = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(raw);
    const provinceData = provinces.find((p) => p.code === provinceCode || p.code === Number(provinceCode));

    if (!provinceData) return res.status(404).json({ error: "Province not found" });
    return res.json(provinceData);
  } catch (err) {
    console.error("❌ getProvinceByCode failed:", err);
    return res.status(500).json({ error: "Failed to load province", details: err.message });
  }
}
// =============================
// 🔹 LẤY CHI TIẾT TỈNH THEO _ID (MongoDB)
// =============================
export async function getProvinceById(req, res) {
  try {
    const { id } = req.params;

    const province = await Unit.findOne({
      _id: id,
      level: "province",
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }).lean();

    if (!province) return res.status(404).json({ error: "Province not found by _id" });

    // Lấy danh sách huyện, xã/phường của tỉnh đó
    const districts = await Unit.find({
      level: "district",
      parentCode: province.code,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }).lean();

    const communes = await Unit.find({
      level: "commune",
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }).lean();

    const fullProvince = {
      ...province,
      districts: districts.map((d) => ({
        ...d,
        communes: communes.filter((c) => c.parentCode === d.code),
      })),
    };

    console.log(`✅ Loaded province by _id: ${id}`);
    return res.json(fullProvince);
  } catch (err) {
    console.error("❌ getProvinceById failed:", err);
    return res.status(500).json({ error: "Failed to get province by id", details: err.message });
  }
}


// =============================
// 🔹 TẠO TỈNH MỚI
// =============================
export async function createProvince(req, res) {
  try {
    const { code, name, englishName, administrativeLevel, decree } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: "Missing required fields: code, name" });
    }

    const existing = await Unit.findOne({ code, level: "province" });
    if (existing) {
      return res.status(409).json({ error: "Province already exists" });
    }

    const newProvince = await Unit.create({
      code,
      name,
      englishName: englishName || "",
      administrativeLevel: administrativeLevel || "Tỉnh",
      decree: decree || "",
      level: "province",
      parentCode: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [],
    });

    // ✅ Cập nhật JSON file
    const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "[]";
    const provinces = JSON.parse(raw);
    provinces.push({ code, name, englishName, administrativeLevel, decree, districts: [] });
    fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));

    console.log(`✅ Created new province: ${name} (${code})`);
    return res.status(201).json({ success: true, message: "Province created successfully", data: newProvince });
  } catch (err) {
    console.error("❌ createProvince failed:", err);
    return res.status(500).json({ error: "Failed to create province", details: err.message });
  }
}

// =============================
// 🔹 CẬP NHẬT TỈNH
// =============================
export async function updateProvince(req, res) {
  try {
    const { provinceCode } = req.params;
    const { name, englishName, administrativeLevel, decree } = req.body;

    const province = await Unit.findOne({ code: provinceCode, level: "province" });
    if (!province) return res.status(404).json({ error: "Province not found" });

    const updateData = {
      updatedAt: new Date(),
      ...(name && { name }),
      ...(englishName && { englishName }),
      ...(administrativeLevel && { administrativeLevel }),
      ...(decree && { decree }),
    };

    const updated = await Unit.findOneAndUpdate(
      { code: provinceCode, level: "province" },
      updateData,
      { new: true, runValidators: true }
    );

    // ✅ Cập nhật JSON file
    const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "[]";
    const provinces = JSON.parse(raw);
    const idx = provinces.findIndex((p) => String(p.code) === String(provinceCode));
    if (idx !== -1) {
      provinces[idx] = { ...provinces[idx], ...updateData };
      fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));
    }

    console.log(`📝 Updated province: ${provinceCode}`);
    return res.json({ success: true, message: "Province updated successfully", data: updated });
  } catch (err) {
    console.error("❌ updateProvince failed:", err);
    return res.status(500).json({ error: "Failed to update province", details: err.message });
  }
}

// =============================
// 🔹 XÓA TỈNH (SOFT DELETE)
// =============================
export async function deleteProvince(req, res) {
  try {
    const { provinceCode } = req.params;

    const province = await Unit.findOne({ code: provinceCode, level: "province" });
    if (!province) return res.status(404).json({ error: "Province not found" });

    // 🗂️ Ghi lịch sử
    await new UnitHistory({
      code: province.code,
      action: "delete",
      oldData: province,
      newData: null,
      deleted: true,
      changedAt: new Date(),
      changedBy: "system",
    }).save();

    // 🧹 Cập nhật JSON
    const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "[]";
    const provinces = JSON.parse(raw).filter((p) => String(p.code) !== String(provinceCode));
    fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));

    // 🧩 Soft delete trong Mongo
    const deleted = await Unit.findOneAndUpdate(
      { code: provinceCode, level: "province" },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    console.log(`❌ Deleted province: ${provinceCode}`);
    return res.json({ success: true, message: "Province deleted successfully", data: deleted });
  } catch (err) {
    console.error("❌ deleteProvince failed:", err);
    return res.status(500).json({ error: "Failed to delete province", details: err.message });
  }
}

// =============================
// 🔹 KHÔI PHỤC TỈNH
// =============================
export async function restoreProvince(req, res) {
  try {
    const { provinceCode } = req.params;

    const deleted = await Unit.findOne({ code: provinceCode, level: "province", isDeleted: true });
    if (!deleted) return res.status(404).json({ error: "Deleted province not found" });

    const restored = await Unit.findOneAndUpdate(
      { code: provinceCode, level: "province" },
      { $unset: { isDeleted: 1, deletedAt: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    );

    // ✅ Thêm lại JSON nếu bị thiếu
    const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "[]";
    const provinces = JSON.parse(raw);
    if (!provinces.find((p) => String(p.code) === String(restored.code))) {
      provinces.push({
        code: restored.code,
        name: restored.name,
        englishName: restored.englishName,
        administrativeLevel: restored.administrativeLevel,
        decree: restored.decree,
        districts: [],
      });
      fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));
    }

    console.log(`♻️ Restored province: ${provinceCode}`);
    return res.json({ success: true, message: "Province restored successfully", data: restored });
  } catch (err) {
    console.error("❌ restoreProvince failed:", err);
    return res.status(500).json({ error: "Failed to restore province", details: err.message });
  }
}

// =============================
// 🔹 LẤY DANH SÁCH TỈNH ĐÃ XÓA
// =============================
export async function getDeletedProvinces(req, res) {
  try {
    const deleted = await Unit.find({ level: "province", isDeleted: true }).sort({ deletedAt: -1 }).lean();
    return res.json({ success: true, count: deleted.length, deleted });
  } catch (err) {
    console.error("❌ getDeletedProvinces failed:", err);
    return res.status(500).json({ error: "Failed to get deleted provinces", details: err.message });
  }
}
