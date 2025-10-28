import Unit from "../../v1/models/Unit.js";
import { getV2Provinces, getV2ProvinceByCode, getV2WardsByProvince } from "../utils/loader.js";

export async function getProvinces(req, res) {
  const provinces = await Unit.find({ schemaVersion: 'v2', level: 'province' }).lean();
  if (provinces.length) return res.json(provinces.map(p => ({ code: p.code, name: p.name })));
  return res.json(getV2Provinces());
}

export async function getProvinceByCode(req, res) {
  const { provinceCode } = req.params;
  const province = await Unit.findOne({ schemaVersion: 'v2', level: 'province', code: String(provinceCode) }).lean();
  if (province) {
    const wards = await Unit.find({ schemaVersion: 'v2', level: 'commune', parentCode: String(provinceCode) }).lean();
    return res.json({ ...province, wards });
  }
  const p = getV2ProvinceByCode(provinceCode);
  if (!p) return res.status(404).json({ error: "Province not found" });
  const wards = getV2WardsByProvince(provinceCode);
  return res.json({ ...p, wards });
}

export async function createProvince(req, res) {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ error: "Missing code or name" });
    const codeStr = String(code);
    const exists = await Unit.findOne({ schemaVersion: 'v2', level: 'province', code: codeStr });
    if (exists) return res.status(409).json({ error: "Province already exists" });

    const doc = await Unit.create({
      schemaVersion: 'v2',
      level: 'province',
      code: codeStr,
      name,
      parentCode: null,
      uniqueKey: `v2-province-${codeStr}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateProvince(req, res) {
  try {
    const { provinceCode } = req.params;
    const updates = req.body || {};
    updates.updatedAt = new Date();
    const updated = await Unit.findOneAndUpdate(
      { schemaVersion: 'v2', level: 'province', code: String(provinceCode) },
      updates,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Province not found" });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteProvince(req, res) {
  try {
    const { provinceCode } = req.params;
    const deleted = await Unit.findOneAndDelete({ schemaVersion: 'v2', level: 'province', code: String(provinceCode) });
    if (!deleted) return res.status(404).json({ error: "Province not found" });
    // Optionally also delete wards under this province
    await Unit.deleteMany({ schemaVersion: 'v2', level: 'commune', parentCode: String(provinceCode) });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Removed legacy v1 controller duplication. V2 uses simplified province/ward only.
