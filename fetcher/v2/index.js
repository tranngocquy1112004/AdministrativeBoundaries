import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { logInfo, logError } from "../../server/v1/utils/logger.js";

dotenv.config();

const API_URL = "https://provinces.open-api.vn/api/v2/?depth=2";
const OUTPUT_PATH = path.resolve("data/full-address-v2.json");

async function fetchV2() {
  try {
    logInfo("🔁 Đang tải dữ liệu V2 (2 cấp) từ provinces.open-api.vn...");
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), "utf8");
    logInfo(`💾 Đã lưu vào ${OUTPUT_PATH} (tổng ${data.length} tỉnh/thành)`);
  } catch (err) {
    logError(`❌ Lỗi fetch V2: ${err.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].includes("index.js")) {
  fetchV2();
}

export default fetchV2;


