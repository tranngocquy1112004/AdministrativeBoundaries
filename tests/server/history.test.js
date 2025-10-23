// tests/server/history.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";

describe("📜 History API Tests", () => {
  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
  });

  describe("GET /units/:code/history", () => {
    test("should return history for existing unit", async () => {
      // Arrange: Create unit and history records
      const testUnit = {
        name: "Test Unit",
        code: "99",
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testUnit);

      const historyRecords = [
        {
          code: "99",
          action: "create",
          oldData: null,
          newData: { name: "Test Unit", code: "99" },
          changedAt: new Date(Date.now() - 2000),
          changedBy: "system"
        },
        {
          code: "99",
          action: "update",
          oldData: { name: "Test Unit" },
          newData: { name: "Updated Unit" },
          changedAt: new Date(Date.now() - 1000),
          changedBy: "system"
        }
      ];
      await UnitHistory.insertMany(historyRecords);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty("action");
      expect(response.body[0]).toHaveProperty("changedAt");
      expect(response.body[0]).toHaveProperty("changedBy");
      expect(response.body[0].action).toBe("update"); // Most recent first
      expect(response.body[1].action).toBe("create");
    });

    test("should return history sorted by changedAt descending", async () => {
      // Arrange: Create history records with different timestamps
      const historyRecords = [
        {
          code: "99",
          action: "create",
          oldData: null,
          newData: { name: "Test Unit" },
          changedAt: new Date(Date.now() - 3000),
          changedBy: "system"
        },
        {
          code: "99",
          action: "update",
          oldData: { name: "Test Unit" },
          newData: { name: "Updated Unit" },
          changedAt: new Date(Date.now() - 1000),
          changedBy: "system"
        },
        {
          code: "99",
          action: "delete",
          oldData: { name: "Updated Unit" },
          newData: null,
          changedAt: new Date(Date.now() - 2000),
          changedBy: "system"
        }
      ];
      await UnitHistory.insertMany(historyRecords);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      expect(response.body[0].action).toBe("update"); // Most recent
      expect(response.body[1].action).toBe("delete");
      expect(response.body[2].action).toBe("create"); // Oldest
    });

    test("should return 404 for unit with no history", async () => {
      // Act
      const response = await request(app).get("/units/99999/history");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Không có lịch sử cho mã này");
    });

    test("should return empty array for unit with no history records", async () => {
      // Arrange: Create unit but no history
      const testUnit = {
        name: "Test Unit",
        code: "99",
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testUnit);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Không có lịch sử cho mã này");
    });

    test("should handle invalid unit code format", async () => {
      // Act
      const response = await request(app).get("/units/invalid-code/history");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Không có lịch sử cho mã này");
    });

    test("should return history with all required fields", async () => {
      // Arrange: Create comprehensive history record
      const historyRecord = {
        code: "99",
        action: "update",
        oldData: { 
          name: "Old Name", 
          level: "province",
          parentCode: null 
        },
        newData: { 
          name: "New Name", 
          level: "province",
          parentCode: null,
          englishName: "New English Name"
        },
        deleted: false,
        changedAt: new Date(),
        changedBy: "admin"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty("code");
      expect(response.body[0]).toHaveProperty("action");
      expect(response.body[0]).toHaveProperty("oldData");
      expect(response.body[0]).toHaveProperty("newData");
      expect(response.body[0]).toHaveProperty("deleted");
      expect(response.body[0]).toHaveProperty("changedAt");
      expect(response.body[0]).toHaveProperty("changedBy");
    });
  });

  describe("POST /units/:code/restore", () => {
    test("should restore unit from most recent history", async () => {
      // Arrange: Create history record
      const historyRecord = {
        code: "99",
        action: "delete",
        oldData: { 
          name: "Deleted Unit", 
          code: "99", 
          level: "province",
          parentCode: null 
        },
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app)
        .post("/units/99/restore")
        .send({});

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain("khôi phục thành công");
      expect(response.body.restored).toMatchObject({
        name: "Deleted Unit",
        code: "99",
        level: "province"
      });

      // Verify unit is restored in database
      const restoredUnit = await Unit.findOne({ code: "99" });
      expect(restoredUnit).toBeTruthy();
      expect(restoredUnit.name).toBe("Deleted Unit");

      // Verify restore history was created
      const restoreHistory = await UnitHistory.findOne({ 
        code: "99", 
        action: "restore" 
      });
      expect(restoreHistory).toBeTruthy();
    });

    test("should restore unit from specific version", async () => {
      // Arrange: Create multiple history records
      const historyRecords = [
        {
          code: "99",
          action: "create",
          oldData: null,
          newData: { name: "Version 1", code: "99", level: "province" },
          changedAt: new Date(Date.now() - 3000),
          changedBy: "system"
        },
        {
          code: "99",
          action: "update",
          oldData: { name: "Version 1" },
          newData: { name: "Version 2", code: "99", level: "province" },
          changedAt: new Date(Date.now() - 2000),
          changedBy: "system"
        },
        {
          code: "99",
          action: "update",
          oldData: { name: "Version 2" },
          newData: { name: "Version 3", code: "99", level: "province" },
          changedAt: new Date(Date.now() - 1000),
          changedBy: "system"
        }
      ];
      await UnitHistory.insertMany(historyRecords);
      const firstRecord = await UnitHistory.findOne({ 
        code: "99", 
        action: "create" 
      });

      // Act
      const response = await request(app)
        .post("/units/99/restore")
        .send({ version: firstRecord._id });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.restored.name).toBe("Version 1");
    });

    test("should return 404 for non-existent history record", async () => {
      // Act
      const response = await request(app)
        .post("/units/99999/restore")
        .send({});

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Không tìm thấy bản ghi để khôi phục");
    });

    test("should return 400 for history record with no data to restore", async () => {
      // Arrange: Create history record with no data
      const historyRecord = {
        code: "99",
        action: "create",
        oldData: null,
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app)
        .post("/units/99/restore")
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Không có dữ liệu để khôi phục");
    });

    test("should handle restore with invalid version ID", async () => {
      // Act
      const response = await request(app)
        .post("/units/99/restore")
        .send({ version: "invalid-id" });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Không tìm thấy bản ghi để khôi phục");
    });

    test("should restore commune unit correctly", async () => {
      // Arrange: Create commune history record
      const historyRecord = {
        code: "99001",
        action: "delete",
        oldData: { 
          name: "Deleted Commune", 
          code: "99001", 
          level: "commune",
          parentCode: "99",
          provinceCode: "99",
          provinceName: "Test Province"
        },
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app)
        .post("/units/99001/restore")
        .send({});

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.restored).toMatchObject({
        name: "Deleted Commune",
        code: "99001",
        level: "commune"
      });

      // Verify unit is restored in database
      const restoredUnit = await Unit.findOne({ code: "99001" });
      expect(restoredUnit).toBeTruthy();
      expect(restoredUnit.name).toBe("Deleted Commune");
    });
  });

  describe("Error Handling", () => {
    test("should handle MongoDB connection error for history query", async () => {
      // Arrange: Mock MongoDB error
      const originalFind = UnitHistory.find;
      UnitHistory.find = jest.fn().mockRejectedValue(new Error("MongoDB connection failed"));

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      UnitHistory.find = originalFind;
    });

    test("should handle MongoDB connection error for restore", async () => {
      // Arrange: Create history record
      const historyRecord = {
        code: "99",
        action: "delete",
        oldData: { name: "Deleted Unit", code: "99" },
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Mock MongoDB error
      const originalFindOneAndUpdate = Unit.findOneAndUpdate;
      Unit.findOneAndUpdate = jest.fn().mockRejectedValue(new Error("MongoDB error"));

      // Act
      const response = await request(app)
        .post("/units/99/restore")
        .send({});

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      Unit.findOneAndUpdate = originalFindOneAndUpdate;
    });

    test("should handle JSON file operations error during restore", async () => {
      // Arrange: Create history record
      const historyRecord = {
        code: "99",
        action: "delete",
        oldData: { 
          name: "Deleted Unit", 
          code: "99", 
          level: "province",
          parentCode: null 
        },
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Mock fs operations
      const fs = require("fs");
      const originalReadFileSync = fs.readFileSync;
      const originalWriteFileSync = fs.writeFileSync;
      
      fs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error("File read error");
      });

      // Act
      const response = await request(app)
        .post("/units/99/restore")
        .send({});

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original functions
      fs.readFileSync = originalReadFileSync;
      fs.writeFileSync = originalWriteFileSync;
    });
  });

  describe("Data Validation", () => {
    test("should validate history record structure", async () => {
      // Arrange: Create history record with all fields
      const historyRecord = {
        code: "99",
        action: "update",
        oldData: { 
          name: "Old Name",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        newData: { 
          name: "New Name",
          level: "province",
          parentCode: null,
          englishName: "New English Name",
          administrativeLevel: "Tỉnh",
          decree: "New Decree",
          boundary: { type: "Polygon", coordinates: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        deleted: false,
        changedAt: new Date(),
        changedBy: "admin"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty("code");
      expect(response.body[0]).toHaveProperty("action");
      expect(response.body[0]).toHaveProperty("oldData");
      expect(response.body[0]).toHaveProperty("newData");
      expect(response.body[0]).toHaveProperty("deleted");
      expect(response.body[0]).toHaveProperty("changedAt");
      expect(response.body[0]).toHaveProperty("changedBy");
    });

    test("should handle different action types", async () => {
      // Arrange: Create history records with different actions
      const historyRecords = [
        {
          code: "99",
          action: "create",
          oldData: null,
          newData: { name: "Created Unit" },
          changedAt: new Date(),
          changedBy: "system"
        },
        {
          code: "99",
          action: "update",
          oldData: { name: "Created Unit" },
          newData: { name: "Updated Unit" },
          changedAt: new Date(),
          changedBy: "admin"
        },
        {
          code: "99",
          action: "delete",
          oldData: { name: "Updated Unit" },
          newData: null,
          changedAt: new Date(),
          changedBy: "admin"
        },
        {
          code: "99",
          action: "restore",
          oldData: null,
          newData: { name: "Restored Unit" },
          changedAt: new Date(),
          changedBy: "admin"
        }
      ];
      await UnitHistory.insertMany(historyRecords);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(4);
      expect(response.body.map(record => record.action)).toEqual([
        "restore", "delete", "update", "create"
      ]);
    });
  });

  describe("Performance Tests", () => {
    test("should handle large history dataset efficiently", async () => {
      // Arrange: Create many history records
      const historyRecords = [];
      for (let i = 1; i <= 100; i++) {
        historyRecords.push({
          code: "99",
          action: i % 2 === 0 ? "update" : "create",
          oldData: i % 2 === 0 ? { name: `Old Name ${i}` } : null,
          newData: { name: `New Name ${i}` },
          changedAt: new Date(Date.now() - i * 1000),
          changedBy: "system"
        });
      }
      await UnitHistory.insertMany(historyRecords);

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/units/99/history");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle restore operation efficiently", async () => {
      // Arrange: Create history record
      const historyRecord = {
        code: "99",
        action: "delete",
        oldData: { 
          name: "Deleted Unit", 
          code: "99", 
          level: "province",
          parentCode: null 
        },
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const startTime = Date.now();
      const response = await request(app)
        .post("/units/99/restore")
        .send({});
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Edge Cases", () => {
    test("should handle history record with null oldData and newData", async () => {
      // Arrange: Create history record with null data
      const historyRecord = {
        code: "99",
        action: "create",
        oldData: null,
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0].oldData).toBeNull();
      expect(response.body[0].newData).toBeNull();
    });

    test("should handle history record with empty objects", async () => {
      // Arrange: Create history record with empty objects
      const historyRecord = {
        code: "99",
        action: "update",
        oldData: {},
        newData: {},
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app).get("/units/99/history");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0].oldData).toEqual({});
      expect(response.body[0].newData).toEqual({});
    });

    test("should handle restore with complex nested data", async () => {
      // Arrange: Create history record with complex data
      const complexData = {
        name: "Complex Unit",
        code: "99",
        level: "province",
        parentCode: null,
        englishName: "Complex English Name",
        administrativeLevel: "Tỉnh",
        decree: "Complex Decree",
        boundary: {
          type: "Polygon",
          coordinates: [[[100, 0], [101, 0], [101, 1], [100, 1], [100, 0]]]
        },
        metadata: {
          source: "API",
          version: "1.0",
          tags: ["important", "verified"]
        }
      };

      const historyRecord = {
        code: "99",
        action: "delete",
        oldData: complexData,
        newData: null,
        changedAt: new Date(),
        changedBy: "system"
      };
      await UnitHistory.create(historyRecord);

      // Act
      const response = await request(app)
        .post("/units/99/restore")
        .send({});

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.restored).toMatchObject(complexData);
    });
  });
});

