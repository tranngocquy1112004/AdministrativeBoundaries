import { Router } from "express";
import { convertAddress } from "../controllers/convertController.js";

const router = Router();

// POST /convert
router.post("/", convertAddress);

// Optional: hướng dẫn khi truy cập GET
router.get("/", (req, res) => {
  res.json({
    message: "Dùng POST /convert với body JSON { address: '...' } để chuyển đổi địa chỉ 3 cấp sang 2 cấp.",
    example: { address: "Tỉnh Hà Nội, Huyện Hoàn Kiếm, Xã Hàng Trống" }
  });
});

export default router;
