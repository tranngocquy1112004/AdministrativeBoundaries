import express from "express";
import {
  getUnits,
  updateUnit,
  deleteUnit,
  getHistory,
  restoreFromHistory,
  searchUnits,
  getUnitsTree,
  diffHistory,
  getUnitById,
  createUnit,
} from "../controllers/unitController.js";
import validateUnit from "../middleware/validateUnit.js";

const router = express.Router();
router.get("/", getUnits);
router.get("/search", searchUnits);
router.get("/tree", getUnitsTree);
router.get("/:id/history", getHistory);
router.get("/:id/diff", diffHistory);
router.get("/:id", getUnitById);
router.post("/", createUnit);
router.put("/:id", updateUnit);
router.patch("/:id", updateUnit);
router.post("/:id/restore", restoreFromHistory);
router.delete("/:id", deleteUnit);
export default router;
