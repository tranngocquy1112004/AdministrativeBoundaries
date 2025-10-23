// tests/server/tree.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";

describe("🌳 Tree API Tests", () => {
  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
  });

  describe("GET /tree", () => {
    test("should return hierarchical tree structure", async () => {
      // Arrange: Insert hierarchical test data
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
          provinceCode: "01",
          provinceName: "Thành phố Hà Nội",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận Ba Đình",
          code: "01002",
          level: "district",
          parentCode: "01",
          provinceCode: "01",
          provinceName: "Thành phố Hà Nội",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Quận 1",
          code: "79001",
          level: "district",
          parentCode: "79",
          provinceCode: "79",
          provinceName: "Tỉnh Hồ Chí Minh",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Hàng Trống",
          code: "01001001",
          level: "commune",
          parentCode: "01001",
          provinceCode: "01",
          provinceName: "Thành phố Hà Nội",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Lý Thái Tổ",
          code: "01001002",
          level: "commune",
          parentCode: "01001",
          provinceCode: "01",
          provinceName: "Thành phố Hà Nội",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Phường Phúc Xá",
          code: "01002001",
          level: "commune",
          parentCode: "01002",
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
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Two provinces

      // Check structure of first province
      const hanoi = response.body.find(item => item.code === "01");
      expect(hanoi).toBeTruthy();
      expect(hanoi.name).toBe("Thành phố Hà Nội");
      expect(hanoi.children).toBeDefined();
      expect(Array.isArray(hanoi.children)).toBe(true);
      expect(hanoi.children.length).toBe(2); // Two districts

      // Check structure of districts
      const hoanKiem = hanoi.children.find(item => item.code === "01001");
      expect(hoanKiem).toBeTruthy();
      expect(hoanKiem.name).toBe("Quận Hoàn Kiếm");
      expect(hoanKiem.children).toBeDefined();
      expect(Array.isArray(hoanKiem.children)).toBe(true);
      expect(hoanKiem.children.length).toBe(2); // Two communes

      // Check structure of communes
      const hangTrong = hoanKiem.children.find(item => item.code === "01001001");
      expect(hangTrong).toBeTruthy();
      expect(hangTrong.name).toBe("Phường Hàng Trống");
      expect(hangTrong.children).toBeDefined();
      expect(Array.isArray(hangTrong.children)).toBe(true);
    });

    test("should return empty array when no data exists", async () => {
      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test("should handle provinces without children", async () => {
      // Arrange: Insert only provinces
      const testData = [
        {
          name: "Tỉnh Test 1",
          code: "99",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Tỉnh Test 2",
          code: "98",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body.every(item => item.children.length === 0)).toBe(true);
    });

    test("should handle orphaned units (units without valid parent)", async () => {
      // Arrange: Insert units with invalid parent codes
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
          name: "Orphaned District",
          code: "99999",
          level: "district",
          parentCode: "99998", // Invalid parent
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Orphaned Commune",
          code: "999999",
          level: "commune",
          parentCode: "99999", // Invalid parent
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1); // Only the province
      expect(response.body[0].code).toBe("01");
      expect(response.body[0].children.length).toBe(0);
    });

    test("should handle deep hierarchy", async () => {
      // Arrange: Create deep hierarchy
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
          name: "Huyện Test",
          code: "99001",
          level: "district",
          parentCode: "99",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Xã Test 1",
          code: "99001001",
          level: "commune",
          parentCode: "99001",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Xã Test 2",
          code: "99001002",
          level: "commune",
          parentCode: "99001",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      
      const province = response.body[0];
      expect(province.code).toBe("99");
      expect(province.children.length).toBe(1);
      
      const district = province.children[0];
      expect(district.code).toBe("99001");
      expect(district.children.length).toBe(2);
    });

    test("should preserve all unit properties in tree structure", async () => {
      // Arrange: Insert unit with all properties
      const testData = [
        {
          name: "Tỉnh Test",
          code: "99",
          level: "province",
          parentCode: null,
          englishName: "Test Province",
          administrativeLevel: "Tỉnh",
          decree: "Test Decree",
          boundary: { type: "Polygon", coordinates: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("code");
      expect(response.body[0]).toHaveProperty("level");
      expect(response.body[0]).toHaveProperty("englishName");
      expect(response.body[0]).toHaveProperty("administrativeLevel");
      expect(response.body[0]).toHaveProperty("decree");
      expect(response.body[0]).toHaveProperty("boundary");
      expect(response.body[0]).toHaveProperty("children");
    });
  });

  describe("Error Handling", () => {
    test("should handle MongoDB connection error", async () => {
      // Arrange: Mock MongoDB error
      const originalFind = Unit.find;
      Unit.find = jest.fn().mockRejectedValue(new Error("MongoDB connection failed"));

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      Unit.find = originalFind;
    });

    test("should handle database query timeout", async () => {
      // Arrange: Mock slow query
      const originalFind = Unit.find;
      Unit.find = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error("Query timeout")), 100);
        });
      });

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");

      // Restore original function
      Unit.find = originalFind;
    });
  });

  describe("Performance Tests", () => {
    test("should handle large dataset efficiently", async () => {
      // Arrange: Create large hierarchical dataset
      const testData = [];
      
      // Create 10 provinces
      for (let i = 1; i <= 10; i++) {
        testData.push({
          name: `Tỉnh ${i}`,
          code: `${i.toString().padStart(2, '0')}`,
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create 5 districts per province
        for (let j = 1; j <= 5; j++) {
          testData.push({
            name: `Huyện ${i}-${j}`,
            code: `${i.toString().padStart(2, '0')}${j.toString().padStart(2, '0')}`,
            level: "district",
            parentCode: `${i.toString().padStart(2, '0')}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Create 3 communes per district
          for (let k = 1; k <= 3; k++) {
            testData.push({
              name: `Xã ${i}-${j}-${k}`,
              code: `${i.toString().padStart(2, '0')}${j.toString().padStart(2, '0')}${k.toString().padStart(2, '0')}`,
              level: "commune",
              parentCode: `${i.toString().padStart(2, '0')}${j.toString().padStart(2, '0')}`,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
      
      await Unit.insertMany(testData);

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/tree");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(10); // 10 provinces
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      
      // Verify structure
      const firstProvince = response.body[0];
      expect(firstProvince.children.length).toBe(5); // 5 districts
      expect(firstProvince.children[0].children.length).toBe(3); // 3 communes per district
    });

    test("should handle complex hierarchy efficiently", async () => {
      // Arrange: Create complex hierarchy with many levels
      const testData = [];
      const provinces = ["01", "02", "03"];
      
      provinces.forEach(provinceCode => {
        testData.push({
          name: `Tỉnh ${provinceCode}`,
          code: provinceCode,
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create multiple districts
        for (let i = 1; i <= 10; i++) {
          const districtCode = `${provinceCode}${i.toString().padStart(2, '0')}`;
          testData.push({
            name: `Huyện ${districtCode}`,
            code: districtCode,
            level: "district",
            parentCode: provinceCode,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Create multiple communes
          for (let j = 1; j <= 5; j++) {
            testData.push({
              name: `Xã ${districtCode}${j.toString().padStart(2, '0')}`,
              code: `${districtCode}${j.toString().padStart(2, '0')}`,
              level: "commune",
              parentCode: districtCode,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      });
      
      await Unit.insertMany(testData);

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/tree");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3); // 3 provinces
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Data Integrity", () => {
    test("should handle circular references gracefully", async () => {
      // Arrange: Create units with potential circular references
      const testData = [
        {
          name: "Tỉnh A",
          code: "01",
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Huyện A1",
          code: "01001",
          level: "district",
          parentCode: "01",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].children.length).toBe(1);
    });

    test("should handle units with null parentCode correctly", async () => {
      // Arrange: Insert units with null parentCode
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
          name: "Huyện Test",
          code: "99001",
          level: "district",
          parentCode: null, // Should be treated as root
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2); // Both should be at root level
    });

    test("should handle mixed level units correctly", async () => {
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
          name: "Huyện Test",
          code: "99001",
          level: "district",
          parentCode: "99",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Xã Test",
          code: "99001001",
          level: "commune",
          parentCode: "99001",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1); // One province
      expect(response.body[0].children.length).toBe(1); // One district
      expect(response.body[0].children[0].children.length).toBe(1); // One commune
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty database", async () => {
      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test("should handle single unit", async () => {
      // Arrange: Insert single unit
      const testData = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await Unit.create(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].code).toBe("99");
      expect(response.body[0].children.length).toBe(0);
    });

    test("should handle units with missing parent", async () => {
      // Arrange: Insert unit with missing parent
      const testData = [
        {
          name: "Huyện Test",
          code: "99001",
          level: "district",
          parentCode: "99", // Parent doesn't exist
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await Unit.insertMany(testData);

      // Act
      const response = await request(app).get("/tree");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0); // No valid hierarchy
    });
  });
});

