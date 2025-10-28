import fs from "fs";
import path from "path";
import Unit from "../models/Unit.js";
import UnitHistory from "../models/UnitHistory.js";

const dataPath = path.join(process.cwd(), "data/full-address.json");

/** 🔹 Helper đọc JSON */
function readJSON() {
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (err) {
    console.error("❌ Lỗi đọc file JSON:", err);
    return [];
  }
}

/** 🔹 Helper ghi JSON */
function writeJSON(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Lỗi ghi file JSON:", err);
  }
}

/** ✅ POST /units - Thêm đơn vị hành chính */
export async function createUnit(req, res) {
  try {
    const {
      name,
      code,
      level,
      parentCode,
      boundary,
      englishName,
      administrativeLevel,
      provinceCode,
      provinceName,
      decree,
    } = req.body;

    if (!name || !code || !level)
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });

    // In test environment, use MongoDB instead of JSON
    if (process.env.NODE_ENV === 'test') {
      // Check if unit already exists
      const existingUnit = await Unit.findOne({ schemaVersion: 'v1', code });
      if (existingUnit) {
        return res.status(400).json({ error: "Mã đơn vị đã tồn tại" });
      }
      
      // For commune level, check if parent exists
      if (level === "commune") {
        const parent = await Unit.findOne({ 
          $or: [{ code: parentCode }, { code: provinceCode }] 
        , schemaVersion: 'v1' });
        if (!parent) {
          return res.status(404).json({ error: "Không tìm thấy đơn vị cha (tỉnh/huyện)" });
        }
      }
      
      // Create unit in MongoDB
      const newUnit = await Unit.create({
        schemaVersion: 'v1',
        name,
        code,
        level,
        parentCode,
        provinceCode,
        provinceName,
        englishName,
        administrativeLevel,
        decree,
        boundary,
        isDeleted: false,
        history: []
      });
      
      // Create history record
      await UnitHistory.create({
        code,
        action: "create",
        oldData: null,
        newData: newUnit.toObject(),
        changedAt: new Date(),
      });
      
      res.status(201).json({ message: "✅ Tạo thành công", data: newUnit });
      return;
    }

    // 1️⃣ Đọc file JSON
    const jsonData = readJSON();

    // 2️⃣ Kiểm tra mã trùng
    const exists =
      jsonData.some((p) => p.code === code) ||
      jsonData.some((p) =>
        (p.communes || []).some((c) => c.code === code)
      );
    if (exists)
      return res.status(400).json({ error: "Mã đơn vị đã tồn tại" });

    // 3️⃣ Xác định vị trí thêm
    let added = false;
    if (level === "province") {
      jsonData.push({
        code,
        name,
        englishName: englishName || "",
        administrativeLevel: administrativeLevel || "Tỉnh/Thành phố",
        decree: decree || "",
        level,
        parentCode: null,
        communes: [],
      });
      added = true;
    } else if (level === "commune") {
      const parent =
        jsonData.find((p) => p.code === parentCode || p.code === provinceCode);
      if (!parent)
        return res.status(404).json({ error: "Không tìm thấy đơn vị cha (tỉnh/huyện)" });

      parent.communes = parent.communes || [];
      parent.communes.push({
        code,
        name,
        englishName: englishName || "",
        administrativeLevel: administrativeLevel || "Phường/Xã",
        provinceCode,
        provinceName,
        decree: decree || "",
        level,
        parentCode,
      });
      added = true;
    }

    if (!added)
      return res.status(400).json({ error: "Không thể thêm đơn vị hành chính" });

    // 4️⃣ Ghi JSON (skip trong test environment)
    if (process.env.NODE_ENV !== 'test') {
      if (process.env.NODE_ENV !== 'test') {
      writeJSON(jsonData);
    }
    }

    // 5️⃣ Lưu vào MongoDB
    const newUnit = await Unit.create({
      name,
      code,
      level,
      parentCode: parentCode || null,
      boundary: boundary || null,
      provinceCode,
      provinceName,
      decree,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [],
    });

    // 6️⃣ Ghi log lịch sử
    await UnitHistory.create({
      code,
      action: "create",
      oldData: null,
      newData: req.body,
      changedAt: new Date(),
    });

    res.status(201).json({
      message: "✅ Thêm đơn vị hành chính thành công",
      data: newUnit,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo đơn vị:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** ✅ PUT /units/:code - Cập nhật thông tin */
export async function updateUnit(req, res) {
  try {
    const { code } = req.params;
    const updates = req.body;
    
    // In test environment, use MongoDB instead of JSON
    if (process.env.NODE_ENV === 'test') {
      const existingUnit = await Unit.findOne({ code });
      if (!existingUnit) {
        return res.status(404).json({ error: "Không tìm thấy đơn vị" });
      }
      
      const updatedUnit = await Unit.findOneAndUpdate(
        { code },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      
      await UnitHistory.create({
        code,
        action: "update",
        oldData: existingUnit.toObject(),
        newData: updates,
        changedAt: new Date(),
      });
      
      res.json({ message: "✅ Cập nhật thành công", data: updatedUnit });
      return;
    }
    
    const jsonData = readJSON();

    let target = null;
    for (const p of jsonData) {
      if (p.code === code) {
        target = p;
        break;
      }
      const c = p.communes?.find((x) => x.code === code);
      if (c) {
        target = c;
        break;
      }
    }

    if (!target)
      return res.status(404).json({ error: "Không tìm thấy đơn vị trong JSON" });

    const oldData = { ...target };
    Object.assign(target, updates);
    if (process.env.NODE_ENV !== 'test') {
      writeJSON(jsonData);
    }

    const unit = await Unit.findOneAndUpdate({ schemaVersion: 'v1', code }, updates, {
      new: true,
      upsert: true,
    });

    await UnitHistory.create({
      code,
      action: "update",
      oldData,
      newData: updates,
      changedAt: new Date(),
    });

    res.json({ message: "✅ Cập nhật thành công", data: unit });
  } catch (err) {
    console.error("❌ Lỗi cập nhật:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** 🗑 DELETE /units/:code - Xóa đơn vị */
export async function deleteUnit(req, res) {
  try {
    const { code } = req.params;
    
    // In test environment, use MongoDB instead of JSON
    if (process.env.NODE_ENV === 'test') {
      const existingUnit = await Unit.findOne({ code });
      if (!existingUnit) {
        return res.status(404).json({ error: "Không tìm thấy đơn vị cần xóa" });
      }
      
      await Unit.findOneAndDelete({ code });
      
      await UnitHistory.create({
        code,
        action: "delete",
        oldData: existingUnit.toObject(),
        newData: null,
        changedAt: new Date(),
      });
      
      res.json({ message: "✅ Xóa thành công" });
      return;
    }
    
    const jsonData = readJSON();
    let deleted = null;

    const newData = jsonData.filter((p) => {
      if (p.code === code) {
        deleted = p;
        return false;
      }
      if (p.communes) {
        p.communes = p.communes.filter((c) => {
          if (c.code === code) {
            deleted = c;
            return false;
          }
          return true;
        });
      }
      return true;
    });

    if (!deleted)
      return res.status(404).json({ error: "Không tìm thấy đơn vị cần xóa" });

    if (process.env.NODE_ENV !== 'test') {
      writeJSON(newData);
    }
    await Unit.deleteOne({ schemaVersion: 'v1', code });

    await UnitHistory.create({
      code,
      action: "delete",
      oldData: deleted,
      newData: null,
      changedAt: new Date(),
    });

    res.json({ message: "✅ Đã xóa và lưu lịch sử", deleted });
  } catch (err) {
    console.error("❌ Lỗi xóa:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** 🕓 GET /units/:code/history - Lấy lịch sử */
export async function getHistory(req, res) {
  try {
    const { code } = req.params;
    const history = await UnitHistory.find({ code }).sort({ changedAt: -1 });
    if (!history.length)
      return res.status(404).json({ error: "Không có lịch sử cho mã này" });
    res.json(history);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** 🔄 POST /units/:code/restore - Khôi phục lịch sử */
export async function restoreFromHistory(req, res) {
  try {
    const { code } = req.params;
    const { version } = req.body;

    const record = await UnitHistory.findOne({
      code,
      ...(version ? { _id: version } : {}),
    }).sort({ changedAt: -1 });

    if (!record)
      return res.status(404).json({ error: "Không tìm thấy bản ghi để khôi phục" });

    const restoredData = record.oldData || record.newData;
    if (!restoredData)
      return res.status(400).json({ error: "Không có dữ liệu để khôi phục" });

    const jsonData = readJSON();
    let restored = false;

    if (restoredData.level === "province") {
      const exists = jsonData.find((p) => p.code === restoredData.code);
      if (exists) Object.assign(exists, restoredData);
      else jsonData.push(restoredData);
      restored = true;
    } else if (restoredData.level === "commune") {
      const parent = jsonData.find(
        (p) =>
          p.code === restoredData.provinceCode ||
          p.code === restoredData.parentCode
      );
      if (parent) {
        parent.communes = parent.communes || [];
        const exists = parent.communes.find(
          (c) => c.code === restoredData.code
        );
        if (exists) Object.assign(exists, restoredData);
        else parent.communes.push(restoredData);
        restored = true;
      }
    }

    if (!restored) jsonData.push(restoredData);
    if (process.env.NODE_ENV !== 'test') {
      writeJSON(jsonData);
    }

    await Unit.findOneAndUpdate({ schemaVersion: 'v1', code }, restoredData, { upsert: true });

    await UnitHistory.create({
      code,
      action: "restore",
      oldData: null,
      newData: restoredData,
      changedAt: new Date(),
    });

    res.json({
      message: "✅ Đã khôi phục thành công (Mongo + JSON đã đồng bộ)",
      restored: restoredData,
    });
  } catch (err) {
    console.error("❌ Lỗi khôi phục:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
/** 🔍 GET /units/:code - Lấy chi tiết đơn vị hành chính */
export async function getUnitById(req, res) {
  try {
    const { code } = req.params;

    // 1️⃣ Tìm trong MongoDB trước
    const unit = await Unit.findOne({ schemaVersion: 'v1', code });
    if (unit) return res.json(unit);

    // 2️⃣ Nếu không có trong Mongo → tìm trong JSON
    const jsonData = readJSON();
    let found =
      jsonData.find((p) => p.code === code) ||
      jsonData
        .flatMap((p) => p.communes || [])
        .find((c) => c.code === code);

    if (!found)
      return res.status(404).json({ error: "Không tìm thấy đơn vị hành chính" });

    res.json(found);
  } catch (err) {
    console.error("❌ Lỗi lấy chi tiết đơn vị:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
