import express from "express";
import { getCommunes, updateCommune, createCommune, deleteCommune, restoreCommune, getDeletedCommunes, getHistoryCommunes, getHistoryByCode } from "../controllers/communeController.js";

const router = express.Router();

// Lấy tất cả xã/phường
router.get("/", getCommunes);

// Lấy danh sách communes đã bị xóa từ MongoDB
router.get("/deleted/list", getDeletedCommunes);

// Lấy danh sách communes đã bị xóa từ history.json
router.get("/history", getHistoryCommunes);

// Lấy history của commune cụ thể
router.get("/history/:communeCode", getHistoryByCode);

// Lấy xã/phường theo tỉnh cụ thể (phải đặt sau các route cụ thể)
router.get("/:provinceID", getCommunes);

// Tạo commune mới (POST /communes/)
router.post("/", createCommune);

// Cập nhật commune theo code
router.post("/:communeCode", updateCommune);

// Thêm commune mới
router.put("/:communeCode", createCommune);

// Xóa commune theo code (soft delete)
router.delete("/:communeCode", deleteCommune);

// Restore commune đã bị xóa
router.post("/:communeCode/restore", restoreCommune);

export default router;
