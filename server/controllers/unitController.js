// ✅ server/controllers/unitController.js
import Unit from "../models/Unit.js";
import { buildTree } from "../utils/finder.js";

/** GET /units */
export async function getUnits(req, res) {
  try {
    const units = await Unit.find();
    res.json(units);
  } catch (err) {
    console.error("❌ Error fetching units:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** GET /units/:id */
export async function getUnitById(req, res) {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** POST /units */
export async function createUnit(req, res) {
  try {
    const { name, code, level, parentCode, boundary } = req.body;
    if (!name || !code || !level)
      return res.status(400).json({ error: "Missing required fields" });

    const exists = await Unit.findOne({ code });
    if (exists)
      return res.status(400).json({ error: "Unit code already exists" });

    const unit = new Unit({
      name,
      code,
      level,
      parentCode: parentCode || null,
      boundary: boundary || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: []
    });

    await unit.save();
    res.status(201).json({ message: "✅ Created", unit });
  } catch (err) {
    console.error("❌ Error creating unit:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** PUT /units/:id */
export async function updateUnit(req, res) {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });

    const old = { ...unit.toObject() };
    Object.assign(unit, req.body, { updatedAt: new Date() });
    unit.history.push(old);
    await unit.save();

    res.json({ message: "✅ Updated", unit });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** DELETE /units/:id */
export async function deleteUnit(req, res) {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    await unit.deleteOne();
    res.json({ message: "✅ Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** GET /units/search */
export async function searchUnits(req, res) {
  try {
    const { name, code, level } = req.query;
    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (code) query.code = code;
    if (level) query.level = level;

    const units = await Unit.find(query);
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** GET /units/tree */
export async function getUnitsTree(req, res) {
  try {
    const data = await Unit.find();
    const tree = buildTree(data);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** GET /units/:id/history */
export async function getHistory(req, res) {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    res.json(unit.history);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** POST /units/:id/restore */
export async function restoreFromHistory(req, res) {
  try {
    const { index } = req.body;
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });

    const version = unit.history[index];
    if (!version) return res.status(400).json({ error: "Invalid history index" });

    Object.assign(unit, version);
    await unit.save();
    res.json({ message: "✅ Restored", unit });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}
