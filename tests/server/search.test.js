// tests/server/search.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";

describe("🔍 Search API Tests", () => {
  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
  });

  describe("GET /search", () => {
    beforeEach(async () => {
      // Setup test data
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
          name: "Phường Hoàn Kiếm",
          code: "01001001",
          level: "commune",
          parentCode: "01001",
          provinceCode: "01",
          provinceName: "Thành phố Hà Nội",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Bến Nghé",
          code: "79001001",
          level: "commune",
          parentCode: "79001",
          provinceCode: "79",
          provinceName: "Tỉnh Hồ Chí Minh",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận Hoàn Kiếm",
          code: "01001",
          level: "district",
          parentCode: "01",
          provinceCode: "01",
          provinceName: "Thành phố Hà Nội",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);
    });

    test("should search by name", async () => {
      // Act
      const response = await request(app).get("/search?name=Hà Nội");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every(item => 
        item.name.toLowerCase().includes("hà nội")
      )).toBe(true);
    });

    test("should search by level", async () => {
      // Act
      const response = await request(app).get("/search?level=province");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(item => item.level === "province")).toBe(true);
    });

    test("should search by code", async () => {
      // Act
      const response = await request(app).get("/search?code=01");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every(item => item.code === "01")).toBe(true);
    });

    test("should search by multiple criteria", async () => {
      // Act
      const response = await request(app).get("/search?name=Hà Nội&level=province");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(item => 
        item.name.toLowerCase().includes("hà nội") && item.level === "province"
      )).toBe(true);
    });

    test("should return all units when no criteria provided", async () => {
      // Act
      const response = await request(app).get("/search");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(5); // All test data
    });

    test("should return empty array for non-matching criteria", async () => {
      // Act
      const response = await request(app).get("/search?name=NonExistent");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test("should handle case-insensitive search", async () => {
      // Act
      const response = await request(app).get("/search?name=hà nội");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("should limit results to 50 items", async () => {
      // Arrange: Create more than 50 units
      const units = [];
      for (let i = 1; i <= 60; i++) {
        units.push({
          name: `Unit ${i}`,
          code: `${i.toString().padStart(3, '0')}`,
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      await Unit.insertMany(units);

      // Act
      const response = await request(app).get("/search");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(50); // Limited to 50
    });

    test("should search with partial name match", async () => {
      // Act
      const response = await request(app).get("/search?name=Hoàn");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(item => 
        item.name.toLowerCase().includes("hoàn")
      )).toBe(true);
    });

    test("should search with special characters", async () => {
      // Arrange: Add unit with special characters
      const specialUnit = {
        name: "Tỉnh Nghệ An",
        code: "40",
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(specialUnit);

      // Act
      const response = await request(app).get("/search?name=Nghệ");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(item => item.name.includes("Nghệ"))).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should handle MongoDB connection error", async () => {
      // Arrange: Mock MongoDB error
      const originalFind = Unit.find;
      Unit.find = jest.fn().mockRejectedValue(new Error("MongoDB connection failed"));

      // Act
      const response = await request(app).get("/search?name=Test");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      Unit.find = originalFind;
    });

    test("should handle invalid query parameters", async () => {
      // Act
      const response = await request(app).get("/search?invalidParam=value");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("should handle empty query parameters", async () => {
      // Act
      const response = await request(app).get("/search?name=&level=");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Performance Tests", () => {
    test("should handle large dataset efficiently", async () => {
      // Arrange: Create large dataset
      const units = [];
      for (let i = 1; i <= 1000; i++) {
        units.push({
          name: `Unit ${i}`,
          code: `${i.toString().padStart(4, '0')}`,
          level: i % 3 === 0 ? "province" : i % 3 === 1 ? "district" : "commune",
          parentCode: i % 3 === 0 ? null : `${Math.floor(i/3).toString().padStart(2, '0')}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      await Unit.insertMany(units);

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/search?name=Unit");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(50); // Limited to 50
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test("should handle complex regex queries efficiently", async () => {
      // Arrange: Create units with complex names
      const units = [];
      for (let i = 1; i <= 100; i++) {
        units.push({
          name: `Thành phố Hà Nội ${i}`,
          code: `${i.toString().padStart(3, '0')}`,
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      await Unit.insertMany(units);

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/search?name=Hà Nội");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(50); // Limited to 50
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Data Validation", () => {
    test("should return units with correct structure", async () => {
      // Arrange: Insert test data
      const testUnit = {
        name: "Test Unit",
        code: "99",
        level: "province",
        parentCode: null,
        englishName: "Test English Name",
        administrativeLevel: "Tỉnh",
        decree: "Test Decree",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testUnit);

      // Act
      const response = await request(app).get("/search?name=Test");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("code");
      expect(response.body[0]).toHaveProperty("level");
      expect(response.body[0]).toHaveProperty("englishName");
      expect(response.body[0]).toHaveProperty("administrativeLevel");
    });

    test("should handle different level searches", async () => {
      // Arrange: Insert units of different levels
      const testData = [
        {
          name: "Tỉnh Test",
          code: "99",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận Test",
          code: "99001",
          level: "district",
          parentCode: "99",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Test",
          code: "99001001",
          level: "commune",
          parentCode: "99001",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Test province search
      const provinceResponse = await request(app).get("/search?level=province");
      expect(provinceResponse.status).toBe(200);
      expect(provinceResponse.body.every(item => item.level === "province")).toBe(true);

      // Test district search
      const districtResponse = await request(app).get("/search?level=district");
      expect(districtResponse.status).toBe(200);
      expect(districtResponse.body.every(item => item.level === "district")).toBe(true);

      // Test commune search
      const communeResponse = await request(app).get("/search?level=commune");
      expect(communeResponse.status).toBe(200);
      expect(communeResponse.body.every(item => item.level === "commune")).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    test("should handle very long search terms", async () => {
      // Arrange
      const longSearchTerm = "a".repeat(1000);

      // Act
      const response = await request(app).get(`/search?name=${longSearchTerm}`);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("should handle search with SQL injection attempts", async () => {
      // Act
      const response = await request(app).get("/search?name='; DROP TABLE units; --");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test("should handle search with regex special characters", async () => {
      // Arrange: Insert unit with regex special characters
      const specialUnit = {
        name: "Unit with [brackets] and (parentheses)",
        code: "99",
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(specialUnit);

      // Act
      const response = await request(app).get("/search?name=[brackets]");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

