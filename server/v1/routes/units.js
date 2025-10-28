import express from "express";
import {
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitById,
  getHistory,
  restoreFromHistory,
} from "../controllers/unitController.js";

const router = express.Router();

router.post("/", createUnit);
router.put("/:code", updateUnit);
router.delete("/:code", deleteUnit);
router.get("/:code", getUnitById);
router.get("/:code/history", getHistory);
router.post("/:code/restore", restoreFromHistory);

export default router;


