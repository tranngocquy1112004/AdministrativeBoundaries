import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  schemaVersion: {
    type: String,
    enum: ["v1", "v2"],
    default: "v1",
    index: true,
  },
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

// Composite index to optimize cascading queries
unitSchema.index({ schemaVersion: 1, level: 1, parentCode: 1 });

export default mongoose.model("Unit", unitSchema);