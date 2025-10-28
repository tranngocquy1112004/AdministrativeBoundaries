import express from "express";
import {
  getProvinces,
  getProvinceByCode,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
  restoreProvince,
  getDeletedProvinces
} from "../controllers/provinceController.js";

const router = express.Router();

router.get("/", getProvinces);
router.get("/:provinceCode", getProvinceByCode);
router.get("/id/:id", getProvinceById);
router.post("/", createProvince);
router.put("/:provinceCode", updateProvince);
router.delete("/:provinceCode", deleteProvince);
router.patch("/restore/:provinceCode", restoreProvince);
router.get("/deleted/list", getDeletedProvinces);

export default router;
