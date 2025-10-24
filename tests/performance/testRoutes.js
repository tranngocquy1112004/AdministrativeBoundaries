// Test routes for performance tests
import express from "express";
import {
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitById,
  getHistory,
  restoreFromHistory,
} from "./testController.js";

const router = express.Router();

/**
 * @route   GET /units
 * @desc    Lấy danh sách toàn bộ đơn vị hành chính
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const Unit = (await import("../../server/models/Unit.js")).default;
    const units = await Unit.find();
    res.json(units);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route   POST /units
 * @desc    Thêm mới đơn vị hành chính
 * @access  Public
 */
router.post("/", createUnit);

/**
 * @route   PUT /units/:code
 * @desc    Cập nhật thông tin đơn vị hành chính
 * @access  Public
 */
router.put("/:code", updateUnit);

/**
 * @route   DELETE /units/:code
 * @desc    Xóa đơn vị hành chính và ghi lịch sử vào MongoDB
 * @access  Public
 */
router.delete("/:code", deleteUnit);

/**
 * @route   GET /units/:code
 * @desc    Lấy thông tin chi tiết theo mã đơn vị
 * @access  Public
 */
router.get("/:code", getUnitById);

/**
 * @route   GET /units/:code/history
 * @desc    Xem toàn bộ lịch sử thay đổi của đơn vị
 * @access  Public
 */
router.get("/:code/history", getHistory);

/**
 * @route   POST /units/:code/restore
 * @desc    Khôi phục đơn vị từ lịch sử
 * @access  Public
 */
router.post("/:code/restore", restoreFromHistory);

export default router;
