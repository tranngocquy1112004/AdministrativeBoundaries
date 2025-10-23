import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  englishName: String,
  administrativeLevel: String,
  provinceCode: String,
  provinceName: String,
  decree: String,
  level: {
    type: String,
    enum: ["province", "district", "commune"],
    required: true
  },
  parentCode: String,
  boundary: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  history: Array
});

export default mongoose.model("Address", addressSchema);
