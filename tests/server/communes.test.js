// tests/server/communes.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import fs from "fs";

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
      Unit.find = jest.fn().mockRejectedValue(new Error("MongoDB connection failed"));

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

    test("should return empty array for province with no communes", async () => {
      // Act
      const response = await request(app).get("/communes/99");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test("should handle invalid province ID format", async () => {
      // Act
      const response = await request(app).get("/communes/invalid-id");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test("should return communes from JSON fallback when MongoDB fails", async () => {
      // Arrange: Mock MongoDB error
      const originalFind = Unit.find;
      Unit.find = jest.fn().mockRejectedValue(new Error("MongoDB error"));

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

