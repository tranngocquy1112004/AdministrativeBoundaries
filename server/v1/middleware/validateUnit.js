// Xác thực dữ liệu đầu vào 
export default function validateUnit(req, res, next) {
    // Handle null/undefined request body
    if (!req.body) {
        return res.status(400).json({ error: "Request body is required." });
    }
    
    const { name, code, level } = req.body;
    const validLevels = ["province", "district", "commune"];

    if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Invalid or missing 'name' field." });
    }
    if (!code || typeof code !== "string" || code.trim() === "") {
        return res.status(400).json({ error: "Invalid or missing 'code' field." });
    }
    if (!level || !validLevels.includes(level)) {
        return res.status(400).json({ error: "Invalid or missing 'level' field. Must be one of: " + validLevels.join(", ") });
    }
    next();
}
