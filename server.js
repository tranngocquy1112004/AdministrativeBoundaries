import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./server/utils/db.js";
// Import routes
import provinceRoutes from "./server/routes/provinces.js";
import communeRoutes from "./server/routes/communes.js";
import convertRoutes from "./server/routes/convert.js";
import unitsRoutes from "./server/routes/units.js";
import searchRoutes from "./server/routes/search.js";
import treeRoutes from "./server/routes/tree.js";
import districtRoutes from "./server/routes/districts.js";
// Import error handlers
import { notFoundHandler, errorHandler } from "./server/middleware/errorHandler.js";
// Load biến môi trường
dotenv.config();
// Kết nối MongoDB
connectDB();
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
app.use("/search", searchRoutes);
app.use("/tree", treeRoutes);
app.use("/districts", districtRoutes);
// --- XỬ LÝ LỖI CHUNG ---
// 404 handler must be after all routes
app.use(notFoundHandler);

// Error handler must be last
app.use(errorHandler);

// --- KHỞI ĐỘNG SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log("✅ Available routes:");
  console.log("   • GET    /provinces");
  console.log("   • GET    /communes");
  console.log("   • POST   /convert");
  console.log("   • CRUD   /units");
  console.log("   • GET    /districts");
});
export default app;
