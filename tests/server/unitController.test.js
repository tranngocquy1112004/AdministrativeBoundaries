/**
 * ✅ Test toàn bộ UnitController CRUD + Restore bằng Jest + Supertest
 * 🧠 Không sửa code dự án, chỉ thao tác tạm thời trên file JSON
 */

import request from "supertest";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import app from "../../server.js"; // Express app
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";

const dataPath = path.join(process.cwd(), "data/full-address.json");

let backupJSON = "";

/** 🧱 Backup & setup JSON + kết nối Mongo thật */
beforeAll(async () => {
  // Backup file JSON gốc
  if (fs.existsSync(dataPath)) {
    backupJSON = fs.readFileSync(dataPath, "utf8");
  } else {
    fs.writeFileSync(dataPath, "[]", "utf8");
  }

  // Tạo tỉnh giả nếu chưa có
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8") || "[]");
  if (!data.some((p) => p.code === "VN001")) {
    data.push({
      code: "VN001",
      name: "Tỉnh Test",
      englishName: "Test Province",
      administrativeLevel: "Tỉnh",
      decree: "",
      level: "province",
      parentCode: null,
      communes: [],
    });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  }

  // 🔗 Kết nối tới MongoDB thật (database test riêng)
  await mongoose.connect("mongodb://127.0.0.1:27017/test_admin_boundaries", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Xóa dữ liệu cũ (nếu có)
  await Unit.deleteMany({});
  await UnitHistory.deleteMany({});
});

/** 🧹 Cleanup sau test */
afterAll(async () => {
  if (backupJSON) fs.writeFileSync(dataPath, backupJSON, "utf8");
  await mongoose.connection.dropDatabase(); // Xóa database test
  await mongoose.disconnect();
});

const testUnit = {
  name: "Phường Test",
  code: "TEST001",
  level: "commune",
  parentCode: "VN001",
  provinceCode: "VN001",
  provinceName: "Tỉnh Test",
  decree: "Nghị định test",
};

describe("🧩 UnitController CRUD + Restore", () => {
  // CREATE
  it("Tạo phường mới thành công", async () => {
    const res = await request(app).post("/units").send(testUnit);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/Thêm đơn vị hành chính thành công/);
  });

  it("Không cho tạo khi thiếu thông tin", async () => {
    const res = await request(app).post("/units").send({ name: "Thiếu code" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Thiếu thông tin bắt buộc/);
  });

  it("Không cho tạo khi không tìm thấy cha", async () => {
    const res = await request(app).post("/units").send({
      ...testUnit,
      code: "TEST002",
      parentCode: "INVALID_PARENT",
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị cha/);
  });

  // UPDATE
  it("Cập nhật phường thành công", async () => {
    const res = await request(app)
      .put(`/units/${testUnit.code}`)
      .send({ name: "Phường Test Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Cập nhật thành công/);
  });

  it("Không cập nhật khi mã không tồn tại", async () => {
    const res = await request(app)
      .put("/units/INVALID")
      .send({ name: "Không tồn tại" });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị/);
  });

  // DELETE
  it("Xóa đơn vị thành công và ghi lịch sử", async () => {
    const res = await request(app).delete(`/units/${testUnit.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Đã xóa và lưu lịch sử/);
  });

  // HISTORY
  it("Lấy lịch sử hoạt động", async () => {
    await UnitHistory.create({
      code: testUnit.code,
      action: "update",
      oldData: { name: "Cũ" },
      newData: { name: "Mới" },
      changedAt: new Date(),
    });

    const res = await request(app).get(`/units/${testUnit.code}/history`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("Không có lịch sử thì trả về 404", async () => {
    const res = await request(app).get("/units/INVALID/history");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không có lịch sử/);
  });

  // RESTORE
  it("Khôi phục từ lịch sử thành công", async () => {
    await UnitHistory.create({
      code: "REST001",
      action: "delete",
      oldData: null,
      newData: {
        code: "REST001",
        name: "Phường Restore",
        level: "commune",
        parentCode: "VN001",
        provinceCode: "VN001",
        provinceName: "Tỉnh Test",
      },
      changedAt: new Date(),
    });

    const res = await request(app)
      .post("/units/REST001/restore")
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Đã khôi phục thành công/);
  });

  it("Không tìm thấy bản ghi để khôi phục", async () => {
    const res = await request(app)
      .post("/units/INVALID/restore")
      .send({});
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy bản ghi để khôi phục/);
  });

  // GET BY ID
  it("Lấy chi tiết đơn vị theo mã", async () => {
    await Unit.create(testUnit);
    const res = await request(app).get(`/units/${testUnit.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(testUnit.code);
  });

  it("Không tìm thấy đơn vị theo mã", async () => {
    const res = await request(app).get("/units/INVALID");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị/);
  });
});
