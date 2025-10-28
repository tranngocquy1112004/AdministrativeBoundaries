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

router.get("/", getCommunes);
router.get("/deleted/list", getDeletedCommunes);
router.get("/history", getHistoryCommunes);
router.get("/history/:communeCode", getHistoryByCode);
router.get("/:communeCode", getCommuneByCode);
router.post("/", createCommune);
router.post("/:communeCode", updateCommune);
router.put("/:communeCode", updateCommune);
router.delete("/:communeCode", deleteCommune);
router.post("/:communeCode/restore", restoreCommune);

export default router;


