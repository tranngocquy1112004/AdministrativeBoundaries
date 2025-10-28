import express from "express";
import provinces from "./routes/provinces.js";
import communes from "./routes/communes.js";
import districts from "./routes/districts.js";
import units from "./routes/units.js";
import search from "./routes/search.js";
import tree from "./routes/tree.js";
import convert from "./routes/convert.js";

const router = express.Router();

router.use("/provinces", provinces);
router.use("/communes", communes);
router.use("/districts", districts);
router.use("/units", units);
router.use("/search", search);
router.use("/tree", tree);
router.use("/convert", convert);

export default router;


