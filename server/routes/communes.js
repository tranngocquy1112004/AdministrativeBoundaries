import express from "express";
import { getCommunes, updateCommune, createCommune, deleteCommune, restoreCommune, getDeletedCommunes } from "../controllers/communeController.js";

const router = express.Router();

// Lấy tất cả xã/phường
router.get("/", getCommunes);

// Lấy xã/phường theo tỉnh cụ thể
router.get("/:provinceID", getCommunes);

// Lấy danh sách communes đã bị xóa
router.get("/deleted/list", getDeletedCommunes);

// Cập nhật commune theo code
router.post("/:communeCode", updateCommune);

// Thêm commune mới
router.put("/:communeCode", createCommune);

// Xóa commune theo code (soft delete)
router.delete("/:communeCode", deleteCommune);

// Restore commune đã bị xóa
router.post("/:communeCode/restore", restoreCommune);

export default router;
