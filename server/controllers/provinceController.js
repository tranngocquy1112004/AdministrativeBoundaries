import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

export async function getProvinces(req, res) {
  try {
    const effectiveDate = req.query.effectiveDate || "latest";
    const url = `${process.env.API_BASE}/${effectiveDate}/provinces`;

    console.log("🔹 Fetching provinces:", url);
    const resp = await fetch(url);
    const data = await resp.json();

    return res.json(data.provinces || data);
  } catch (err) {
    console.error("❌ Error fetching provinces:", err);
    res.status(500).json({ error: "Failed to fetch provinces" });
  }
}
