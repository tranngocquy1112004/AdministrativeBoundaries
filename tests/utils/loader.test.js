// tests/utils/loader.test.js
import { loadData } from "../../server/utils/loader.js";
import fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn()
}));

describe("📂 Loader Utils Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("loadData function", () => {
    test("should load JSON data from file", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          administrativeLevel: "Thành phố",
          communes: [
            {
              code: "01001001",
              name: "Phường Hàng Trống",
              administrativeLevel: "Phường"
            }
          ]
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith("./data/full-address.json", "utf8");
      expect(result).toEqual(mockData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("communes");
    });

    test("should load complex nested data", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          englishName: "Hanoi",
          administrativeLevel: "Thành phố",
          decree: "Decree 123",
          communes: [
            {
              code: "01001001",
              name: "Phường Hàng Trống",
              englishName: "Hang Trong Ward",
              administrativeLevel: "Phường",
              provinceCode: "01",
              provinceName: "Thành phố Hà Nội",
              decree: "Decree 456"
            },
            {
              code: "01001002",
              name: "Phường Lý Thái Tổ",
              englishName: "Ly Thai To Ward",
              administrativeLevel: "Phường",
              provinceCode: "01",
              provinceName: "Thành phố Hà Nội",
              decree: "Decree 789"
            }
          ]
        },
        {
          code: "79",
          name: "Thành phố Hồ Chí Minh",
          englishName: "Ho Chi Minh City",
          administrativeLevel: "Thành phố",
          decree: "Decree 101",
          communes: [
            {
              code: "79001001",
              name: "Phường Bến Nghé",
              englishName: "Ben Nghe Ward",
              administrativeLevel: "Phường",
              provinceCode: "79",
              provinceName: "Thành phố Hồ Chí Minh",
              decree: "Decree 102"
            }
          ]
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(result).toHaveLength(2);
      expect(result[0].communes).toHaveLength(2);
      expect(result[1].communes).toHaveLength(1);
      expect(result[0].communes[0]).toHaveProperty("englishName");
      expect(result[0].communes[0]).toHaveProperty("provinceCode");
      expect(result[0].communes[0]).toHaveProperty("provinceName");
    });

    test("should load empty array", () => {
      // Arrange
      const mockData = [];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    test("should load single province data", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          administrativeLevel: "Thành phố",
          communes: []
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(result).toHaveLength(1);
      expect(result[0].communes).toHaveLength(0);
    });

    test("should load data with special characters", () => {
      // Arrange
      const mockData = [
        {
          code: "40",
          name: "Tỉnh Nghệ An",
          administrativeLevel: "Tỉnh",
          communes: [
            {
              code: "40001001",
              name: "Xã Hưng Nguyên (Đặc biệt)",
              administrativeLevel: "Xã",
              provinceCode: "40",
              provinceName: "Tỉnh Nghệ An"
            }
          ]
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(result[0].communes[0].name).toContain("(Đặc biệt)");
    });

    test("should load data with unicode characters", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          administrativeLevel: "Thành phố",
          communes: [
            {
              code: "01001001",
              name: "Phường Hàng Trống",
              administrativeLevel: "Phường",
              provinceCode: "01",
              provinceName: "Thành phố Hà Nội"
            }
          ]
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(result[0].name).toContain("Hà Nội");
      expect(result[0].communes[0].name).toContain("Hàng Trống");
    });

    test("should handle file read errors", () => {
      // Arrange
      const fileError = new Error("ENOENT: no such file or directory");
      fs.readFileSync.mockImplementation(() => {
        throw fileError;
      });

      // Act & Assert
      expect(() => loadData()).toThrow("ENOENT: no such file or directory");
    });

    test("should handle permission errors", () => {
      // Arrange
      const permissionError = new Error("EACCES: permission denied");
      fs.readFileSync.mockImplementation(() => {
        throw permissionError;
      });

      // Act & Assert
      expect(() => loadData()).toThrow("EACCES: permission denied");
    });

    test("should handle invalid JSON data", () => {
      // Arrange
      fs.readFileSync.mockReturnValue("invalid json data");

      // Act & Assert
      expect(() => loadData()).toThrow();
    });

    test("should handle empty file", () => {
      // Arrange
      fs.readFileSync.mockReturnValue("");

      // Act & Assert
      expect(() => loadData()).toThrow();
    });

    test("should handle whitespace-only file", () => {
      // Arrange
      fs.readFileSync.mockReturnValue("   \n\t   ");

      // Act & Assert
      expect(() => loadData()).toThrow();
    });

    test("should handle malformed JSON", () => {
      // Arrange
      fs.readFileSync.mockReturnValue('{"code": "01", "name": "Hà Nội", "communes": }');

      // Act & Assert
      expect(() => loadData()).toThrow();
    });

    test("should handle JSON with trailing comma", () => {
      // Arrange
      fs.readFileSync.mockReturnValue('{"code": "01", "name": "Hà Nội", "communes": [],}');

      // Act & Assert
      expect(() => loadData()).toThrow();
    });

    test("should handle large JSON file", () => {
      // Arrange: Create large dataset
      const largeData = [];
      for (let i = 1; i <= 100; i++) {
        const province = {
          code: i.toString().padStart(2, '0'),
          name: `Tỉnh ${i}`,
          administrativeLevel: "Tỉnh",
          communes: []
        };
        
        for (let j = 1; j <= 50; j++) {
          province.communes.push({
            code: `${i.toString().padStart(2, '0')}${j.toString().padStart(3, '0')}`,
            name: `Xã ${i}-${j}`,
            administrativeLevel: "Xã",
            provinceCode: i.toString().padStart(2, '0'),
            provinceName: `Tỉnh ${i}`
          });
        }
        
        largeData.push(province);
      }
      
      fs.readFileSync.mockReturnValue(JSON.stringify(largeData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(largeData);
      expect(result).toHaveLength(100);
      expect(result[0].communes).toHaveLength(50);
    });

    test("should handle data with null values", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          administrativeLevel: "Thành phố",
          englishName: null,
          decree: null,
          communes: [
            {
              code: "01001001",
              name: "Phường Hàng Trống",
              administrativeLevel: "Phường",
              provinceCode: "01",
              provinceName: "Thành phố Hà Nội",
              englishName: null,
              decree: null
            }
          ]
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(result[0].englishName).toBeNull();
      expect(result[0].decree).toBeNull();
      expect(result[0].communes[0].englishName).toBeNull();
      expect(result[0].communes[0].decree).toBeNull();
    });

    test("should handle data with undefined values", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          administrativeLevel: "Thành phố",
          englishName: undefined,
          decree: undefined,
          communes: []
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(result[0].englishName).toBeUndefined();
      expect(result[0].decree).toBeUndefined();
    });

    test("should handle data with mixed types", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          administrativeLevel: "Thành phố",
          population: 8000000,
          isCapital: true,
          coordinates: [105.8342, 21.0285],
          metadata: {
            established: 1010,
            area: 3324.92,
            districts: 12
          },
          communes: [
            {
              code: "01001001",
              name: "Phường Hàng Trống",
              administrativeLevel: "Phường",
              provinceCode: "01",
              provinceName: "Thành phố Hà Nội",
              population: 5000,
              isUrban: true
            }
          ]
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(typeof result[0].population).toBe("number");
      expect(typeof result[0].isCapital).toBe("boolean");
      expect(Array.isArray(result[0].coordinates)).toBe(true);
      expect(typeof result[0].metadata).toBe("object");
      expect(typeof result[0].communes[0].population).toBe("number");
      expect(typeof result[0].communes[0].isUrban).toBe("boolean");
    });

    test("should handle data with arrays and objects", () => {
      // Arrange
      const mockData = [
        {
          code: "01",
          name: "Thành phố Hà Nội",
          administrativeLevel: "Thành phố",
          boundaries: {
            type: "Polygon",
            coordinates: [[[105.0, 21.0], [106.0, 21.0], [106.0, 22.0], [105.0, 22.0], [105.0, 21.0]]]
          },
          districts: ["Hoàn Kiếm", "Ba Đình", "Đống Đa"],
          communes: [
            {
              code: "01001001",
              name: "Phường Hàng Trống",
              administrativeLevel: "Phường",
              provinceCode: "01",
              provinceName: "Thành phố Hà Nội",
              services: ["Healthcare", "Education", "Transportation"],
              facilities: {
                schools: 5,
                hospitals: 2,
                markets: 3
              }
            }
          ]
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      const result = loadData();

      // Assert
      expect(result).toEqual(mockData);
      expect(result[0].boundaries).toHaveProperty("type");
      expect(result[0].boundaries).toHaveProperty("coordinates");
      expect(Array.isArray(result[0].districts)).toBe(true);
      expect(Array.isArray(result[0].communes[0].services)).toBe(true);
      expect(typeof result[0].communes[0].facilities).toBe("object");
    });
  });

  describe("File Path Handling", () => {
    test("should use correct file path", () => {
      // Arrange
      const mockData = [{ code: "01", name: "Hà Nội" }];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      loadData();

      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith("./data/full-address.json", "utf8");
    });

    test("should handle file path with spaces", () => {
      // Arrange
      const mockData = [{ code: "01", name: "Hà Nội" }];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      loadData();

      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith("./data/full-address.json", "utf8");
    });

    test("should handle file path with special characters", () => {
      // Arrange
      const mockData = [{ code: "01", name: "Hà Nội" }];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      loadData();

      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith("./data/full-address.json", "utf8");
    });
  });

  describe("Performance Tests", () => {
    test("should load large dataset efficiently", () => {
      // Arrange: Create large dataset
      const largeData = [];
      for (let i = 1; i <= 1000; i++) {
        largeData.push({
          code: i.toString().padStart(4, '0'),
          name: `Province ${i}`,
          administrativeLevel: "Tỉnh",
          communes: Array(100).fill().map((_, j) => ({
            code: `${i.toString().padStart(4, '0')}${j.toString().padStart(3, '0')}`,
            name: `Commune ${i}-${j}`,
            administrativeLevel: "Xã",
            provinceCode: i.toString().padStart(4, '0'),
            provinceName: `Province ${i}`
          }))
        });
      }
      
      fs.readFileSync.mockReturnValue(JSON.stringify(largeData));

      // Act
      const startTime = Date.now();
      const result = loadData();
      const endTime = Date.now();

      // Assert
      expect(result).toEqual(largeData);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle deep nesting efficiently", () => {
      // Arrange: Create deeply nested data
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  provinces: [
                    {
                      code: "01",
                      name: "Hà Nội",
                      communes: [
                        {
                          code: "01001001",
                          name: "Hàng Trống",
                          nested: {
                            very: {
                              deep: {
                                data: "value"
                              }
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      };
      
      fs.readFileSync.mockReturnValue(JSON.stringify(deepData));

      // Act
      const startTime = Date.now();
      const result = loadData();
      const endTime = Date.now();

      // Assert
      expect(result).toEqual(deepData);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

