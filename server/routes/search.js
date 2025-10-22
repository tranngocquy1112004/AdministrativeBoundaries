import { Router } from "express";
import { searchUnits } from "../controllers/searchController.js";

const router = Router();
router.get("/", searchUnits);
export default router;
