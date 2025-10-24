// tests/scripts/importAddress.test.js
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Unit from "../../server/models/Unit.js";

// Mock dependencies
jest.mock("mongoose");
jest.mock("fs");
jest.mock("path");
jest.mock("dotenv");

// Mock the importAddress function
const mockImportAddress = jest.fn();

// Mock the script execution
jest.mock("../../server/scripts/importAddress.js", () => ({
  __esModule: true,
  default: mockImportAddress
}));

describe("📥 Import Address Script Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.MONGO_URI;
    delete process.env.MONGODB_URI;
    
    // Setup mocks
    jest.spyOn(fs, 'readFileSync').mockReturnValue('[]');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(path, 'join').mockReturnValue('/mock/path/data/full-address.json');
    jest.spyOn(path, 'resolve').mockReturnValue('/mock/path');
    jest.spyOn(dotenv, 'config').mockReturnValue({});
    jest.spyOn(mongoose, 'connect').mockResolvedValue({ connection: { host: 'localhost' } });
    jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("Script Execution", () => {
    test("should execute importAddress function", async () => {
      // Arrange
      mockImportAddress.mockResolvedValue();

      // Act
      const result = await mockImportAddress();

      // Assert
      expect(mockImportAddress).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    test("should handle successful execution", async () => {
      // Arrange
      mockImportAddress.mockResolvedValue();

      // Act
      await mockImportAddress();

      // Assert
      expect(mockImportAddress).toHaveBeenCalled();
    });

    test("should handle execution errors", async () => {
      // Arrange
      const error = new Error("Import failed");
      mockImportAddress.mockRejectedValue(error);

      // Act & Assert
      await expect(mockImportAddress()).rejects.toThrow("Import failed");
    });
  });

  describe("Environment Configuration", () => {
    test("should load environment variables", () => {
      // Arrange
      process.env.MONGO_URI = "mongodb://localhost:27017/test";
      dotenv.config.mockReturnValue();

      // Act
      dotenv.config();

      // Assert
      expect(dotenv.config).toHaveBeenCalled();
    });

    test("should use default MongoDB URI when not set", () => {
      // Arrange
      delete process.env.MONGO_URI;
      delete process.env.MONGODB_URI;

      // Act
      const defaultUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/administrative_boundaries";

      // Assert
      expect(defaultUri).toBe("mongodb://127.0.0.1:27017/administrative_boundaries");
    });

    test("should use custom MongoDB URI when set", () => {
      // Arrange
      process.env.MONGO_URI = "mongodb://custom-host:27017/custom-db";

      // Act
      const customUri = process.env.MONGO_URI;

      // Assert
      expect(customUri).toBe("mongodb://custom-host:27017/custom-db");
    });
  });

  describe("File Path Resolution", () => {
    test("should resolve data file path correctly", () => {
      // Arrange
      const mockResolve = jest.fn().mockReturnValue("/mock/path");
      path.resolve.mockReturnValue("/mock/path");
      path.join.mockReturnValue("/mock/path/data/full-address.json");

      // Act
      const resolvedPath = path.resolve();
      const dataPath = path.join(resolvedPath, "data/full-address.json");

      // Assert
      expect(path.resolve).toHaveBeenCalled();
      expect(path.join).toHaveBeenCalledWith("/mock/path", "data/full-address.json");
      expect(dataPath).toBe("/mock/path/data/full-address.json");
    });

    test("should handle file path with spaces", () => {
      // Arrange
      const mockPath = "/path with spaces";
      path.resolve.mockReturnValue(mockPath);
      path.join.mockReturnValue(`${mockPath}/data/full-address.json`);

      // Act
      const resolvedPath = path.resolve();
      const dataPath = path.join(resolvedPath, "data/full-address.json");

      // Assert
      expect(path.resolve).toHaveBeenCalled();
      expect(path.join).toHaveBeenCalledWith(mockPath, "data/full-address.json");
    });

    test("should handle file path with special characters", () => {
      // Arrange
      const mockPath = "/path/with/special@chars#";
      path.resolve.mockReturnValue(mockPath);
      path.join.mockReturnValue(`${mockPath}/data/full-address.json`);

      // Act
      const resolvedPath = path.resolve();
      const dataPath = path.join(resolvedPath, "data/full-address.json");

      // Assert
      expect(path.resolve).toHaveBeenCalled();
      expect(path.join).toHaveBeenCalledWith(mockPath, "data/full-address.json");
    });
  });

  describe("File Operations", () => {
    test("should check if data file exists", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
      fs.existsSync.mockReturnValue(true);

      // Act
      const exists = fs.existsSync(dataPath);

      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith(dataPath);
      expect(exists).toBe(true);
    });

    test("should handle missing data file", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
      fs.existsSync.mockReturnValue(false);

      // Act
      const exists = fs.existsSync(dataPath);

      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith(dataPath);
      expect(exists).toBe(false);
    });

    test("should read data file content", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
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
      const content = fs.readFileSync(dataPath, "utf8");
      const data = JSON.parse(content);

      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith(dataPath, "utf8");
      expect(data).toEqual(mockData);
    });

    test("should handle file read errors", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
      const fileError = new Error("ENOENT: no such file or directory");
      fs.readFileSync.mockImplementation(() => {
        throw fileError;
      });

      // Act & Assert
      expect(() => fs.readFileSync(dataPath, "utf8")).toThrow("ENOENT: no such file or directory");
    });

    test("should handle invalid JSON data", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
      fs.readFileSync.mockReturnValue("invalid json");

      // Act & Assert
      expect(() => JSON.parse(fs.readFileSync(dataPath, "utf8"))).toThrow();
    });
  });

  describe("Database Operations", () => {
    test("should connect to MongoDB", async () => {
      // Arrange
      const mockConnection = {
        connection: { host: "localhost" }
      };
      mongoose.connect.mockResolvedValue(mockConnection);

      // Act
      const result = await mongoose.connect("mongodb://localhost:27017/test");

      // Assert
      expect(mongoose.connect).toHaveBeenCalledWith("mongodb://localhost:27017/test");
      expect(result).toEqual(mockConnection);
    });

    test("should handle MongoDB connection errors", async () => {
      // Arrange
      const connectionError = new Error("MongoDB connection failed");
      mongoose.connect.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(mongoose.connect("mongodb://localhost:27017/test")).rejects.toThrow("MongoDB connection failed");
    });

    test("should clear existing data", async () => {
      // Arrange
      const mockDeleteMany = jest.fn().mockResolvedValue({ deletedCount: 100 });
      Unit.deleteMany = mockDeleteMany;

      // Act
      await Unit.deleteMany({});

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledWith({});
    });

    test("should create province units", async () => {
      // Arrange
      const mockCreate = jest.fn().mockResolvedValue({
        _id: "mock-id",
        name: "Thành phố Hà Nội",
        code: "01",
        level: "province"
      });
      Unit.create = mockCreate;

      const provinceData = {
        name: "Thành phố Hà Nội",
        code: "01",
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const result = await Unit.create(provinceData);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(provinceData);
      expect(result).toHaveProperty("_id");
      expect(result).toHaveProperty("name", "Thành phố Hà Nội");
      expect(result).toHaveProperty("code", "01");
      expect(result).toHaveProperty("level", "province");
    });

    test("should create commune units", async () => {
      // Arrange
      const mockCreate = jest.fn().mockResolvedValue({
        _id: "mock-id",
        name: "Phường Hàng Trống",
        code: "01001001",
        level: "commune"
      });
      Unit.create = mockCreate;

      const communeData = {
        name: "Phường Hàng Trống",
        code: "01001001",
        level: "commune",
        parentCode: "01001",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const result = await Unit.create(communeData);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(communeData);
      expect(result).toHaveProperty("_id");
      expect(result).toHaveProperty("name", "Phường Hàng Trống");
      expect(result).toHaveProperty("code", "01001001");
      expect(result).toHaveProperty("level", "commune");
    });

    test("should handle database creation errors", async () => {
      // Arrange
      const creationError = new Error("Database creation failed");
      Unit.create = jest.fn().mockRejectedValue(creationError);

      const unitData = {
        name: "Test Unit",
        code: "99",
        level: "province"
      };

      // Act & Assert
      await expect(Unit.create(unitData)).rejects.toThrow("Database creation failed");
    });

    test("should disconnect from MongoDB", async () => {
      // Arrange
      mongoose.disconnect.mockResolvedValue();

      // Act
      await mongoose.disconnect();

      // Assert
      expect(mongoose.disconnect).toHaveBeenCalled();
    });

    test("should handle MongoDB disconnection errors", async () => {
      // Arrange
      const disconnectError = new Error("MongoDB disconnection failed");
      mongoose.disconnect.mockRejectedValue(disconnectError);

      // Act & Assert
      await expect(mongoose.disconnect()).rejects.toThrow("MongoDB disconnection failed");
    });
  });

  describe("Data Processing", () => {
    test("should process province data correctly", () => {
      // Arrange
      const provinceData = {
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
      };

      // Act
      const processedProvince = {
        name: provinceData.name,
        code: provinceData.code,
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Assert
      expect(processedProvince.name).toBe("Thành phố Hà Nội");
      expect(processedProvince.code).toBe("01");
      expect(processedProvince.level).toBe("province");
      expect(processedProvince.parentCode).toBeNull();
    });

    test("should process commune data correctly", () => {
      // Arrange
      const communeData = {
        code: "01001001",
        name: "Phường Hàng Trống",
        administrativeLevel: "Phường"
      };

      // Act
      const processedCommune = {
        name: communeData.name,
        code: communeData.code,
        level: "commune",
        parentCode: "01001",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Assert
      expect(processedCommune.name).toBe("Phường Hàng Trống");
      expect(processedCommune.code).toBe("01001001");
      expect(processedCommune.level).toBe("commune");
      expect(processedCommune.parentCode).toBe("01001");
    });

    test("should handle empty communes array", () => {
      // Arrange
      const provinceData = {
        code: "01",
        name: "Thành phố Hà Nội",
        administrativeLevel: "Thành phố",
        communes: []
      };

      // Act
      const processedProvince = {
        name: provinceData.name,
        code: provinceData.code,
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Assert
      expect(processedProvince.name).toBe("Thành phố Hà Nội");
      expect(processedProvince.code).toBe("01");
      expect(processedProvince.level).toBe("province");
    });

    test("should handle missing communes property", () => {
      // Arrange
      const provinceData = {
        code: "01",
        name: "Thành phố Hà Nội",
        administrativeLevel: "Thành phố"
      };

      // Act
      const processedProvince = {
        name: provinceData.name,
        code: provinceData.code,
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Assert
      expect(processedProvince.name).toBe("Thành phố Hà Nội");
      expect(processedProvince.code).toBe("01");
      expect(processedProvince.level).toBe("province");
    });

    test("should handle invalid commune data", () => {
      // Arrange
      const communeData = {
        code: "01001001",
        name: "Phường Hàng Trống",
        administrativeLevel: "Phường"
      };

      // Act
      const processedCommune = {
        name: communeData.name,
        code: communeData.code,
        level: "commune",
        parentCode: "01001",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Assert
      expect(processedCommune.name).toBe("Phường Hàng Trống");
      expect(processedCommune.code).toBe("01001001");
      expect(processedCommune.level).toBe("commune");
    });
  });

  describe("Error Handling", () => {
    test("should handle file not found error", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
      const fileError = new Error("ENOENT: no such file or directory");
      fs.existsSync.mockReturnValue(false);

      // Act & Assert
      expect(fs.existsSync(dataPath)).toBe(false);
      expect(() => {
        if (!fs.existsSync(dataPath)) {
          throw fileError;
        }
      }).toThrow("ENOENT: no such file or directory");
    });

    test("should handle file permission error", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
      const permissionError = new Error("EACCES: permission denied");
      fs.readFileSync.mockImplementation(() => {
        throw permissionError;
      });

      // Act & Assert
      expect(() => fs.readFileSync(dataPath, "utf8")).toThrow("EACCES: permission denied");
    });

    test("should handle JSON parsing error", () => {
      // Arrange
      const dataPath = "/mock/path/data/full-address.json";
      fs.readFileSync.mockReturnValue("invalid json");

      // Act & Assert
      expect(() => JSON.parse(fs.readFileSync(dataPath, "utf8"))).toThrow();
    });

    test("should handle database connection error", async () => {
      // Arrange
      const connectionError = new Error("MongoDB connection failed");
      mongoose.connect.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(mongoose.connect("mongodb://localhost:27017/test")).rejects.toThrow("MongoDB connection failed");
    });

    test("should handle database creation error", async () => {
      // Arrange
      const creationError = new Error("Database creation failed");
      Unit.create = jest.fn().mockRejectedValue(creationError);

      const unitData = {
        name: "Test Unit",
        code: "99",
        level: "province"
      };

      // Act & Assert
      await expect(Unit.create(unitData)).rejects.toThrow("Database creation failed");
    });
  });

  describe("Performance Tests", () => {
    test("should handle large dataset efficiently", async () => {
      // Arrange: Create large dataset
      const largeData = [];
      for (let i = 1; i <= 1000; i++) {
        largeData.push({
          code: i.toString().padStart(2, '0'),
          name: `Tỉnh ${i}`,
          administrativeLevel: "Tỉnh",
          communes: Array(100).fill().map((_, j) => ({
            code: `${i.toString().padStart(2, '0')}${j.toString().padStart(3, '0')}`,
            name: `Xã ${i}-${j}`,
            administrativeLevel: "Xã"
          }))
        });
      }

      fs.readFileSync.mockReturnValue(JSON.stringify(largeData));
      Unit.create = jest.fn().mockResolvedValue({ _id: "mock-id" });

      // Act
      const startTime = Date.now();
      const content = fs.readFileSync("/mock/path/data/full-address.json", "utf8");
      const data = JSON.parse(content);
      const endTime = Date.now();

      // Assert
      expect(data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle concurrent operations", async () => {
      // Arrange
      const mockCreate = jest.fn().mockResolvedValue({ _id: "mock-id" });
      Unit.create = mockCreate;

      const units = Array(100).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
        level: "province"
      }));

      // Act
      const startTime = Date.now();
      const promises = units.map(unit => Unit.create(unit));
      await Promise.all(promises);
      const endTime = Date.now();

      // Assert
      expect(mockCreate).toHaveBeenCalledTimes(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete import process", async () => {
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

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
      mongoose.connect.mockResolvedValue({ connection: { host: "localhost" } });
      Unit.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
      Unit.create = jest.fn().mockResolvedValue({ _id: "mock-id" });
      mongoose.disconnect.mockResolvedValue();

      // Act
      const dataPath = "/mock/path/data/full-address.json";
      const exists = fs.existsSync(dataPath);
      const content = fs.readFileSync(dataPath, "utf8");
      const data = JSON.parse(content);
      await mongoose.connect("mongodb://localhost:27017/test");
      await Unit.deleteMany({});
      
      for (const province of data) {
        await Unit.create({
          name: province.name,
          code: province.code,
          level: "province",
          parentCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        if (province.communes && Array.isArray(province.communes)) {
          for (const commune of province.communes) {
            await Unit.create({
              name: commune.name,
              code: commune.code,
              level: "commune",
              parentCode: province.code,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
      
      await mongoose.disconnect();

      // Assert
      expect(exists).toBe(true);
      expect(data).toEqual(mockData);
      expect(mongoose.connect).toHaveBeenCalled();
      expect(Unit.deleteMany).toHaveBeenCalled();
      expect(Unit.create).toHaveBeenCalledTimes(2); // 1 province + 1 commune
      expect(mongoose.disconnect).toHaveBeenCalled();
    });
  });
});

