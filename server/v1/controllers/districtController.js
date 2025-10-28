import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";
import UnitHistory from "../models/UnitHistory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(process.cwd(), "data/full-address.json");

// ====================================================
// 🔹 LẤY DANH SÁCH HUYỆN (toàn bộ hoặc theo mã tỉnh)
// ====================================================
export async function getDistricts(req, res) {
  try {
    const { provinceCode } = req.query;

    let query = { schemaVersion: 'v1', level: "district", $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };
    if (provinceCode) query.parentCode = provinceCode;

    const districts = await Unit.find(query).lean();
    if (districts.length > 0) {
      console.log("✅ Loaded districts from MongoDB");
      return res.json(districts);
    }

    // Fallback JSON
    console.warn("⚠️ MongoDB empty → reading from JSON file");
    const raw = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(raw);

    let allDistricts = [];
    if (provinceCode) {
      const province = provinces.find((p) => p.code === provinceCode);
      if (!province) return res.status(404).json({ error: "Province not found" });
      allDistricts = province.districts || [];
    } else {
      provinces.forEach((p) => {
        if (Array.isArray(p.districts)) allDistricts.push(...p.districts);
      });
    }

    return res.json(allDistricts);
  } catch (err) {
    console.error("❌ Error getDistricts:", err);
    return res.status(500).json({ error: "Failed to load districts" });
  }
}

// ====================================================
// 🔹 LẤY CHI TIẾT MỘT HUYỆN THEO MÃ (READ by ID)
// ====================================================
export async function getDistrictByCode(req, res) {
  try {
    const { districtCode } = req.params;
    const district = await Unit.findOne({ schemaVersion: 'v1', code: districtCode, level: "district" }).lean();

    if (!district) {
      console.warn(`⚠️ District ${districtCode} not found in MongoDB → fallback JSON`);
      const raw = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(raw);

      for (const p of provinces) {
        const found = p.districts?.find((d) => d.code === districtCode);
        if (found) return res.json(found);
      }
      return res.status(404).json({ error: "District not found" });
    }

    return res.json(district);
  } catch (err) {
    console.error("❌ Error getDistrictByCode:", err);
    return res.status(500).json({ error: "Failed to load district detail" });
  }
}

// ====================================================
// 🔹 TẠO HUYỆN MỚI (CREATE)
// ====================================================
export async function createDistrict(req, res) {
  try {
    const { code, name, englishName, administrativeLevel, decree, parentCode } = req.body;

    const existing = await Unit.findOne({ schemaVersion: 'v1', code, level: "district" });
    if (existing) return res.status(409).json({ error: "District already exists" });

    const newDistrict = await Unit.create({
      code,
      name,
      englishName: englishName || "",
      administrativeLevel: administrativeLevel || "Huyện",
      decree: decree || "",
      schemaVersion: 'v1',
      level: "district",
      parentCode: parentCode || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ✅ Ghi vào JSON
    const raw = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(raw);
    const targetProvince = provinces.find((p) => p.code === parentCode);
    if (targetProvince) {
      targetProvince.districts = targetProvince.districts || [];
      targetProvince.districts.push({
        code,
        name,
        englishName,
        administrativeLevel,
        decree,
      });
      fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));
    }

    return res.status(201).json({ success: true, message: "District created", data: newDistrict });
  } catch (err) {
    console.error("❌ Error createDistrict:", err);
    return res.status(500).json({ error: "Failed to create district" });
  }
}

// ====================================================
// 🔹 CẬP NHẬT HUYỆN (UPDATE)
// ====================================================
export async function updateDistrict(req, res) {
  try {
    const { districtCode } = req.params;
    const { name, englishName, administrativeLevel, decree } = req.body;

    const district = await Unit.findOne({ schemaVersion: 'v1', code: districtCode, level: "district" });
    if (!district) return res.status(404).json({ error: "District not found" });

    const updateData = {
      updatedAt: new Date(),
    };
    if (name) updateData.name = name;
    if (englishName) updateData.englishName = englishName;
    if (administrativeLevel) updateData.administrativeLevel = administrativeLevel;
    if (decree) updateData.decree = decree;

    const updated = await Unit.findOneAndUpdate(
      { code: districtCode, level: "district" },
      updateData,
      { new: true, runValidators: true }
    );

    // ✅ Cập nhật JSON
    const raw = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(raw);
    provinces.forEach((p) => {
      p.districts?.forEach((d) => {
        if (d.code === districtCode) Object.assign(d, updateData);
      });
    });
    fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));

    return res.json({ success: true, message: "District updated", data: updated });
  } catch (err) {
    console.error("❌ Error updateDistrict:", err);
    return res.status(500).json({ error: "Failed to update district" });
  }
}

// ====================================================
// 🔹 XÓA MỀM HUYỆN (DELETE)
// ====================================================
export async function deleteDistrict(req, res) {
  try {
    const { districtCode } = req.params;

    const district = await Unit.findOne({ code: districtCode, level: "district" });
    if (!district) return res.status(404).json({ error: "District not found" });

    // Lưu lịch sử
    await UnitHistory.create({
      code: district.code,
      action: "delete",
      oldData: district,
      newData: null,
      deleted: true,
      changedAt: new Date(),
      changedBy: "system",
    });

    // Xóa trong JSON
    const raw = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(raw);
    provinces.forEach((p) => {
      if (p.districts) {
        p.districts = p.districts.filter((d) => d.code !== districtCode);
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));

    // Soft delete trong Mongo
    const deletedDistrict = await Unit.findOneAndUpdate(
      { schemaVersion: 'v1', code: districtCode, level: "district" },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    return res.json({ success: true, message: "District deleted", data: deletedDistrict });
  } catch (err) {
    console.error("❌ Error deleteDistrict:", err);
    return res.status(500).json({ error: "Failed to delete district" });
  }
}

// ====================================================
// 🔹 KHÔI PHỤC HUYỆN
// ====================================================
export async function restoreDistrict(req, res) {
  try {
    const { districtCode } = req.params;

    const deletedDistrict = await Unit.findOne({ schemaVersion: 'v1', code: districtCode, level: "district", isDeleted: true });
    if (!deletedDistrict) return res.status(404).json({ error: "Deleted district not found" });

    const restored = await Unit.findOneAndUpdate(
      { schemaVersion: 'v1', code: districtCode, level: "district" },
      { $unset: { isDeleted: 1, deletedAt: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    );

    // Thêm lại vào JSON
    const raw = fs.readFileSync(filePath, "utf8");
    const provinces = JSON.parse(raw);
    const targetProvince = provinces.find((p) => p.code === restored.parentCode);
    if (targetProvince) {
      targetProvince.districts = targetProvince.districts || [];
      const exists = targetProvince.districts.find((d) => d.code === restored.code);
      if (!exists) {
        targetProvince.districts.push({
          code: restored.code,
          name: restored.name,
          englishName: restored.englishName,
          administrativeLevel: restored.administrativeLevel,
          decree: restored.decree,
        });
        fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));
      }
    }

    return res.json({ success: true, message: "District restored", data: restored });
  } catch (err) {
    console.error("❌ Error restoreDistrict:", err);
    return res.status(500).json({ error: "Failed to restore district" });
  }
}

// ====================================================
// 🔹 LẤY DANH SÁCH HUYỆN ĐÃ XÓA
// ====================================================
export async function getDeletedDistricts(req, res) {
  try {
    const deleted = await Unit.find({ schemaVersion: 'v1', level: "district", isDeleted: true }).sort({ deletedAt: -1 }).lean();
    return res.json({ count: deleted.length, deleted });
  } catch (err) {
    console.error("❌ Error getDeletedDistricts:", err);
    return res.status(500).json({ error: "Failed to get deleted districts" });
  }
}
