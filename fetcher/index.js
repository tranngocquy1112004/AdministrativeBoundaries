import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { logInfo, logError } from "../utils/logger.js";

dotenv.config();

const API_URL = "https://provinces.open-api.vn/api/v1/?depth=3";
const DATA_PATH = path.resolve("data/full-address.json");

export async function fetchAllData() {
  try {
    logInfo("🔁 Đang tải toàn bộ dữ liệu hành chính 3 cấp (phiên bản cũ trước 07/2025)...");

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Lỗi fetch API: ${res.status}`);

    const data = await res.json();
    logInfo(`✅ Lấy thành công ${data.length} tỉnh/thành`);

    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
    logInfo(`💾 Đã lưu dữ liệu đầy đủ vào ${DATA_PATH}`);
  } catch (err) {
    logError("❌ Lỗi khi tải dữ liệu:", err.message);
  }
}

if (process.argv[1].includes("index.js")) {
  fetchAllData();
}
