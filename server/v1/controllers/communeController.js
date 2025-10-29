import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";
import UnitHistory from "../models/UnitHistory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(process.cwd(), "data/full-address.json");

//
// ========================== 🔧 TIỆN ÍCH ==========================
//
function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`❌ Lỗi đọc file JSON: ${filePath}`, err);
    return [];
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`❌ Ghi file JSON thất bại: ${filePath}`, err);
  }
}

//
// ========================== 📍 GET ALL COMMUNES ==========================
//
export async function getCommunes(req, res) {
  try {
    const provinceCode = req.query.provinceCode || req.params.provinceCode;

    const query = {
      schemaVersion: 'v1',
      level: "commune",
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };

    // 🔹 Nếu có provinceCode → lấy toàn bộ xã thuộc các huyện trong tỉnh đó
    if (provinceCode) {
      const districts = await Unit.find({
        schemaVersion: 'v1',
        level: "district",
        parentCode: String(provinceCode),
      }).lean();

      const districtCodes = districts.map((d) => String(d.code));
      query.parentCode = { $in: districtCodes };
    }

    const communes = await Unit.find(query).lean();

    if (communes.length > 0) {
      console.log(`✅ Loaded ${communes.length} communes from MongoDB`);
      return res.json(communes);
    }

    // 🔹 Nếu MongoDB trống → fallback JSON
    console.warn("⚠️ MongoDB empty → fallback to JSON");
    const provinces = readJSON(DATA_PATH);
    const allCommunes = [];

    provinces.forEach((p) => {
      p.districts?.forEach((d) => {
        if (Array.isArray(d.communes)) {
          d.communes.forEach((c) =>
            allCommunes.push({
              ...c,
              parentCode: d.code,
              provinceCode: p.code,
            })
          );
        }
      });
      if (Array.isArray(p.communes)) {
        p.communes.forEach((c) =>
          allCommunes.push({
            ...c,
            parentCode: p.code,
            provinceCode: p.code,
          })
        );
      }
    });

    if (provinceCode) {
      const filtered = allCommunes.filter(
        (c) => String(c.provinceCode) === String(provinceCode)
      );
      return res.json(filtered);
    }

    return res.json(allCommunes);
  } catch (err) {
    console.error("❌ getCommunes failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to get communes", details: err.message });
  }
}

//
// ========================== 📍 GET COMMUNE BY CODE ==========================
//
export async function getCommuneByCode(req, res) {
  try {
    const { communeCode } = req.params;
    const codeStr = String(communeCode);

    // 1) Try match in MongoDB using $expr to compare string values (safe even if stored as number or string)
    const commune = await Unit.findOne({
      schemaVersion: 'v1',
      level: "commune",
      $expr: { $eq: [{ $toString: "$code" }, codeStr] },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }).lean();

    if (commune) {
      console.log(`✅ Commune found in MongoDB: ${commune.name} (code=${commune.code})`);
      return res.json(commune);
    }

    // 2) Fallback → read from JSON file
    const provinces = readJSON(DATA_PATH);
    for (const p of provinces) {
      // communes directly under province
      if (Array.isArray(p.communes)) {
        const found = p.communes.find((c) => String(c.code) === codeStr);
        if (found) return res.json(found);
      }
      // communes under districts
      for (const d of p.districts || []) {
        const found = d.communes?.find((c) => String(c.code) === codeStr);
        if (found) return res.json(found);
      }
    }

    return res.status(404).json({ error: "Commune not found" });
  } catch (err) {
    console.error("❌ getCommuneByCode failed:", err);
    return res.status(500).json({ error: "Failed to load commune", details: err.message });
  }
}

//
// ========================== ➕ CREATE COMMUNE ==========================
//
export async function createCommune(req, res) {
  try {
    const { code, name, englishName, administrativeLevel, decree, parentCode } =
      req.body;

    if (!code || !name) {
      return res
        .status(400)
        .json({ error: "Missing required fields: code, name" });
    }

    const exists = await Unit.findOne({
      schemaVersion: 'v1',
      level: "commune",
      code: String(code),
    });
    if (exists)
      return res.status(409).json({ error: "Commune already exists" });

    // ✅ Sinh uniqueKey động trong hàm
    const uniqueKey = `v1-commune-${code}`;

    const newCommune = await Unit.create({
      schemaVersion: 'v1',
      code,
      name,
      englishName: englishName || "",
      administrativeLevel: administrativeLevel || "Xã",
      decree: decree || "",
      level: "commune",
      parentCode: parentCode || null,
      uniqueKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ✅ Cập nhật JSON
    const provinces = readJSON(DATA_PATH);
    let added = false;

    for (const p of provinces) {
      for (const d of p.districts || []) {
        if (String(d.code) === String(parentCode)) {
          d.communes = d.communes || [];
          d.communes.push({
            code,
            name,
            englishName,
            administrativeLevel,
            decree,
          });
          added = true;
        }
      }
      if (!added && String(p.code) === String(parentCode)) {
        p.communes = p.communes || [];
        p.communes.push({ code, name });
      }
    }

    saveJSON(DATA_PATH, provinces);
    console.log(`✅ Created commune: ${name} (${code})`);

    return res.status(201).json({ success: true, data: newCommune });
  } catch (err) {
    console.error("❌ createCommune failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to create commune", details: err.message });
  }
}

//
// ========================== ✏️ UPDATE COMMUNE ==========================
//
export async function updateCommune(req, res) {
  try {
    const { communeCode } = req.params;
    const { name, englishName, administrativeLevel, decree } = req.body;

    const commune = await Unit.findOne({
      schemaVersion: 'v1',
      code: String(communeCode),
      level: "commune",
    });
    if (!commune) return res.status(404).json({ error: "Commune not found" });

    const updateData = {
      updatedAt: new Date(),
      ...(name && { name }),
      ...(englishName && { englishName }),
      ...(administrativeLevel && { administrativeLevel }),
      ...(decree && { decree }),
    };

    const updated = await Unit.findOneAndUpdate(
      { _id: commune._id },
      updateData,
      { new: true, runValidators: true }
    );

    const provinces = readJSON(DATA_PATH);
    provinces.forEach((p) => {
      p.districts?.forEach((d) => {
        d.communes?.forEach((c) => {
          if (String(c.code) === String(communeCode))
            Object.assign(c, updateData);
        });
      });
      p.communes?.forEach((c) => {
        if (String(c.code) === String(communeCode)) Object.assign(c, updateData);
      });
    });
    saveJSON(DATA_PATH, provinces);

    console.log(`📝 Updated commune: ${communeCode}`);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ updateCommune failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to update commune", details: err.message });
  }
}

//
// ========================== 🗑️ DELETE & RESTORE ==========================
//
export async function deleteCommune(req, res) {
  try {
    const { communeCode } = req.params;
    const commune = await Unit.findOne({
      schemaVersion: 'v1',
      code: String(communeCode),
      level: "commune",
    });
    if (!commune) return res.status(404).json({ error: "Commune not found" });

    await new UnitHistory({
      code: commune.code,
      action: "delete",
      oldData: commune,
      newData: null,
      deleted: true,
      changedAt: new Date(),
      changedBy: "system",
    }).save();

    const deleted = await Unit.findOneAndUpdate(
      { _id: commune._id },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    console.log(`❌ Deleted commune: ${communeCode}`);
    return res.json({ success: true, data: deleted });
  } catch (err) {
    console.error("❌ deleteCommune failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to delete commune", details: err.message });
  }
}

export async function restoreCommune(req, res) {
  try {
    const { communeCode } = req.params;
    const deleted = await Unit.findOne({
      schemaVersion: 'v1',
      code: String(communeCode),
      level: "commune",
      isDeleted: true,
    });
    if (!deleted)
      return res.status(404).json({ error: "Deleted commune not found" });

    const restored = await Unit.findOneAndUpdate(
      { _id: deleted._id },
      { $unset: { isDeleted: 1, deletedAt: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    );

    console.log(`♻️ Restored commune: ${communeCode}`);
    return res.json({ success: true, data: restored });
  } catch (err) {
    console.error("❌ restoreCommune failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to restore commune", details: err.message });
  }
}

//
// ========================== 🧾 HISTORY ==========================
export async function getDeletedCommunes(req, res) {
  try {
    const deleted = await Unit.find({ schemaVersion: 'v1', level: "commune", isDeleted: true })
      .sort({ deletedAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: deleted.length,
      data: deleted,
    });
  } catch (err) {
    console.error("❌ getDeletedCommunes failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to get deleted communes", details: err.message });
  }
}

export async function getHistoryCommunes(req, res) {
  try {
    const history = await UnitHistory.find({ level: "commune" })
      .sort({ changedAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    console.error("❌ getHistoryCommunes failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to get commune history", details: err.message });
  }
}

export async function getHistoryByCode(req, res) {
  try {
    const { communeCode } = req.params;
    const history = await UnitHistory.find({ code: String(communeCode) })
      .sort({ changedAt: -1 })
      .lean();

    if (!history.length)
      return res.status(404).json({ error: "No history found", code: communeCode });

    return res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    console.error("❌ getHistoryByCode failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to get history by code", details: err.message });
  }
}
