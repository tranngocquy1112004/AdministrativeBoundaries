import mongoose from "mongoose";

const communeSchema = new mongoose.Schema({
  code: String,
  name: String,
  englishName: String,
  administrativeLevel: String,
  provinceCode: String,
  provinceName: String,
  decree: String
});

const provinceSchema = new mongoose.Schema({
  code: String,
  name: String,
  englishName: String,
  administrativeLevel: String,
  decree: String,
  communes: [communeSchema]
});

export default mongoose.model("Address", provinceSchema);
