import express from "express";
import { mapCode } from "./controller.js";

const router = express.Router();

router.post("/code", mapCode);

export default router;
