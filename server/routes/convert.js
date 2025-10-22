import { Router } from "express";
import { convertAddress } from "../controllers/convertController.js";

const router = Router();

// POST /convert
router.post("/", convertAddress);

// GET /convert → chỉ hướng dẫn
router.get("/", (req, res) => {
  res.json({
    message: "Dùng POST /convert với body JSON { address: '...' } để chuyển đổi địa chỉ từ MongoDB.",
    example: { address: "Tỉnh Hà Nội, Huyện Hoàn Kiếm, Xã Hàng Trống" }
  });
});

export default router;
