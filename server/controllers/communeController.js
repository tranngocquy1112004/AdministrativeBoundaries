import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Unit from "../models/Unit.js";
import UnitHistory from "../models/UnitHistory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../../data/full-address.json");

export async function getCommunes(req, res) {
  try {
    const { provinceID } = req.params;

    // ⚙️ Ưu tiên MongoDB
    let communes = [];
    if (provinceID) {
      // Check if provinceID is actually a province code
      const province = await Unit.findOne({ code: provinceID, level: "province" });
      
      if (province) {
        // It's a province code, find communes under this province
        communes = await Unit.find({ 
          level: "commune", 
          parentCode: provinceID,
          $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]
        }).lean();
        
        // If no direct communes, try through districts
        if (communes.length === 0) {
          const districts = await Unit.find({ level: "district", parentCode: provinceID }).lean();
          const districtCodes = districts.map((d) => d.code);
          communes = await Unit.find({ 
            level: "commune", 
            parentCode: { $in: districtCodes },
            $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]
          }).lean();
        }
      } else {
        // Check if it's a commune code instead
        const commune = await Unit.findOne({ 
          code: provinceID, 
          level: "commune",
          $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]
        });
        if (commune) {
          // Return the specific commune
          communes = [commune];
        } else {
          return res.status(404).json({ error: "Province or commune not found" });
        }
      }
    } else {
      communes = await Unit.find({ 
        level: "commune",
        $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]
      }).lean();
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
      // First try direct communes under province
      if (province.communes && Array.isArray(province.communes)) {
        allCommunes.push(...province.communes);
      }
      // Then try communes under districts
      province.districts?.forEach((d) => {
        allCommunes.push(...(d.communes || []));
      });
      return res.json(allCommunes);
    } else {
      let allCommunes = [];
      provinces.forEach((p) => {
        // Direct communes under province
        if (p.communes && Array.isArray(p.communes)) {
          allCommunes.push(...p.communes);
        }
        // Communes under districts
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
        // Direct communes under province
        if (p.communes && Array.isArray(p.communes)) {
          allCommunes.push(...p.communes);
        }
        // Communes under districts
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

export async function updateCommune(req, res) {
  try {
    console.log("🔄 Update commune request:", req.params, req.body);
    
    const { communeCode } = req.params;
    const { name, englishName, administrativeLevel, decree } = req.body;

    // Tìm commune theo code
    const commune = await Unit.findOne({ code: communeCode, level: "commune" });
    
    if (!commune) {
      console.log(`❌ Commune not found: ${communeCode}`);
      return res.status(404).json({ error: "Commune not found" });
    }

    console.log(`✅ Found commune: ${commune.name}`);

    // Cập nhật thông tin
    const updateData = {};
    if (name) updateData.name = name;
    if (englishName) updateData.englishName = englishName;
    if (administrativeLevel) updateData.administrativeLevel = administrativeLevel;
    if (decree) updateData.decree = decree;
    
    updateData.updatedAt = new Date();

    console.log("📝 Update data:", updateData);

    const updatedCommune = await Unit.findOneAndUpdate(
      { code: communeCode, level: "commune" },
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`✅ Updated commune: ${communeCode} - ${updatedCommune.name}`);
    return res.json({
      success: true,
      message: "Commune updated successfully",
      data: updatedCommune
    });

  } catch (err) {
    console.error("❌ Error updating commune:", err);
    return res.status(500).json({ 
      error: "Failed to update commune",
      details: err.message 
    });
  }
}

export async function createCommune(req, res) {
  try {
    console.log("🔄 Create commune request:", req.params, req.body);
    
    // Lấy communeCode từ params hoặc body
    const { communeCode } = req.params;
    const { name, englishName, administrativeLevel, decree, parentCode, code } = req.body;
    
    // Sử dụng communeCode từ params hoặc code từ body
    const finalCommuneCode = communeCode || code;

    // Kiểm tra commune đã tồn tại chưa
    const existingCommune = await Unit.findOne({ code: finalCommuneCode, level: "commune" });
    
    if (existingCommune) {
      console.log(`❌ Commune already exists: ${finalCommuneCode}`);
      return res.status(409).json({ 
        error: "Commune already exists",
        existingCommune: existingCommune 
      });
    }

    console.log(`✅ Creating new commune: ${finalCommuneCode} - ${name}`);

    // Tạo commune mới
    const newCommune = await Unit.create({
      name: name,
      code: finalCommuneCode,
      englishName: englishName || "",
      administrativeLevel: administrativeLevel || "Xã",
      provinceCode: parentCode || null,
      provinceName: null, // Sẽ được cập nhật sau
      decree: decree || "",
      level: "commune",
      parentCode: parentCode || null,
      boundary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: []
    });

    console.log(`✅ Created commune: ${finalCommuneCode} - ${newCommune.name}`);
    return res.status(201).json({
      success: true,
      message: "Commune created successfully",
      data: newCommune
    });

  } catch (err) {
    console.error("❌ Error creating commune:", err);
    return res.status(500).json({ 
      error: "Failed to create commune",
      details: err.message 
    });
  }
}

export async function deleteCommune(req, res) {
  try {
    console.log("🔄 Delete commune request:", req.params);
    
    const { communeCode } = req.params;

    // Tìm commune theo code
    const commune = await Unit.findOne({ code: communeCode, level: "commune" });
    
    if (!commune) {
      console.log(`❌ Commune not found: ${communeCode}`);
      return res.status(404).json({ 
        error: "Commune not found",
        code: communeCode 
      });
    }

    console.log(`✅ Found commune to delete: ${commune.name} (${commune.code})`);

    // 1. Lưu vào unit_histories collection
    const historyEntry = new UnitHistory({
      code: commune.code,
      action: "delete",
      oldData: {
        name: commune.name,
        code: commune.code,
        englishName: commune.englishName,
        administrativeLevel: commune.administrativeLevel,
        provinceCode: commune.provinceCode,
        provinceName: commune.provinceName,
        decree: commune.decree,
        level: commune.level,
        parentCode: commune.parentCode,
        boundary: commune.boundary,
        createdAt: commune.createdAt,
        updatedAt: commune.updatedAt,
        history: commune.history
      },
      newData: null, // Không có data mới khi xóa
      deleted: true,
      changedAt: new Date(),
      changedBy: "system"
    });
    
    await historyEntry.save();
    console.log("📝 Saved delete history to unit_histories collection");

    // 2. Lưu vào history.json (backup)
    const historyPath = path.join(__dirname, "../../data/history.json");
    let historyData = [];
    
    try {
      const existingHistory = fs.readFileSync(historyPath, "utf8");
      if (existingHistory.trim()) {
        historyData = JSON.parse(existingHistory);
      }
    } catch (err) {
      console.log("📝 Creating new history file");
    }
    
    const jsonHistoryEntry = {
      action: "deleted",
      deletedAt: new Date(),
      deletedBy: "system",
      data: {
        name: commune.name,
        code: commune.code,
        englishName: commune.englishName,
        administrativeLevel: commune.administrativeLevel,
        provinceCode: commune.provinceCode,
        provinceName: commune.provinceName,
        decree: commune.decree,
        level: commune.level,
        parentCode: commune.parentCode,
        boundary: commune.boundary,
        createdAt: commune.createdAt,
        updatedAt: commune.updatedAt,
        history: commune.history
      }
    };
    
    historyData.push(jsonHistoryEntry);
    fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2));

    // 2. Xóa khỏi full-address.json
    const fullAddressPath = path.join(__dirname, "../../data/full-address.json");
    const fullAddressData = JSON.parse(fs.readFileSync(fullAddressPath, "utf8"));
    
    // Tìm và xóa commune khỏi full-address.json
    for (const province of fullAddressData) {
      if (province.communes) {
        province.communes = province.communes.filter(c => c.code !== communeCode);
      }
      if (province.districts) {
        for (const district of province.districts) {
          if (district.communes) {
            district.communes = district.communes.filter(c => c.code !== communeCode);
          }
        }
      }
    }
    
    fs.writeFileSync(fullAddressPath, JSON.stringify(fullAddressData, null, 2));

    // 3. Soft delete trong MongoDB
    const deletedCommune = await Unit.findOneAndUpdate(
      { code: communeCode, level: "commune" },
      { 
        $push: { history: historyEntry },
        $set: { 
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { new: true }
    );

    console.log(`✅ Deleted commune from all sources: ${communeCode} - ${commune.name}`);
    return res.json({
      success: true,
      message: "Commune deleted successfully from all sources",
      deletedCommune: {
        name: deletedCommune.name,
        code: deletedCommune.code,
        level: deletedCommune.level,
        deletedAt: deletedCommune.deletedAt
      }
    });

  } catch (err) {
    console.error("❌ Error deleting commune:", err);
    return res.status(500).json({ 
      error: "Failed to delete commune",
      details: err.message 
    });
  }
}

export async function restoreCommune(req, res) {
  try {
    console.log("🔄 Restore commune request:", req.params);
    
    const { communeCode } = req.params;

    // Tìm commune đã bị xóa
    const deletedCommune = await Unit.findOne({ 
      code: communeCode, 
      level: "commune",
      isDeleted: true 
    });
    
    if (!deletedCommune) {
      console.log(`❌ Deleted commune not found: ${communeCode}`);
      return res.status(404).json({ 
        error: "Deleted commune not found",
        code: communeCode 
      });
    }

    console.log(`✅ Found deleted commune to restore: ${deletedCommune.name} (${deletedCommune.code})`);

    // 1. Lưu restore action vào unit_histories collection
    const restoreHistoryEntry = new UnitHistory({
      code: deletedCommune.code,
      action: "restore",
      oldData: {
        isDeleted: true,
        deletedAt: deletedCommune.deletedAt
      },
      newData: {
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date()
      },
      deleted: false,
      changedAt: new Date(),
      changedBy: "system"
    });
    
    await restoreHistoryEntry.save();
    console.log("📝 Saved restore history to unit_histories collection");

    // 2. Thêm lại vào full-address.json
    const fullAddressPath = path.join(__dirname, "../../data/full-address.json");
    const fullAddressData = JSON.parse(fs.readFileSync(fullAddressPath, "utf8"));
    
    // Tìm province tương ứng và thêm commune vào
    const targetProvince = fullAddressData.find(p => p.code === deletedCommune.provinceCode);
    if (targetProvince) {
      if (!targetProvince.communes) {
        targetProvince.communes = [];
      }
      
      // Kiểm tra commune chưa tồn tại
      const existingCommune = targetProvince.communes.find(c => c.code === deletedCommune.code);
      if (!existingCommune) {
        targetProvince.communes.push({
          code: deletedCommune.code,
          name: deletedCommune.name,
          englishName: deletedCommune.englishName,
          administrativeLevel: deletedCommune.administrativeLevel,
          provinceCode: deletedCommune.provinceCode,
          provinceName: deletedCommune.provinceName,
          decree: deletedCommune.decree
        });
        fs.writeFileSync(fullAddressPath, JSON.stringify(fullAddressData, null, 2));
        console.log("📝 Added commune back to full-address.json");
      }
    }

    // 3. Restore commune trong MongoDB
    const restoredCommune = await Unit.findOneAndUpdate(
      { code: communeCode, level: "commune" },
      { 
        $unset: { isDeleted: 1, deletedAt: 1 },
        $set: { 
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    console.log(`✅ Restored commune: ${communeCode} - ${restoredCommune.name}`);
    return res.json({
      success: true,
      message: "Commune restored successfully from all sources",
      restoredCommune: {
        name: restoredCommune.name,
        code: restoredCommune.code,
        level: restoredCommune.level,
        restoredAt: new Date()
      }
    });

  } catch (err) {
    console.error("❌ Error restoring commune:", err);
    return res.status(500).json({ 
      error: "Failed to restore commune",
      details: err.message 
    });
  }
}

export async function getDeletedCommunes(req, res) {
  try {
    console.log("🔄 Get deleted communes request");

    // Lấy tất cả communes đã bị xóa từ MongoDB
    const deletedCommunes = await Unit.find({ 
      level: "commune",
      isDeleted: true 
    }).sort({ deletedAt: -1 });

    console.log(`✅ Found ${deletedCommunes.length} deleted communes from MongoDB`);
    return res.json({
      success: true,
      count: deletedCommunes.length,
      deletedCommunes: deletedCommunes.map(commune => ({
        name: commune.name,
        code: commune.code,
        level: commune.level,
        deletedAt: commune.deletedAt,
        history: commune.history
      }))
    });

  } catch (err) {
    console.error("❌ Error getting deleted communes:", err);
    return res.status(500).json({ 
      error: "Failed to get deleted communes",
      details: err.message 
    });
  }
}

export async function getHistoryCommunes(req, res) {
  try {
    console.log("🔄 Get history communes request");

    // Đọc từ unit_histories collection
    const historyEntries = await UnitHistory.find({})
      .sort({ changedAt: -1 })
      .lean();

    console.log(`✅ Found ${historyEntries.length} history entries in unit_histories`);
    return res.json({
      success: true,
      count: historyEntries.length,
      historyEntries: historyEntries.map(entry => ({
        code: entry.code,
        action: entry.action,
        oldData: entry.oldData,
        newData: entry.newData,
        deleted: entry.deleted,
        changedAt: entry.changedAt,
        changedBy: entry.changedBy
      }))
    });

  } catch (err) {
    console.error("❌ Error getting history communes:", err);
    return res.status(500).json({ 
      error: "Failed to get history communes",
      details: err.message 
    });
  }
}

export async function getHistoryByCode(req, res) {
  try {
    console.log("🔄 Get history by code request:", req.params);
    
    const { communeCode } = req.params;

    // Lấy history của commune cụ thể
    const historyEntries = await UnitHistory.find({ code: communeCode })
      .sort({ changedAt: -1 })
      .lean();

    if (historyEntries.length === 0) {
      return res.status(404).json({
        error: "No history found for this commune",
        code: communeCode
      });
    }

    console.log(`✅ Found ${historyEntries.length} history entries for commune ${communeCode}`);
    return res.json({
      success: true,
      code: communeCode,
      count: historyEntries.length,
      historyEntries: historyEntries.map(entry => ({
        action: entry.action,
        oldData: entry.oldData,
        newData: entry.newData,
        deleted: entry.deleted,
        changedAt: entry.changedAt,
        changedBy: entry.changedBy
      }))
    });

  } catch (err) {
    console.error("❌ Error getting history by code:", err);
    return res.status(500).json({ 
      error: "Failed to get history by code",
      details: err.message 
    });
  }
}
