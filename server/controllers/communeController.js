import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

export async function getCommunes(req, res) {
  try {
    const effectiveDate = req.query.effectiveDate || "latest";
    const provinceID = req.params.provinceID;

    let url = `${process.env.API_BASE}/${effectiveDate}/communes`;
    if (provinceID) {
      url = `${process.env.API_BASE}/${effectiveDate}/provinces/${provinceID}/communes`;
    }

    console.log("🔹 Fetching communes:", url);
    const resp = await fetch(url);
    const data = await resp.json();

    return res.json(data.communes || data);
  } catch (err) {
    console.error("❌ Error fetching communes:", err);
    res.status(500).json({ error: "Failed to fetch communes" });
  }
}
