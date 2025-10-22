import fetch from "node-fetch";

export async function convertAddress(req, res) {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Missing address" });

    const url = "https://production.cas.so/address-kit/convert";
    console.log("🔄 Fetching convert:", url);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    const text = await resp.text();
    console.log("Response convert:", resp.status, text);

    if (!resp.ok) return res.status(resp.status).send(text);
    res.send(text);
  } catch (err) {
    console.error("❌ Convert error:", err);
    res.status(500).json({ error: err.message });
  }
}
