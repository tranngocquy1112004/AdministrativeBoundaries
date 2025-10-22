import Unit from "../models/Unit.js";

/**
 * GET /search?name=Hà Nội&level=province
 */
export async function searchUnits(req, res) {
  try {
    const { name, level, code } = req.query;
    const query = {};

    if (name) query.name = { $regex: name, $options: "i" };
    if (level) query.level = level;
    if (code) query.code = code;

    const result = await Unit.find(query).limit(50);
    res.json(result);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
