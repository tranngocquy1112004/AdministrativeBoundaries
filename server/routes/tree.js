import { Router } from "express";
import { getTree } from "../controllers/treeController.js";

const router = Router();
router.get("/", getTree);
export default router;
