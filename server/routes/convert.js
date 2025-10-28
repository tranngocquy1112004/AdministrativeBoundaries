import { Router } from "express";
import { convertAddress } from "../controllers/convertController.js";

const router = Router();

/**
 * @route   POST /api/v1/convert
 * @desc    Chuyển đổi địa chỉ thành mã hành chính (ưu tiên MongoDB, fallback JSON)
 * @body    { "address": "Phường Bến Nghé, Quận 1, TP Hồ Chí Minh" }
 */
router.post("/", convertAddress);

/**
 * @route   GET /api/v1/convert
 * @desc    Hiển thị hướng dẫn sử dụng endpoint
 */
router.get("/", (req, res) => {
  res.json({
    message: "📮 POST /api/v1/convert — dùng để chuyển đổi địa chỉ hành chính (MongoDB + JSON fallback).",
    usage: "Gửi địa chỉ 2-3 cấp (VD: 'Phường Bến Nghé, Quận 1, TP Hồ Chí Minh') trong body JSON.",
    example: { address: "Xã Hàng Trống, Quận Hoàn Kiếm, Thành phố Hà Nội" },
  });
});

export default router;
