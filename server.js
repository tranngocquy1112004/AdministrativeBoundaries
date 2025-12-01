import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./server/v1/utils/db.js";
// Import routes
import v1Routes from "./server/v1/index.js";
import v2ProvinceRoutes from "./server/v2/routes/provinces.js";
import v2CommuneRoutes from "./server/v2/routes/communes.js";
import { loadV2Cache } from "./server/v2/utils/loader.js";
import bridgeRoutes from "./server/bridge/index.js";
// Import error handlers
import { notFoundHandler, errorHandler } from "./server/v1/middleware/errorHandler.js";
// Load biến môi trường
dotenv.config();
// Kết nối MongoDB
connectDB();
// Khởi tạo Express
const app = express();
// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Đọc body JSON
app.use(express.urlencoded({ extended: true })); // Hỗ trợ form-urlencoded nếu cần

// --- ROUTES ---
app.get("/", (req, res) => {
  res.json({
    message: "🌏 Administrative Boundaries API running successfully!",
    endpoints: {
      v1: "/v1",
      v2: "/v2",
    },
  });
});

// Gắn router theo module
app.use("/v1", v1Routes);
// --- V2 ---
loadV2Cache();
app.use("/v2/provinces", v2ProvinceRoutes);
app.use("/v2/communes", v2CommuneRoutes);
app.use("/bridge", bridgeRoutes);
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
