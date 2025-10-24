// tests/server/communes.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("🏘️ Communes API Tests", () => {
  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
  });

  describe("GET /communes", () => {
    test("should return all communes from MongoDB when data exists", async () => {
      // Arrange: Insert test data
      const testData = [
        {
          name: "Thành phố Hà Nội",
          code: "01",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận Hoàn Kiếm",
          code: "01001",
          level: "district",
          parentCode: "01",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Hàng Trống",
          code: "01001001",
          level: "commune",
          parentCode: "01001",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Lý Thái Tổ",
          code: "01001002",
          level: "commune",
          parentCode: "01001",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/communes");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every(item => item.level === "commune")).toBe(true);
    });

    test("should return communes from JSON fallback when MongoDB is empty", async () => {
      // Arrange: Ensure MongoDB is empty
      await Unit.deleteMany({});

      // Act
      const response = await request(app).get("/communes");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("should handle MongoDB connection error gracefully", async () => {
      // Arrange: Mock MongoDB error
      const originalFind = Unit.find;
      Unit.find = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockRejectedValue(new Error("MongoDB connection failed"))
      }));

      // Act
      const response = await request(app).get("/communes");

      // Assert - Should fallback to JSON
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Restore original function
      Unit.find = originalFind;
    });
  });

  describe("GET /communes/:provinceID", () => {
    beforeEach(async () => {
      // Setup test data with hierarchical structure
      const testData = [
        {
          name: "Thành phố Hà Nội",
          code: "01",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Tỉnh Hồ Chí Minh",
          code: "79",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận Hoàn Kiếm",
          code: "01001",
          level: "district",
          parentCode: "01",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận Ba Đình",
          code: "01002",
          level: "district",
          parentCode: "01",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận 1",
          code: "79001",
          level: "district",
          parentCode: "79",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Hàng Trống",
          code: "01001001",
          level: "commune",
          parentCode: "01001",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Lý Thái Tổ",
          code: "01001002",
          level: "commune",
          parentCode: "01001",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Phúc Xá",
          code: "01002001",
          level: "commune",
          parentCode: "01002",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Bến Nghé",
          code: "79001001",
          level: "commune",
          parentCode: "79001",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);
    });

    test("should return communes for specific province", async () => {
      // Act
      const response = await request(app).get("/communes/01");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3); // 3 communes in Hanoi
      expect(response.body.every(item => item.level === "commune")).toBe(true);
      expect(response.body.every(item => 
        item.parentCode === "01001" || item.parentCode === "01002"
      )).toBe(true);
    });

    test("should return 404 for province with no communes", async () => {
      // Act
      const response = await request(app).get("/communes/99");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Province or commune not found");
    });

    test("should return 404 for invalid province ID format", async () => {
      // Act
      const response = await request(app).get("/communes/invalid-id");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Province or commune not found");
    });

    test("should return communes from JSON fallback when MongoDB fails", async () => {
      // Arrange: Mock MongoDB error
      const originalFind = Unit.find;
      Unit.find = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockRejectedValue(new Error("MongoDB error"))
      }));

      // Act
      const response = await request(app).get("/communes/01");

      // Assert - Should fallback to JSON
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Restore original function
      Unit.find = originalFind;
    });
  });

  describe("Data Structure Validation", () => {
    test("should return communes with correct structure", async () => {
      // Arrange
      const testCommune = {
        name: "Phường Hàng Trống",
        code: "01001001",
        level: "commune",
        parentCode: "01001",
        provinceCode: "01",
        provinceName: "Thành phố Hà Nội",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testCommune);

      // Act
      const response = await request(app).get("/communes");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0]).toMatchObject({
        name: "Phường Hàng Trống",
        code: "01001001",
        level: "commune"
      });
    });

    test("should filter out non-commune level data", async () => {
      // Arrange: Insert mixed level data
      const mixedData = [
        {
          name: "Thành phố Hà Nội",
          code: "01",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận Hoàn Kiếm",
          code: "01001",
          level: "district",
          parentCode: "01",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Hàng Trống",
          code: "01001001",
          level: "commune",
          parentCode: "01001",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(mixedData);

      // Act
      const response = await request(app).get("/communes");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].level).toBe("commune");
    });
  });

  describe("Performance Tests", () => {
    test("should handle large number of communes efficiently", async () => {
      // Arrange: Create many communes
      const communes = [];
      for (let i = 1; i <= 1000; i++) {
        communes.push({
          name: `Phường Test ${i}`,
          code: `0100100${i.toString().padStart(3, '0')}`,
          level: "commune",
          parentCode: "01001",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      await Unit.insertMany(communes);

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/communes");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("POST /communes - Create Commune", () => {
    test("should create new commune with code in body", async () => {
      // Arrange
      const newCommuneData = {
        name: "Phường Test Mới",
        code: "01001099",
        level: "commune",
        parentCode: "01001",
        englishName: "Test Ward",
        administrativeLevel: "Phường"
      };

      // Act
      const response = await request(app)
        .post("/communes")
        .send(newCommuneData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: "Phường Test Mới",
        code: "01001099",
        level: "commune",
        parentCode: "01001"
      });

      // Verify in database
      const createdCommune = await Unit.findOne({ code: "01001099" });
      expect(createdCommune).toBeTruthy();
      expect(createdCommune.name).toBe("Phường Test Mới");
    });

    test("should reject creating commune with existing code", async () => {
      // Arrange: Create existing commune
      const existingCommune = {
        name: "Phường Đã Tồn Tại",
        code: "01001099",
        level: "commune",
        parentCode: "01001",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(existingCommune);

      const newCommuneData = {
        name: "Phường Test Mới",
        code: "01001099",
        level: "commune",
        parentCode: "01001"
      };

      // Act
      const response = await request(app)
        .post("/communes")
        .send(newCommuneData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Commune already exists");
      expect(response.body.existingCommune).toBeTruthy();
    });

    test("should handle missing required fields", async () => {
      // Arrange
      const incompleteData = {
        name: "Phường Test",
        // Missing code field
        level: "commune"
      };

      // Act
      const response = await request(app)
        .post("/communes")
        .send(incompleteData);

      // Assert - Should create with undefined code (current behavior)
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBeUndefined();
    });
  });

  describe("PUT /communes/:communeCode - Create Commune with Code in URL", () => {
    test("should create new commune with code in URL parameter", async () => {
      // Arrange
      const newCommuneData = {
        name: "Phường Test URL",
        level: "commune",
        parentCode: "01001",
        englishName: "Test Ward URL"
      };

      // Act
      const response = await request(app)
        .put("/communes/01001100")
        .send(newCommuneData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: "Phường Test URL",
        code: "01001100",
        level: "commune",
        parentCode: "01001"
      });

      // Verify in database
      const createdCommune = await Unit.findOne({ code: "01001100" });
      expect(createdCommune).toBeTruthy();
      expect(createdCommune.name).toBe("Phường Test URL");
    });

    test("should reject creating commune with existing code in URL", async () => {
      // Arrange: Create existing commune
      const existingCommune = {
        name: "Phường Đã Tồn Tại URL",
        code: "01001100",
        level: "commune",
        parentCode: "01001",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(existingCommune);

      const newCommuneData = {
        name: "Phường Test Mới URL",
        level: "commune",
        parentCode: "01001"
      };

      // Act
      const response = await request(app)
        .put("/communes/01001100")
        .send(newCommuneData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Commune already exists");
    });
  });

  describe("POST /communes/:communeCode - Update Commune", () => {
    beforeEach(async () => {
      // Setup test commune for updates
      const testCommune = {
        name: "Phường Cần Cập Nhật",
        code: "01001200",
        level: "commune",
        parentCode: "01001",
        englishName: "Old English Name",
        administrativeLevel: "Phường",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testCommune);
    });

    test("should update existing commune", async () => {
      // Arrange
      const updateData = {
        name: "Phường Đã Cập Nhật",
        englishName: "Updated English Name",
        administrativeLevel: "Xã"
      };

      // Act
      const response = await request(app)
        .post("/communes/01001200")
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: "Phường Đã Cập Nhật",
        code: "01001200",
        englishName: "Updated English Name",
        administrativeLevel: "Xã"
      });

      // Verify in database
      const updatedCommune = await Unit.findOne({ code: "01001200" });
      expect(updatedCommune.name).toBe("Phường Đã Cập Nhật");
      expect(updatedCommune.englishName).toBe("Updated English Name");
    });

    test("should return 404 for non-existent commune", async () => {
      // Arrange
      const updateData = {
        name: "Phường Không Tồn Tại"
      };

      // Act
      const response = await request(app)
        .post("/communes/99999999")
        .send(updateData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Commune not found");
    });
  });

  describe("DELETE /communes/:communeCode - Delete Commune", () => {
    beforeEach(async () => {
      // Setup test commune for deletion
      const testCommune = {
        name: "Phường Cần Xóa",
        code: "01001300",
        level: "commune",
        parentCode: "01001",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testCommune);
    });

    test("should soft delete existing commune and save to history.json", async () => {
      // Act
      const response = await request(app)
        .delete("/communes/01001300");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully from all sources");

      // Verify soft delete in database
      const deletedCommune = await Unit.findOne({ code: "01001300" });
      expect(deletedCommune).toBeTruthy();
      expect(deletedCommune.isDeleted).toBe(true);
      expect(deletedCommune.deletedAt).toBeTruthy();

      // Verify history.json was created/updated
      const historyPath = path.join(__dirname, '../../data/history.json');
      const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      expect(historyData).toBeInstanceOf(Array);
      expect(historyData.length).toBeGreaterThan(0);
      
      const deletedEntry = historyData.find(entry => entry.data.code === "01001300");
      expect(deletedEntry).toBeTruthy();
      expect(deletedEntry.action).toBe("deleted");
      expect(deletedEntry.data.name).toBe("Phường Cần Xóa");
    });

    test("should return 404 for non-existent commune", async () => {
      // Act
      const response = await request(app)
        .delete("/communes/99999999");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Commune not found");
    });
  });

  describe("GET /communes/history - Get History Communes", () => {
    beforeEach(async () => {
      // Clear UnitHistory collection before each test
      const UnitHistory = (await import("../../server/models/UnitHistory.js")).default;
      await UnitHistory.deleteMany({});
    });

    test("should return history entries from unit_histories collection", async () => {
      // Arrange: Create some test history data in unit_histories
      const UnitHistory = (await import("../../server/models/UnitHistory.js")).default;
      const testHistory1 = new UnitHistory({
        code: "01002000",
        action: "delete",
        oldData: { name: "Phường Test History 1" },
        newData: null,
        deleted: true,
        changedAt: new Date(),
        changedBy: "system"
      });
      const testHistory2 = new UnitHistory({
        code: "01002001",
        action: "delete",
        oldData: { name: "Phường Test History 2" },
        newData: null,
        deleted: true,
        changedAt: new Date(),
        changedBy: "system"
      });
      await testHistory1.save();
      await testHistory2.save();

      // Act
      const response = await request(app)
        .get("/communes/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.historyEntries).toHaveLength(2);
      
      const entry1 = response.body.historyEntries.find(e => e.code === "01002000");
      const entry2 = response.body.historyEntries.find(e => e.code === "01002001");
      
      expect(entry1).toBeTruthy();
      expect(entry1.action).toBe("delete");
      expect(entry2).toBeTruthy();
      expect(entry2.action).toBe("delete");
    });

    test("should return empty array when no history exists", async () => {
      // Act
      const response = await request(app)
        .get("/communes/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.historyEntries).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle JSON file not found", async () => {
      // Arrange: Mock fs.readFileSync to throw error
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error("File not found");
      });

      // Act
      const response = await request(app).get("/communes");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    test("should handle malformed JSON data", async () => {
      // Arrange: Mock fs.readFileSync to return invalid JSON
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockReturnValue("invalid json");

      // Act
      const response = await request(app).get("/communes");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });
  });
});

