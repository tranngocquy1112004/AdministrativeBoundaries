import fs from "fs";
import path from "path";
import Unit from "../v1/models/Unit.js";

const V1_PATH = path.resolve("data/full-address.json");
const V2_PATH = path.resolve("data/full-address-v2.json");

function safeReadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Fallback JSON read failed: ${filePath}`, err);
    return [];
  }
}

async function buildV1FromDB(commune) {
  if (!commune) return null;
  let district = null;
  let province = null;

  if (commune.parentCode) {
    district = await Unit.findOne({
      schemaVersion: "v1",
      level: "district",
      code: String(commune.parentCode),
    }).lean();
  }

  if (district?.parentCode) {
    province = await Unit.findOne({
      schemaVersion: "v1",
      level: "province",
      code: String(district.parentCode),
    }).lean();
  }

  return {
    code: String(commune.code),
    province: province?.name || null,
    district: district?.name || null,
    commune: commune.name || null,
    source: "mongo",
  };
}

async function buildV2FromDB(commune) {
  if (!commune) return null;
  let province = null;

  if (commune.parentCode) {
    province = await Unit.findOne({
      schemaVersion: "v2",
      level: "province",
      code: String(commune.parentCode),
    }).lean();
  }

  return {
    code: String(commune.code),
    province: province?.name || null,
    commune: commune.name || null,
    source: "mongo",
  };
}

function findV1InJson(codeStr) {
  const provinces = safeReadJSON(V1_PATH);
  for (const p of provinces) {
    for (const d of p.districts || []) {
      for (const w of d.wards || []) {
        if (String(w.code) === codeStr) {
          return {
            code: codeStr,
            province: p.name,
            district: d.name,
            commune: w.name,
            source: "json",
          };
        }
      }
      for (const c of d.communes || []) {
        if (String(c.code) === codeStr) {
          return {
            code: codeStr,
            province: p.name,
            district: d.name,
            commune: c.name,
            source: "json",
          };
        }
      }
    }

    for (const c of p.communes || p.wards || []) {
      if (String(c.code) === codeStr) {
        return {
          code: codeStr,
          province: p.name,
          district: null,
          commune: c.name,
          source: "json",
        };
      }
    }
  }
  return null;
}

function findV2InJson(codeStr) {
  const provinces = safeReadJSON(V2_PATH);
  for (const p of provinces) {
    for (const w of p.wards || []) {
      if (String(w.code) === codeStr) {
        return {
          code: codeStr,
          province: p.name,
          commune: w.name,
          source: "json",
        };
      }
    }
  }
  return null;
}

export async function mapCode(req, res) {
  try {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: "Thiếu trường 'code'" });
    }

    const codeStr = String(code);

    const [v1Commune, v2Commune] = await Promise.all([
      Unit.findOne({
        schemaVersion: "v1",
        level: "commune",
        $expr: { $eq: [{ $toString: "$code" }, codeStr] },
      }).lean(),
      Unit.findOne({
        schemaVersion: "v2",
        level: "commune",
        $expr: { $eq: [{ $toString: "$code" }, codeStr] },
      }).lean(),
    ]);

    const v1Result = (await buildV1FromDB(v1Commune)) || findV1InJson(codeStr);
    const v2Result = (await buildV2FromDB(v2Commune)) || findV2InJson(codeStr);

    if (!v1Result && !v2Result) {
      return res.status(404).json({ error: "Không tìm thấy mã", code: codeStr });
    }

    return res.json({
      code: codeStr,
      v1: v1Result,
      v2: v2Result,
    });
  } catch (err) {
    console.error("Bridge mapCode failed:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
