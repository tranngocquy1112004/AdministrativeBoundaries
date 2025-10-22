import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { logInfo, logError } from "../utils/logger.js";

dotenv.config();
const API_BASE = process.env.API_BASE || "https://production.cas.so/address-kit";
const EFFECTIVE_DATE = process.env.EFFECTIVE_DATE || "latest";
const DATA_PATH = path.resolve("data/full-address.json");

// Lấy danh sách tỉnh
async function fetchProvinces() {
  const url = `${API_BASE}/${EFFECTIVE_DATE}/provinces`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lỗi fetch provinces: ${res.status}`);
  const data = await res.json();
  logInfo(`✅ Lấy ${data.provinces.length} tỉnh/thành`);
  return data.provinces;
}

// Lấy xã theo từng tỉnh
async function fetchCommunesByProvince(provinceCode) {
  const url = `${API_BASE}/${EFFECTIVE_DATE}/provinces/${provinceCode}/communes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lỗi fetch communes của tỉnh ${provinceCode}`);
  const data = await res.json();
  return data.communes || [];
}

// Hàm chính để fetch toàn bộ dữ liệu hành chính
export async function fetchAllData() {
  try {
    logInfo("🔁 Bắt đầu tải dữ liệu hành chính...");
    const provinces = await fetchProvinces();

    const allData = [];
    for (const province of provinces) {
      const communes = await fetchCommunesByProvince(province.code);
      allData.push({ ...province, communes });
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(allData, null, 2), "utf8");
    logInfo(`💾 Đã lưu dữ liệu vào ${DATA_PATH}`);
  } catch (err) {
    logError("❌ Lỗi khi fetch dữ liệu:", err.message);
  }
}

// Nếu chạy trực tiếp: node fetcher/index.js
if (process.argv[1].includes("index.js")) {
  fetchAllData();
}
