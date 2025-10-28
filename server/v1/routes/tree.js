import express from "express";
import { getTree } from "../controllers/treeController.js";

const router = express.Router();

router.get("/", getTree);

export default router;


