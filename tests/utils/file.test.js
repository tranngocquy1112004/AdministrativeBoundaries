// tests/utils/file.test.js
import { jest } from "@jest/globals";
import { saveJSON, loadJSON } from "../../utils/file.js";
import fs from "fs";

describe("📁 File Utils Tests", () => {
  let mockWriteFileSync;
  let mockReadFileSync;
  let mockExistsSync;

  beforeEach(() => {
    // Mock fs module functions
    mockWriteFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
    mockReadFileSync = jest.spyOn(fs, "readFileSync").mockImplementation();
    mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("saveJSON function", () => {
    test("should save JSON data to file", () => {
      // Arrange
      const testData = { name: "Test", value: 123 };
      const filePath = "/test/path.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save array data to file", () => {
      // Arrange
      const testData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" }
      ];
      const filePath = "/test/array.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save string data to file", () => {
      // Arrange
      const testData = "Simple string data";
      const filePath = "/test/string.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save number data to file", () => {
      // Arrange
      const testData = 42;
      const filePath = "/test/number.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save boolean data to file", () => {
      // Arrange
      const testData = true;
      const filePath = "/test/boolean.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save null data to file", () => {
      // Arrange
      const testData = null;
      const filePath = "/test/null.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save undefined data to file", () => {
      // Arrange
      const testData = undefined;
      const filePath = "/test/undefined.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save complex nested data to file", () => {
      // Arrange
      const testData = {
        level1: {
          level2: {
            level3: {
              array: [1, 2, 3],
              string: "nested value",
              boolean: true
            }
          }
        }
      };
      const filePath = "/test/complex.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should save data with special characters", () => {
      // Arrange
      const testData = {
        special: "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
        unicode: "Unicode: 中文, العربية, русский",
        emoji: "Emoji: 🚀🌟💻"
      };
      const filePath = "/test/special.json";

      // Act
      saveJSON(filePath, testData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
    });

    test("should handle file write errors", () => {
      // Arrange
      const testData = { name: "Test" };
      const filePath = "/test/error.json";
      const writeError = new Error("Write permission denied");
      mockWriteFileSync.mockImplementation(() => {
        throw writeError;
      });

      // Act & Assert
      expect(() => saveJSON(filePath, testData)).toThrow("Write permission denied");
    });

    test("should handle circular reference errors", () => {
      // Arrange
      const circularData = {};
      circularData.self = circularData;
      const filePath = "/test/circular.json";

      // Act & Assert
      expect(() => saveJSON(filePath, circularData)).toThrow();
    });

    test("should handle large data efficiently", () => {
      // Arrange
      const largeData = Array(1000).fill().map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Large data string ${i}`.repeat(100)
      }));
      const filePath = "/test/large.json";

      // Act
      saveJSON(filePath, largeData);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(largeData, null, 2)
      );
    });
  });

  describe("loadJSON function", () => {
    test("should load JSON data from file", () => {
      // Arrange
      const testData = { name: "Test", value: 123 };
      const filePath = "/test/path.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should load array data from file", () => {
      // Arrange
      const testData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" }
      ];
      const filePath = "/test/array.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should load string data from file", () => {
      // Arrange
      const testData = "Simple string data";
      const filePath = "/test/string.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should load number data from file", () => {
      // Arrange
      const testData = 42;
      const filePath = "/test/number.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should load boolean data from file", () => {
      // Arrange
      const testData = true;
      const filePath = "/test/boolean.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should load null data from file", () => {
      // Arrange
      const testData = null;
      const filePath = "/test/null.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should load complex nested data from file", () => {
      // Arrange
      const testData = {
        level1: {
          level2: {
            level3: {
              array: [1, 2, 3],
              string: "nested value",
              boolean: true
            }
          }
        }
      };
      const filePath = "/test/complex.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should load data with special characters", () => {
      // Arrange
      const testData = {
        special: "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
        unicode: "Unicode: 中文, العربية, русский",
        emoji: "Emoji: 🚀🌟💻"
      };
      const filePath = "/test/special.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should handle file read errors", () => {
      // Arrange
      const filePath = "/test/error.json";
      const readError = new Error("File not found");
      mockReadFileSync.mockImplementation(() => {
        throw readError;
      });

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow("File not found");
    });

    test("should handle invalid JSON data", () => {
      // Arrange
      const filePath = "/test/invalid.json";
      mockReadFileSync.mockReturnValue("invalid json data");

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });

    test("should handle empty file", () => {
      // Arrange
      const filePath = "/test/empty.json";
      mockReadFileSync.mockReturnValue("");

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });

    test("should handle whitespace-only file", () => {
      // Arrange
      const filePath = "/test/whitespace.json";
      mockReadFileSync.mockReturnValue("   \n\t   ");

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });

    test("should handle malformed JSON", () => {
      // Arrange
      const filePath = "/test/malformed.json";
      mockReadFileSync.mockReturnValue('{"name": "Test", "value": }');

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });

    test("should handle JSON with trailing comma", () => {
      // Arrange
      const filePath = "/test/trailing.json";
      mockReadFileSync.mockReturnValue('{"name": "Test", "value": 123,}');

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });

    test("should handle JSON with single quotes", () => {
      // Arrange
      const filePath = "/test/single-quotes.json";
      mockReadFileSync.mockReturnValue("{'name': 'Test', 'value': 123}");

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });

    test("should handle large JSON files efficiently", () => {
      // Arrange
      const largeData = Array(1000).fill().map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Large data string ${i}`.repeat(100)
      }));
      const filePath = "/test/large.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(largeData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(largeData);
    });

    test("should handle JSON with comments (should fail)", () => {
      // Arrange
      const filePath = "/test/comments.json";
      mockReadFileSync.mockReturnValue('{"name": "Test", "value": 123} // Comment');

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });

    test("should handle JSON with undefined values", () => {
      // Arrange
      const testData = { name: "Test", value: undefined };
      const filePath = "/test/undefined.json";
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      const result = loadJSON(filePath);

      // Assert
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(result).toEqual(testData);
    });

    test("should handle JSON with functions (should fail)", () => {
      // Arrange
      const filePath = "/test/function.json";
      mockReadFileSync.mockReturnValue('{"name": "Test", "func": function() {}}');

      // Act & Assert
      expect(() => loadJSON(filePath)).toThrow();
    });
  });

  describe("Integration Tests", () => {
    test("should save and load data consistently", () => {
      // Arrange
      const testData = {
        name: "Integration Test",
        value: 123,
        nested: {
          array: [1, 2, 3],
          string: "nested value"
        }
      };
      const filePath = "/test/integration.json";
      
      // Mock mockReadFileSync to return the saved data
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      // Act
      saveJSON(filePath, testData);
      const loadedData = loadJSON(filePath);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(testData, null, 2)
      );
      expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
      expect(loadedData).toEqual(testData);
    });

    test("should handle round-trip data conversion", () => {
      // Arrange
      const originalData = {
        provinces: [
          { code: "01", name: "Hà Nội" },
          { code: "79", name: "Hồ Chí Minh" }
        ],
        communes: [
          { code: "01001", name: "Hoàn Kiếm", parentCode: "01" }
        ]
      };
      const filePath = "/test/roundtrip.json";
      
      // Mock mockReadFileSync to return the saved data
      mockReadFileSync.mockReturnValue(JSON.stringify(originalData));

      // Act
      saveJSON(filePath, originalData);
      const loadedData = loadJSON(filePath);

      // Assert
      expect(loadedData).toEqual(originalData);
      expect(loadedData.provinces).toHaveLength(2);
      expect(loadedData.communes).toHaveLength(1);
      expect(loadedData.provinces[0].name).toBe("Hà Nội");
      expect(loadedData.communes[0].name).toBe("Hoàn Kiếm");
    });
  });

  describe("Error Handling", () => {
    test("should handle file system errors gracefully", () => {
      // Arrange
      const testData = { name: "Test" };
      const filePath = "/test/error.json";
      const fsError = new Error("ENOENT: no such file or directory");
      mockWriteFileSync.mockImplementation(() => {
        throw fsError;
      });

      // Act & Assert
      expect(() => saveJSON(filePath, testData)).toThrow("ENOENT: no such file or directory");
    });

    test("should handle permission errors", () => {
      // Arrange
      const testData = { name: "Test" };
      const filePath = "/test/permission.json";
      const permissionError = new Error("EACCES: permission denied");
      mockWriteFileSync.mockImplementation(() => {
        throw permissionError;
      });

      // Act & Assert
      expect(() => saveJSON(filePath, testData)).toThrow("EACCES: permission denied");
    });

    test("should handle disk full errors", () => {
      // Arrange
      const testData = { name: "Test" };
      const filePath = "/test/diskfull.json";
      const diskError = new Error("ENOSPC: no space left on device");
      mockWriteFileSync.mockImplementation(() => {
        throw diskError;
      });

      // Act & Assert
      expect(() => saveJSON(filePath, testData)).toThrow("ENOSPC: no space left on device");
    });
  });
});

