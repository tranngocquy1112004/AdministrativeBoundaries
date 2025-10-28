import express from "express";
import {
  getCommunes,
  getCommuneByCode,
  createCommune,
  updateCommune,
  deleteCommune,
  restoreCommune,
  getDeletedCommunes,
  getHistoryCommunes,
  getHistoryByCode,
} from "../controllers/communeController.js";

const router = express.Router();

/**
 * ==========================
 * 🧾 COMMUNES ROUTES
 * ==========================
 * ⚙️ Quy tắc:
 *  - Các route tĩnh (deleted, history, by-province) phải đặt TRƯỚC route động "/:communeCode"
 *  - Tránh bị nhầm route param
 */

// 🔹 Lấy danh sách xã / xã theo tỉnh
router.get("/", getCommunes);                          // GET /communes → tất cả xã
router.get("/by-province/:provinceCode", getCommunes); // GET /communes/by-province/35 → xã thuộc tỉnh 35

// 🔹 Lịch sử & danh sách bị xóa
router.get("/deleted/list", getDeletedCommunes);       // GET /communes/deleted/list → danh sách xã đã xóa
router.get("/history", getHistoryCommunes);            // GET /communes/history → toàn bộ lịch sử
router.get("/history/:communeCode", getHistoryByCode); // GET /communes/history/13525 → lịch sử 1 xã cụ thể

// 🔹 CRUD cơ bản
router.post("/", createCommune);                       // POST /communes → tạo xã mới
router.put("/:communeCode", updateCommune);            // PUT /communes/13525 → cập nhật xã
router.delete("/:communeCode", deleteCommune);         // DELETE /communes/13525 → xóa mềm
router.post("/:communeCode/restore", restoreCommune);  // POST /communes/13525/restore → khôi phục xã

// 🔹 Route cuối cùng: Lấy 1 xã cụ thể (đặt cuối để tránh conflict)
router.get("/:communeCode", getCommuneByCode);         // GET /communes/13525 → chi tiết xã

export default router;
