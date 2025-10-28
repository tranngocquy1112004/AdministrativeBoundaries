import Unit from "../../../models/Unit.js";

/**
 * GET /tree
 * Tạo cây phân cấp từ MongoDB
 */
export async function getTree(req, res) {
  try {
    const units = await Unit.find();
    const map = {};

    // Gom dữ liệu theo parentCode
    for (const u of units) map[u.code] = { ...u.toObject(), children: [] };
    const tree = [];

    for (const u of units) {
      if (u.parentCode && map[u.parentCode]) {
        map[u.parentCode].children.push(map[u.code]);
      } else if (u.level === "province") {
        tree.push(map[u.code]);
      }
    }

    res.json(tree);
  } catch (err) {
    console.error("❌ Tree error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
