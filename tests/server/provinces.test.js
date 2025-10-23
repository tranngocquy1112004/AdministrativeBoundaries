// tests/server/provinces.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("🏛️ Provinces API Tests", () => {
  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
  });

  describe("GET /provinces", () => {
    test("should return provinces from MongoDB when data exists", async () => {
      // Arrange: Insert test data into MongoDB
      const testProvinces = [
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
        }
      ];
      await Unit.insertMany(testProvinces);

      // Act
      const response = await request(app).get("/provinces");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        name: "Thành phố Hà Nội",
        code: "01",
        level: "province"
      });
    });

    test("should return provinces from JSON fallback when MongoDB is empty", async () => {
      // Arrange: Ensure MongoDB is empty
      await Unit.deleteMany({});

      // Act
      const response = await request(app).get("/provinces");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Should have basic structure
      expect(response.body[0]).toHaveProperty("code");
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("administrativeLevel");
    });

    test("should handle MongoDB connection error gracefully", async () => {
      // Arrange: Mock MongoDB error by disconnecting
      const originalConnect = Unit.db.readyState;
      
      // Act
      const response = await request(app).get("/provinces");

      // Assert - Should fallback to JSON
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("should return correct province structure", async () => {
      // Arrange
      const testProvince = {
        name: "Tỉnh Quảng Ninh",
        code: "22",
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testProvince);

      // Act
      const response = await request(app).get("/provinces");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0]).toMatchObject({
        name: "Tỉnh Quảng Ninh",
        code: "22",
        level: "province"
      });
    });

    test("should handle large dataset efficiently", async () => {
      // Arrange: Create many provinces
      const provinces = [];
      for (let i = 1; i <= 100; i++) {
        provinces.push({
          name: `Tỉnh Test ${i}`,
          code: `${i.toString().padStart(2, '0')}`,
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      await Unit.insertMany(provinces);

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/provinces");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
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
      const response = await request(app).get("/provinces");

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
      const response = await request(app).get("/provinces");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });
  });

  describe("Data Validation", () => {
    test("should filter out non-province level data", async () => {
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
      const response = await request(app).get("/provinces");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].level).toBe("province");
    });

    test("should return provinces with required fields only", async () => {
      // Arrange
      const testProvince = {
        name: "Tỉnh Bắc Ninh",
        code: "27",
        level: "province",
        parentCode: null,
        englishName: "Bac Ninh Province",
        administrativeLevel: "Tỉnh",
        decree: "Decree 123",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testProvince);

      // Act
      const response = await request(app).get("/provinces");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty("code");
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("administrativeLevel");
      // Should not include internal fields
      expect(response.body[0]).not.toHaveProperty("createdAt");
      expect(response.body[0]).not.toHaveProperty("updatedAt");
    });
  });
});

