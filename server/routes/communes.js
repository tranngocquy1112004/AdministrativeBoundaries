import express from "express";
import { getCommunes } from "../controllers/communeController.js";

const router = express.Router();

// Lấy tất cả xã/phường
router.get("/", getCommunes);

// Lấy xã/phường theo tỉnh cụ thể
router.get("/:provinceID", getCommunes);

export default router;
