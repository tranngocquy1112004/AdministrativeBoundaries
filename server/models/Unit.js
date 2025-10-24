import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  englishName: String,
  administrativeLevel: String,
  provinceCode: String,
  provinceName: String,
  decree: String,
  level: String,
  parentCode: String,
  boundary: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  history: Array,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
});

export default mongoose.model("Unit", unitSchema);
