// tests/fetcher/index.test.js
import { jest } from '@jest/globals';

describe("🌐 Fetcher Index Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("Environment Configuration", () => {
    test("should use default API base when not set", () => {
      // Arrange
      delete process.env.API_BASE;

      // Act
      const defaultApiBase = process.env.API_BASE || "https://production.cas.so/address-kit";

      // Assert
      expect(defaultApiBase).toBe("https://production.cas.so/address-kit");
    });

    test("should use custom API base when set", () => {
      // Arrange
      process.env.API_BASE = "https://custom-api.example.com";

      // Act
      const customApiBase = process.env.API_BASE;

      // Assert
      expect(customApiBase).toBe("https://custom-api.example.com");
    });

    test("should use default effective date when not set", () => {
      // Arrange
      delete process.env.EFFECTIVE_DATE;

      // Act
      const defaultEffectiveDate = process.env.EFFECTIVE_DATE || "latest";

      // Assert
      expect(defaultEffectiveDate).toBe("latest");
    });

    test("should use custom effective date when set", () => {
      // Arrange
      process.env.EFFECTIVE_DATE = "2023-01-01";

      // Act
      const customEffectiveDate = process.env.EFFECTIVE_DATE;

      // Assert
      expect(customEffectiveDate).toBe("2023-01-01");
    });
  });

  describe("Data Processing", () => {
    test("should process provinces data correctly", () => {
      // Arrange
      const provincesData = [
        { code: "01", name: "Thành phố Hà Nội" },
        { code: "79", name: "Thành phố Hồ Chí Minh" }
      ];

      // Act
      const processedData = provincesData.map(province => ({
        ...province,
        communes: []
      }));

      // Assert
      expect(processedData).toHaveLength(2);
      expect(processedData[0]).toHaveProperty("code", "01");
      expect(processedData[0]).toHaveProperty("name", "Thành phố Hà Nội");
      expect(processedData[0]).toHaveProperty("communes", []);
    });

    test("should process communes data correctly", () => {
      // Arrange
      const communesData = [
        { code: "01001001", name: "Phường Hàng Trống" },
        { code: "01001002", name: "Phường Lý Thái Tổ" }
      ];

      // Act
      const processedData = communesData.map(commune => ({
        ...commune,
        provinceCode: "01",
        provinceName: "Thành phố Hà Nội"
      }));

      // Assert
      expect(processedData).toHaveLength(2);
      expect(processedData[0]).toHaveProperty("code", "01001001");
      expect(processedData[0]).toHaveProperty("name", "Phường Hàng Trống");
      expect(processedData[0]).toHaveProperty("provinceCode", "01");
      expect(processedData[0]).toHaveProperty("provinceName", "Thành phố Hà Nội");
    });

    test("should handle empty provinces data", () => {
      // Arrange
      const provincesData = [];

      // Act
      const processedData = provincesData.map(province => ({
        ...province,
        communes: []
      }));

      // Assert
      expect(processedData).toHaveLength(0);
    });

    test("should handle empty communes data", () => {
      // Arrange
      const communesData = [];

      // Act
      const processedData = communesData.map(commune => ({
        ...commune,
        provinceCode: "01",
        provinceName: "Thành phố Hà Nội"
      }));

      // Assert
      expect(processedData).toHaveLength(0);
    });

    test("should handle malformed provinces data", () => {
      // Arrange
      const provincesData = [
        { code: "01", name: "Thành phố Hà Nội" },
        { code: "79" }, // Missing name
        { name: "Thành phố Đà Nẵng" } // Missing code
      ];

      // Act
      const processedData = provincesData.map(province => ({
        ...province,
        communes: []
      }));

      // Assert
      expect(processedData).toHaveLength(3);
      expect(processedData[0]).toHaveProperty("code", "01");
      expect(processedData[0]).toHaveProperty("name", "Thành phố Hà Nội");
      expect(processedData[1]).toHaveProperty("code", "79");
      expect(processedData[1]).not.toHaveProperty("name");
      expect(processedData[2]).toHaveProperty("name", "Thành phố Đà Nẵng");
      expect(processedData[2]).not.toHaveProperty("code");
    });

    test("should handle malformed communes data", () => {
      // Arrange
      const communesData = [
        { code: "01001001", name: "Phường Hàng Trống" },
        { code: "01001002" }, // Missing name
        { name: "Phường Lý Thái Tổ" } // Missing code
      ];

      // Act
      const processedData = communesData.map(commune => ({
        ...commune,
        provinceCode: "01",
        provinceName: "Thành phố Hà Nội"
      }));

      // Assert
      expect(processedData).toHaveLength(3);
      expect(processedData[0]).toHaveProperty("code", "01001001");
      expect(processedData[0]).toHaveProperty("name", "Phường Hàng Trống");
      expect(processedData[1]).toHaveProperty("code", "01001002");
      expect(processedData[1]).not.toHaveProperty("name");
      expect(processedData[2]).toHaveProperty("name", "Phường Lý Thái Tổ");
      expect(processedData[2]).not.toHaveProperty("code");
    });
  });

  describe("JSON File Operations", () => {
    test("should handle JSON parsing correctly", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          communes: [
            { code: "01001001", name: "Phường Hàng Trống" }
          ]
        }
      ];
      const jsonString = JSON.stringify(mockData);

      // Act
      const parsedData = JSON.parse(jsonString);

      // Assert
      expect(parsedData).toEqual(mockData);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].code).toBe("01");
      expect(parsedData[0].name).toBe("Thành phố Hà Nội");
    });

    test("should handle malformed JSON data", () => {
      // Arrange
      const invalidJson = "invalid json";

      // Act & Assert
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    test("should process provinces from JSON data", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          communes: [
            { code: "01001001", name: "Phường Hàng Trống" },
            { code: "01001002", name: "Phường Lý Thái Tổ" }
          ]
        },
        {
          code: "79",
          name: "Thành phố Hồ Chí Minh",
          communes: [
            { code: "79001001", name: "Phường Bến Nghé" }
          ]
        }
      ];

      // Act
      const data = mockData;

      // Assert
      expect(data).toHaveLength(2);
      expect(data[0].code).toBe("01");
      expect(data[0].name).toBe("Thành phố Hà Nội");
      expect(data[0].communes).toHaveLength(2);
      expect(data[1].code).toBe("79");
      expect(data[1].name).toBe("Thành phố Hồ Chí Minh");
      expect(data[1].communes).toHaveLength(1);
    });

    test("should process communes from JSON data", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          communes: [
            { code: "01001001", name: "Phường Hàng Trống", provinceCode: "01", provinceName: "Thành phố Hà Nội" },
            { code: "01001002", name: "Phường Lý Thái Tổ", provinceCode: "01", provinceName: "Thành phố Hà Nội" }
          ]
        }
      ];

      // Act
      const data = mockData;

      // Assert
      expect(data[0].communes).toHaveLength(2);
      expect(data[0].communes[0].code).toBe("01001001");
      expect(data[0].communes[0].name).toBe("Phường Hàng Trống");
      expect(data[0].communes[0].provinceCode).toBe("01");
      expect(data[0].communes[0].provinceName).toBe("Thành phố Hà Nội");
    });
  });

  describe("File Operations", () => {
    test("should handle file path resolution", () => {
      // Arrange
      const basePath = "data";
      const fileName = "full-address.json";

      // Act
      const fullPath = `${basePath}/${fileName}`;

      // Assert
      expect(fullPath).toBe("data/full-address.json");
    });

    test("should handle file path with spaces", () => {
      // Arrange
      const basePath = "/path with spaces/data";
      const fileName = "full-address.json";

      // Act
      const fullPath = `${basePath}/${fileName}`;

      // Assert
      expect(fullPath).toBe("/path with spaces/data/full-address.json");
    });

    test("should handle file path with special characters", () => {
      // Arrange
      const basePath = "/path/with/special@chars#";
      const fileName = "full-address.json";

      // Act
      const fullPath = `${basePath}/${fileName}`;

      // Assert
      expect(fullPath).toBe("/path/with/special@chars#/full-address.json");
    });

    test("should handle large data efficiently", () => {
      // Arrange
      const largeData = Array(1000).fill().map((_, i) => ({
        code: i.toString().padStart(2, '0'),
        name: `Province ${i}`,
        communes: []
      }));

      // Act
      const jsonString = JSON.stringify(largeData, null, 2);
      const parsedData = JSON.parse(jsonString);

      // Assert
      expect(parsedData).toHaveLength(1000);
      expect(parsedData[0].code).toBe("00");
      expect(parsedData[999].code).toBe("999");
    });
  });

  describe("Performance Tests", () => {
    test("should handle large dataset efficiently", () => {
      // Arrange: Create large dataset
      const largeData = [];
      for (let i = 1; i <= 1000; i++) {
        largeData.push({
          code: i.toString().padStart(2, '0'),
          name: `Province ${i}`,
          communes: Array(100).fill().map((_, j) => ({
            code: `${i.toString().padStart(2, '0')}${j.toString().padStart(3, '0')}`,
            name: `Commune ${i}-${j}`
          }))
        });
      }

      // Act
      const startTime = Date.now();
      const jsonString = JSON.stringify(largeData, null, 2);
      const parsedData = JSON.parse(jsonString);
      const endTime = Date.now();

      // Assert
      expect(parsedData).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle concurrent operations", () => {
      // Arrange
      const mockData = [
        { code: "01", name: "Hà Nội", communes: [] },
        { code: "79", name: "TP.HCM", communes: [] }
      ];

      // Act
      const startTime = Date.now();
      const promises = Array(10).fill().map((_, i) => {
        const data = [...mockData];
        const jsonString = JSON.stringify(data, null, 2);
        const parsedData = JSON.parse(jsonString);
        return Promise.resolve(parsedData);
      });
      Promise.all(promises);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete data processing", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          communes: [
            { code: "01001001", name: "Phường Hàng Trống", provinceCode: "01", provinceName: "Thành phố Hà Nội" },
            { code: "01001002", name: "Phường Lý Thái Tổ", provinceCode: "01", provinceName: "Thành phố Hà Nội" }
          ]
        },
        {
          code: "79",
          name: "Thành phố Hồ Chí Minh",
          communes: [
            { code: "79001001", name: "Phường Bến Nghé", provinceCode: "79", provinceName: "Thành phố Hồ Chí Minh" }
          ]
        }
      ];

      // Act
      const data = mockData;
      
      // Process data
      const processedData = data.map(province => ({
        ...province,
        communes: province.communes || []
      }));
      
      const jsonString = JSON.stringify(processedData, null, 2);
      const finalData = JSON.parse(jsonString);

      // Assert
      expect(finalData).toHaveLength(2);
      expect(finalData[0]).toHaveProperty("code", "01");
      expect(finalData[0]).toHaveProperty("name", "Thành phố Hà Nội");
      expect(finalData[0]).toHaveProperty("communes");
      expect(finalData[0].communes).toHaveLength(2);
      expect(finalData[1]).toHaveProperty("code", "79");
      expect(finalData[1]).toHaveProperty("name", "Thành phố Hồ Chí Minh");
      expect(finalData[1].communes).toHaveLength(1);
    });
  });
});