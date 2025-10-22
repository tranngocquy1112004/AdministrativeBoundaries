import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Unit from "../models/Unit.js";  

dotenv.config();

const MONGO = process.env.MONGODB_URI;
if (!MONGO) {
  console.error("Please set MONGODB_URI in .env");
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to Mongo");

    // đường dẫn tới file JSON hiện tại
    const dataPath = path.resolve("server/data/units.json");
    if (!fs.existsSync(dataPath)) {
      console.error("units.json not found at", dataPath);
      process.exit(1);
    }

    const raw = fs.readFileSync(dataPath, "utf8");
    const items = JSON.parse(raw);

    if (!Array.isArray(items)) {
      console.error("units.json should be an array");
      process.exit(1);
    }

    console.log(`Found ${items.length} units in JSON`);

    // Option: xóa collection cũ (uncomment nếu muốn)
    // await Unit.deleteMany({});
    // console.log("Deleted existing units");

    // upsert theo code để tránh duplicate
    let inserted = 0, updated = 0;
    for (const item of items) {
      const filter = { code: item.code };
      const doc = {
        name: item.name,
        code: item.code,
        level: item.level,
        parentCode: item.parentCode || null,
        boundary: item.boundary || null,
        history: item.history || []
      };
      const res = await Unit.findOneAndUpdate(filter, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
      if (res) updated++;
      else inserted++;
    }

    console.log("Import done. updated:", updated, "inserted:", inserted);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();