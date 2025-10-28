import express from "express";
import { getCommunes, getCommuneByCode, createCommune, updateCommune, deleteCommune } from "../controllers/communeController.js";

const router = express.Router();

router.get("/", getCommunes);
router.get("/:communeCode", getCommuneByCode);
router.post("/", createCommune);
router.put("/:communeCode", updateCommune);
router.delete("/:communeCode", deleteCommune);

export default router;


