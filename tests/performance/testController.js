// Test controller for performance tests
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";

/** ✅ POST /units - Thêm đơn vị hành chính (test version) */
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

    // Check if code already exists
    const exists = await Unit.findOne({ code });
    if (exists) return res.status(400).json({ error: "Mã đơn vị đã tồn tại" });

    // Validate parentCode if provided
    if (parentCode) {
      const parentExists = await Unit.findOne({ code: parentCode });
      if (!parentExists)
        return res.status(404).json({ error: "Không tìm thấy đơn vị cha (tỉnh/huyện)" });
    }

    // Create unit in MongoDB
    const newUnit = await Unit.create({
      name,
      code,
      level,
      parentCode: parentCode || null,
      boundary: boundary || null,
      englishName: englishName || "",
      administrativeLevel: administrativeLevel || "Phường/Xã",
      provinceCode: provinceCode || null,
      provinceName: provinceName || null,
      decree: decree || "",
    });

    // Create history
    await UnitHistory.create({
      code,
      action: "create",
      oldData: null,
      newData: newUnit,
      changedAt: new Date(),
    });

    res.status(201).json({ message: "✅ Đã thêm và lưu lịch sử", unit: newUnit });
  } catch (err) {
    console.error("❌ Lỗi thêm:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** ✏️ PUT /units/:code - Cập nhật đơn vị hành chính (test version) */
export async function updateUnit(req, res) {
  try {
    const { code } = req.params;
    const updateData = req.body;

    // Find unit in MongoDB
    const existingUnit = await Unit.findOne({ code });
    if (!existingUnit) {
      return res.status(404).json({ error: "Không tìm thấy đơn vị" });
    }

    // Update unit
    const updatedUnit = await Unit.findOneAndUpdate(
      { code },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    // Create history
    await UnitHistory.create({
      code,
      action: "update",
      oldData: existingUnit,
      newData: updatedUnit,
      changedAt: new Date(),
    });

    res.json({ message: "✅ Đã cập nhật và lưu lịch sử", unit: updatedUnit });
  } catch (err) {
    console.error("❌ Lỗi cập nhật:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** 🗑️ DELETE /units/:code - Xóa đơn vị hành chính (test version) */
export async function deleteUnit(req, res) {
  try {
    const { code } = req.params;

    // Find unit in MongoDB
    const existingUnit = await Unit.findOne({ code });
    if (!existingUnit) {
      return res.status(404).json({ error: "Không tìm thấy đơn vị" });
    }

    // Delete from MongoDB
    await Unit.deleteOne({ code });

    // Create history
    await UnitHistory.create({
      code,
      action: "delete",
      oldData: existingUnit,
      newData: null,
      changedAt: new Date(),
    });

    res.json({ message: "✅ Đã xóa và lưu lịch sử", deleted: existingUnit });
  } catch (err) {
    console.error("❌ Lỗi xóa:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** 🔍 GET /units/:code - Lấy thông tin chi tiết theo mã đơn vị (test version) */
export async function getUnitById(req, res) {
  try {
    const { code } = req.params;
    const unit = await Unit.findOne({ code });
    if (!unit) return res.status(404).json({ error: "Không tìm thấy đơn vị" });
    res.json(unit);
  } catch (err) {
    console.error("❌ Lỗi lấy thông tin:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** 🕓 GET /units/:code/history - Xem lịch sử thay đổi (test version) */
export async function getHistory(req, res) {
  try {
    const { code } = req.params;
    const history = await UnitHistory.find({ code }).sort({ changedAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** 🔄 POST /units/:code/restore - Khôi phục đơn vị từ lịch sử (test version) */
export async function restoreFromHistory(req, res) {
  try {
    const { code } = req.params;
    const { historyId } = req.body;

    if (!historyId) {
      return res.status(400).json({ error: "Thiếu historyId" });
    }

    const history = await UnitHistory.findById(historyId);
    if (!history) {
      return res.status(404).json({ error: "Không tìm thấy lịch sử" });
    }

    if (history.action === "create") {
      // Restore from create action
      const restoredUnit = await Unit.create(history.newData);
      res.json({ message: "✅ Đã khôi phục từ lịch sử", unit: restoredUnit });
    } else if (history.action === "update") {
      // Restore from update action
      const restoredUnit = await Unit.findOneAndUpdate(
        { code },
        history.oldData,
        { new: true }
      );
      res.json({ message: "✅ Đã khôi phục từ lịch sử", unit: restoredUnit });
    } else if (history.action === "delete") {
      // Restore from delete action
      const restoredUnit = await Unit.create(history.oldData);
      res.json({ message: "✅ Đã khôi phục từ lịch sử", unit: restoredUnit });
    } else {
      res.status(400).json({ error: "Không thể khôi phục từ action này" });
    }
  } catch (err) {
    console.error("❌ Lỗi khôi phục:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
