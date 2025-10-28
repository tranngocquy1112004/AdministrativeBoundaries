import express from "express";
import { getProvinces, getProvinceByCode, createProvince, updateProvince, deleteProvince } from "../controllers/provinceController.js";
import { getCommunes } from "../controllers/communeController.js";

const router = express.Router();

router.get("/", getProvinces);
router.get("/:provinceCode", getProvinceByCode);
router.get("/:provinceCode/wards", (req, res) => {
  req.query.provinceCode = req.params.provinceCode;
  return getCommunes(req, res);
});
router.post("/", createProvince);
router.put("/:provinceCode", updateProvince);
router.delete("/:provinceCode", deleteProvince);

export default router;
