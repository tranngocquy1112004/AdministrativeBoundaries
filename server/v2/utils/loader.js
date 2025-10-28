import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve("data/full-address-v2.json");

let cache = {
  provinces: [],
  wardsByProvince: new Map(),
  wardByCode: new Map(),
};

export function loadV2Cache() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(raw);

  const provinces = [];
  const wardsByProvince = new Map();
  const wardByCode = new Map();

  for (const p of data) {
    const provinceCode = String(p.code);
    provinces.push({ code: provinceCode, name: p.name });
    const wards = Array.isArray(p.wards) ? p.wards : [];
    const wardItems = wards.map((w) => ({ code: String(w.code), name: w.name, provinceCode }));
    wardsByProvince.set(provinceCode, wardItems);
    for (const w of wardItems) wardByCode.set(w.code, w);
  }

  cache = { provinces, wardsByProvince, wardByCode };
  return cache;
}

export function getV2Provinces() {
  return cache.provinces;
}

export function getV2ProvinceByCode(provinceCode) {
  return cache.provinces.find((p) => p.code === String(provinceCode));
}

export function getV2WardsByProvince(provinceCode) {
  return cache.wardsByProvince.get(String(provinceCode)) || [];
}

export function getV2WardByCode(wardCode) {
  return cache.wardByCode.get(String(wardCode)) || null;
}


