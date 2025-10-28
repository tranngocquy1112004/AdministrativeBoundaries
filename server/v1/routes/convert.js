import express from "express";
import { convertAddress } from "../controllers/convertController.js";

const router = express.Router();

router.post("/", convertAddress);

export default router;


