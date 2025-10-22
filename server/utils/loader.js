import fs from "fs";

export function loadData() {
  const raw = fs.readFileSync("./data/full-address.json", "utf8");
  return JSON.parse(raw);
}
