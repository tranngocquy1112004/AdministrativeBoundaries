import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  name: String,
  code: String,
  level: String,
  parentCode: String,
  boundary: Object,
  createdAt: Date,
  updatedAt: Date,
  history: Array
});

export default mongoose.model("Unit", unitSchema);
