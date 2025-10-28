import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  name: String,
  code: String, // ⚠️ không còn unique nữa
  englishName: String,
  administrativeLevel: String,
  provinceCode: String,
  provinceName: String,
  decree: String,
  level: {
    type: String,
    enum: ["province", "district", "commune"],
    required: true,
  },
  parentCode: String,
  boundary: Object,
  uniqueKey: { type: String, unique: true }, // ✅ thêm dòng này
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  history: Array,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
});

export default mongoose.model("Unit", unitSchema);