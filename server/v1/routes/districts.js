import express from "express";
import {
  getDistricts,
  getDistrictByCode,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  restoreDistrict,
  getDeletedDistricts,
} from "../controllers/districtController.js";

const router = express.Router();

router.get("/", getDistricts);
router.get("/deleted/list", getDeletedDistricts);
router.get("/:districtCode", getDistrictByCode);
router.post("/", createDistrict);
router.put("/:districtCode", updateDistrict);
router.delete("/:districtCode", deleteDistrict);
router.post("/:districtCode/restore", restoreDistrict);

export default router;


