/**
 * ✅ Test toàn bộ UnitController CRUD + Restore bằng Jest + Supertest cho 100% coverage
 * 🧠 Test cả MongoDB và JSON branches
 */
import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";

const dataPath = path.join(process.cwd(), "data/full-address.json");
const originalNodeEnv = process.env.NODE_ENV;
let backupJSON = "";
let backupJSON2 = "";

// Mock fs for error testing
const mockFs = {
  readFileSync: jest.spyOn(fs, 'readFileSync'),
  writeFileSync: jest.spyOn(fs, 'writeFileSync'),
  existsSync: jest.spyOn(fs, 'existsSync')
};

/** 🧱 Setup global */
beforeAll(async () => {
  // Backup file JSON gốc
  if (fs.existsSync(dataPath)) {
    backupJSON = fs.readFileSync(dataPath, "utf8");
  } else {
    fs.writeFileSync(dataPath, "[]", "utf8");
  }

  // Backup for JSON tests
  backupJSON2 = JSON.stringify([
    {
      code: "VN001",
      name: "Tỉnh Test",
      englishName: "Test Province",
      administrativeLevel: "Tỉnh",
      decree: "",
      level: "province",
      parentCode: null,
      communes: [
        {
          code: "CM001",
          name: "Xã Old",
          englishName: "Old Ward",
          administrativeLevel: "Xã",
          provinceCode: "VN001",
          provinceName: "Tỉnh Test",
          decree: "Old Decree",
          level: "commune",
          parentCode: "VN001"
        }
      ],
    }
  ], null, 2);

  fs.writeFileSync(dataPath, backupJSON2, "utf8");

  await Unit.deleteMany({});
  await UnitHistory.deleteMany({});
});

afterAll(async () => {
  process.env.NODE_ENV = originalNodeEnv;
  mockFs.readFileSync.mockRestore();
  mockFs.writeFileSync.mockRestore();
  mockFs.existsSync.mockRestore();
  fs.writeFileSync(dataPath, backupJSON, "utf8");
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Unit.deleteMany({});
  await UnitHistory.deleteMany({});
});

const testUnit = {
  name: "Phường Test",
  code: "TEST001",
  level: "commune",
  parentCode: "VN001",
  provinceCode: "VN001",
  provinceName: "Tỉnh Test",
  decree: "Nghị định test",
  englishName: "Test Ward",
  administrativeLevel: "Phường"
};

describe("🧩 UnitController - MongoDB Branch (NODE_ENV=test)", () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  // CREATE
  it("Tạo đơn vị trong MongoDB (test env)", async () => {
    // Create parent first
    const parentUnit = {
      name: "Tỉnh Test",
      code: "VN001_TEST",
      level: "province",
      englishName: "Test Province",
      administrativeLevel: "Tỉnh"
    };

    const parentRes = await request(app).post("/units").send(parentUnit);
    expect(parentRes.statusCode).toBe(201);

    // Create commune
    const res = await request(app).post("/units").send({
      ...testUnit,
      code: "TEST001_MONGO",
      parentCode: "VN001_TEST"
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/Tạo thành công/);
  });

  it("Không cho tạo khi mã trùng (MongoDB)", async () => {
    // Create first
    await Unit.create(testUnit);

    const res = await request(app).post("/units").send(testUnit);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Mã đơn vị đã tồn tại/);
  });

  it("Không cho tạo khi không tìm thấy cha (MongoDB)", async () => {
    const res = await request(app).post("/units").send({
      ...testUnit,
      parentCode: "INVALID"
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị cha/);
  });

  // UPDATE
  it("Cập nhật trong MongoDB (test env)", async () => {
    await Unit.create({ ...testUnit, code: "UPDATE_TEST" });

    const res = await request(app)
      .put("/units/UPDATE_TEST")
      .send({ name: "Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Cập nhật thành công/);
  });

  it("Không cập nhật khi không tồn tại (MongoDB)", async () => {
    const res = await request(app)
      .put("/units/NOT_EXIST")
      .send({ name: "Test" });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị/);
  });

  // DELETE
  it("Xóa trong MongoDB (test env)", async () => {
    await Unit.create({ ...testUnit, code: "DELETE_TEST" });

    const res = await request(app).delete("/units/DELETE_TEST");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Xóa thành công/);
  });

  it("Không tìm thấy đơn vị để xóa (MongoDB)", async () => {
    const res = await request(app).delete("/units/NOT_EXIST");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị cần xóa/);
  });
});

describe("🧩 UnitController - JSON Branch", () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    // Set NODE_ENV to non-test to use JSON
    process.env.NODE_ENV = 'development';
    // Ensure JSON file has data
    fs.writeFileSync(dataPath, backupJSON2, "utf8");
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  // CREATE JSON
  it("Tạo đơn vị trong JSON", async () => {
    const newUnit = {
      name: "Xã Mới",
      code: "JSON001",
      level: "commune",
      parentCode: "VN001",
      provinceCode: "VN001",
      provinceName: "Tỉnh Test",
      decree: "Decree",
      englishName: "New Comm",
      administrativeLevel: "Xã"
    };

    const res = await request(app).post("/units").send(newUnit);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/Thêm đơn vị hành chính thành công/);
  });

  it("Không cho tạo khi mã trùng trong JSON", async () => {
    const res = await request(app).post("/units").send({
      ...testUnit,
      code: "VN001" // Already exists
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Mã đơn vị đã tồn tại/);
  });

  it("Không cho tạo khi thiếu thông tin bắt buộc", async () => {
    const res = await request(app).post("/units").send({ name: "Thiếu code" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Thiếu thông tin bắt buộc/);
  });

  // UPDATE JSON
  it("Cập nhật trong JSON", async () => {
    const res = await request(app)
      .put("/units/CM001")
      .send({ name: "Xã Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Cập nhật thành công/);
  });

  it("Không tìm thấy đơn vị để cập nhật trong JSON", async () => {
    const res = await request(app)
      .put("/units/NOT_EXIST")
      .send({ name: "Test" });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị trong JSON/);
  });

  // DELETE JSON
  it("Xóa trong JSON", async () => {
    const res = await request(app).delete("/units/CM001");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Đã xóa và lưu lịch sử/);
  });

  // GET BY ID JSON
  it("Tìm trong JSON khi không có trong MongoDB", async () => {
    const res = await request(app).get("/units/VN001");
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe("VN001");
  });

  it("Không tìm thấy trong JSON", async () => {
    const res = await request(app).get("/units/NOT_IN_JSON");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy đơn vị hành chính/);
  });
});

describe("🧩 UnitController - Error Handling & Helpers", () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("Helper readJSON - lỗi đọc file", async () => {
    mockFs.readFileSync.mockImplementationOnce(() => {
      throw new Error("File read error");
    });

    const res = await request(app).get("/units/VN001");
    expect(res.statusCode).toBe(404);

    mockFs.readFileSync.mockRestore();
  });

  it("Helper writeJSON - lỗi ghi file", async () => {
    // Mock console.error to verify error logging
    const originalConsoleError = console.error;
    const mockConsoleError = jest.fn();
    console.error = mockConsoleError;

    // Ensure NODE_ENV triggers JSON write
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Mock fs.writeFileSync to fail
    const originalWriteFileSync = fs.writeFileSync;
    fs.writeFileSync = jest.fn(() => {
      throw new Error("File write error");
    });

    // Create province to trigger JSON write
    const res = await request(app).post("/units").send({
      name: "Error Province",
      code: "ERROR002",
      level: "province"
    });
    expect(res.statusCode).toBe(201); // Function handles error internally, completes successfully
    expect(res.body.message).toMatch(/Thêm đơn vị hành chính thành công/);

    // Verify error was logged
    expect(mockConsoleError).toHaveBeenCalledWith("❌ Lỗi ghi file JSON:", expect.any(Error));

    // Restore
    console.error = originalConsoleError;
    fs.writeFileSync = originalWriteFileSync;
    process.env.NODE_ENV = originalEnv;
  });

  it("Lỗi database trong createUnit JSON", async () => {
    // Ensure NODE_ENV is development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Mock mongoose create to fail
    const mockCreate = jest.spyOn(Unit, 'create').mockRejectedValueOnce(new Error("DB Error"));

    const res = await request(app).post("/units").send({
      name: "Fail Unit",
      code: "FAIL001",
      level: "province"
    });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Internal Server Error");

    mockCreate.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});

// HISTORY and RESTORE - shared
describe("🧩 UnitController - History & Restore", () => {
  // HISTORY
  it("Lấy lịch sử hoạt động", async () => {
    await UnitHistory.create({
      code: "HIST001",
      action: "update",
      oldData: { name: "Cũ" },
      newData: { name: "Mới" },
      changedAt: new Date(),
    });

    const res = await request(app).get("/units/HIST001/history");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("Không có lịch sử thì trả về 404", async () => {
    const res = await request(app).get("/units/NO_HISTORY/history");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không có lịch sử/);
  });

  // RESTORE
  it("Khôi phục từ lịch sử thành công", async () => {
    await UnitHistory.create({
      code: "RESTORE001",
      action: "delete",
      oldData: null,
      newData: {
        code: "RESTORE001",
        name: "Phường Restore",
        level: "commune",
        parentCode: "VN001",
        provinceCode: "VN001",
        provinceName: "Tỉnh Test",
      },
      changedAt: new Date(),
    });

    const res = await request(app)
      .post("/units/RESTORE001/restore")
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Đã khôi phục thành công/);
  });

  it("Không tìm thấy bản ghi để khôi phục", async () => {
    const res = await request(app)
      .post("/units/NO_RECORD/restore")
      .send({});
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy bản ghi để khôi phục/);
  });

  it("Không có dữ liệu để khôi phục", async () => {
    await UnitHistory.create({
      code: "EMPTY001",
      action: "delete",
      oldData: null,
      newData: null,
      changedAt: new Date(),
    });

    const res = await request(app)
      .post("/units/EMPTY001/restore")
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Không có dữ liệu để khôi phục/);
  });
});
