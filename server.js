import express from "express";
import dotenv from "dotenv";
// Import routes
import provinceRoutes from "./server/routes/provinces.js";
import communeRoutes from "./server/routes/communes.js";
import convertRoutes from "./server/routes/convert.js";
import unitsRoutes from "./server/routes/units.js";
// Load biến môi trường
dotenv.config();
// Khởi tạo Express
const app = express();
// Middleware
app.use(express.json()); // Đọc body JSON
app.use(express.urlencoded({ extended: true })); // Hỗ trợ form-urlencoded nếu cần

// --- ROUTES ---
app.get("/", (req, res) => {
  res.json({
    message: "🌏 Administrative Boundaries API running successfully!",
    endpoints: {
      provinces: "/provinces",
      communes: "/communes",
      convert: "/convert",
      units: "/units",
    },
  });
});

// Gắn router theo module
app.use("/units", unitsRoutes);
app.use("/provinces", provinceRoutes);
app.use("/communes", communeRoutes);
app.use("/convert", convertRoutes);

// --- XỬ LÝ LỖI CHUNG ---
app.use((req, res, next) => {
  res.status(404).json({
    error: "❌ Route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- KHỞI ĐỘNG SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log("✅ Available routes:");
  console.log("   • GET    /provinces");
  console.log("   • GET    /communes");
  console.log("   • POST   /convert");
  console.log("   • CRUD   /units");
});
