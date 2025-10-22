import fs from "fs";
import path from "path";
import { buildTree } from "../utils/finder.js";

const dataPath = path.resolve("server/data/units.json");
function readData() {
  try {
    if (!fs.existsSync(dataPath)) return [];
    const text = fs.readFileSync(dataPath, "utf8") || "[]";
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Error reading units.json:", err);
    return [];
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Error writing units.json:", err);
  }
}

// GET /units
export function getUnits(req, res) {
  const data = readData();
  res.json(data);
}

// GET /units/:id
export function getUnitById(req, res) {
  const { id } = req.params;
  const data = readData();
  const unit = data.find(u => String(u.id) === String(id));
  if (!unit) return res.status(404).json({ error: "Unit not found" });
  res.json(unit);
}

// POST /units
export function createUnit(req, res) {
  try {
    const { name, code, level, parentCode, boundary } = req.body;
    if (!name || !code || !level) {
      return res.status(400).json({ error: "Missing required fields: name, code, level" });
    }
    const data = readData();
    if (data.find(u => String(u.code) === String(code))) {
      return res.status(400).json({ error: "Unit code already exists" });
    }
    const newUnit = {
      id: Date.now(),
      name,
      code,
      level,
      parentCode: parentCode || null,
      boundary: boundary || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
      children: []
    };
    data.push(newUnit);
    writeData(data);
    res.status(201).json({ message: "Created", unit: newUnit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// PUT / PATCH /units/:id
export function updateUnit(req, res) {
  try {
    const { id } = req.params;
    const data = readData();
    const idx = data.findIndex(u => String(u.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "Unit not found" });

    const old = { ...data[idx] };
    const updated = {
      ...old,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    // push old to history
    updated.history = [...(old.history || []), old];

    data[idx] = updated;
    writeData(data);
    res.json({ message: "Updated", unit: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// DELETE /units/:id
export function deleteUnit(req, res) {
  try {
    const { id } = req.params;
    let data = readData();
    const exists = data.find(u => String(u.id) === String(id));
    if (!exists) return res.status(404).json({ error: "Unit not found" });
    data = data.filter(u => String(u.id) !== String(id));
    writeData(data);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /units/:id/history
export function getHistory(req, res) {
  const { id } = req.params;
  const data = readData();
  const unit = data.find(u => String(u.id) === String(id));
  if (!unit) return res.status(404).json({ error: "Unit not found" });
  res.json(unit.history || []);
}

// POST /units/:id/restore
export function restoreFromHistory(req, res) {
  try {
    const { id } = req.params;
    const { index } = req.body;
    const data = readData();
    const unit = data.find(u => String(u.id) === String(id));
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    const version = unit.history?.[index];
    if (!version) return res.status(400).json({ error: "Invalid history index" });
    // restore fields from version
    Object.assign(unit, version);
    unit.updatedAt = new Date().toISOString();
    writeData(data);
    res.json({ message: "Restored", unit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /units/search?name=&code=&level=
export function searchUnits(req, res) {
  try {
    const { name, code, level } = req.query;
    let result = readData();
    if (name) result = result.filter(u => String(u.name).toLowerCase().includes(String(name).toLowerCase()));
    if (code) result = result.filter(u => String(u.code) === String(code));
    if (level) result = result.filter(u => String(u.level) === String(level));
    if (result.length === 0) return res.status(404).json({ message: "No unit found" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
// GET /units/tree
export function getUnitsTree(req, res) {
  try {
    const data = readData();
    const tree = buildTree(data);
    res.json(tree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /units/:id/diff?old=0&new=1
export function diffHistory(req, res) {
  try {
    const { id } = req.params;
    const { old, new: newer } = req.query;
    const data = readData();
    const unit = data.find(u => String(u.id) === String(id));
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    const a = unit.history?.[old];
    const b = unit.history?.[newer] || unit;
    if (!a || !b) return res.status(400).json({ error: "Invalid history index" });
    const diff = {};
    for (const k of Object.keys(b)) {
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
        diff[k] = { old: a[k], new: b[k] };
      }
    }
    res.json(diff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
// GET /units/tree
export function getUnitsTree(req, res) {
  try {
    const { level } = req.query;
    const data = readData(); // Đọc từ server/data/units.json
    const tree = buildTree(data);
    if (level) {
  const filtered = tree.filter(u => u.level === level);
  return res.json(filtered);
    }
    res.json(tree);
  } catch (err) {
    console.error("❌ Lỗi khi tạo cây phân cấp:", err);
    res.status(500).json({ error: "Không thể tạo cây phân cấp" });
  }
}