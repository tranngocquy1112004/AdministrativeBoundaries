import express from "express";
import { searchUnits } from "../controllers/searchController.js";

const router = express.Router();

router.get("/", searchUnits);

export default router;


