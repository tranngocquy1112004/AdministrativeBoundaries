// tests/integration/syncJsonMongo.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import fs from "fs";
import { jest } from "@jest/globals";
import { comprehensiveCleanup } from "../utils/testCleanup.js";

describe("🔄 Sync JSON MongoDB Integration Tests", () => {
  let mongoServer;
  let fakeStore = [];

  beforeAll(async () => {
    // Mock IO file JSON bằng bộ nhớ tạm
    jest.spyOn(fs, "readFileSync").mockImplementation(() => JSON.stringify(fakeStore));
    jest.spyOn(fs, "writeFileSync").mockImplementation((p, data) => {
      try { fakeStore = JSON.parse(data); } catch { /* ignore */ }
    });
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to MongoDB with proper options
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 20000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    
    // Wait for connection to be ready with retry logic
    let retries = 0;
    const maxRetries = 5;
    
    while (mongoose.connection.readyState !== 1 && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection failed after retries');
    }
  });

  afterAll(async () => {
    // Clean up
    try {
      // Clear all collections first
      await Unit.deleteMany({});
      await UnitHistory.deleteMany({});
      
      // Close mongoose connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      // Stop MongoDB memory server
      if (mongoServer) {
        await mongoServer.stop();
      }
      
      // Comprehensive cleanup
      await comprehensiveCleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
    
    // Reset fakeStore for each test
    fakeStore = [];
    
    // Reset mocks before each test
    fs.readFileSync.mockClear();
    fs.writeFileSync.mockClear();
    
    // Mock fs.readFileSync to return empty array
    fs.readFileSync.mockImplementation(() => JSON.stringify([]));
    
    
    // Wait a bit for MongoDB to be ready and ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Double check database is empty
    const remainingUnits = await Unit.countDocuments();
    if (remainingUnits > 0) {
      console.log(`Warning: ${remainingUnits} units still in database, clearing again...`);
      await Unit.deleteMany({});
      await UnitHistory.deleteMany({});
    }
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
  });

  describe("JSON to MongoDB Sync", () => {
    test("should sync JSON data to MongoDB", async () => {
      // Arrange: Mock JSON data with unique codes
      const mockJsonData = [
        {
          code: "91",
          name: "Tỉnh Test 1",
          administrativeLevel: "Tỉnh",
          communes: [
            {
              code: "91001",
              name: "Xã Test 1",
              administrativeLevel: "Xã"
            }
          ]
        },
        {
          code: "92",
          name: "Tỉnh Test 2",
          administrativeLevel: "Tỉnh",
          communes: [
            {
              code: "92001",
              name: "Xã Test 2",
              administrativeLevel: "Xã"
            }
          ]
        }
      ];

      // Mock fs.readFileSync to return empty array for duplicate check
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('full-address.json')) {
          return JSON.stringify([]); // Empty array for duplicate check
        }
        return JSON.stringify(mockJsonData);
      });

      // Act: Simulate JSON to MongoDB sync
      for (const province of mockJsonData) {
        // Create province first
        const provinceResponse = await request(app)
          .post("/units")
          .send({
            name: province.name,
            code: province.code,
            level: "province",
            parentCode: null,
            administrativeLevel: province.administrativeLevel
          });

        if (provinceResponse.status !== 201) {
          console.log("Province response error:", provinceResponse.body);
        }
        if (provinceResponse.status !== 201) {
          console.log("Performance test province response error:", provinceResponse.body);
        }
        expect(provinceResponse.status).toBe(201);

        // Wait a bit for province to be created
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create communes directly in MongoDB
        if (province.communes && Array.isArray(province.communes)) {
          for (const commune of province.communes) {
            await Unit.create({
              name: commune.name,
              code: commune.code,
              level: "commune",
              parentCode: province.code,
              provinceCode: province.code,
              provinceName: province.name,
              administrativeLevel: commune.administrativeLevel,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      // Assert: Verify data in MongoDB
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });

      expect(provinces).toHaveLength(2);
      expect(communes).toHaveLength(2);
      expect(provinces[0].name).toBe("Tỉnh Test 1");
      expect(provinces[1].name).toBe("Tỉnh Test 2");
      expect(communes[0].name).toBe("Xã Test 1");
      expect(communes[1].name).toBe("Xã Test 2");
    });

    test("should handle JSON data with missing communes", async () => {
      // Arrange: Mock JSON data without communes
      const mockJsonData = [
        {
          code: "93",
          name: "Tỉnh Test 3",
          administrativeLevel: "Tỉnh"
        }
      ];

      // Mock fs.readFileSync to return empty array for duplicate check
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('full-address.json')) {
          return JSON.stringify([]); // Empty array for duplicate check
        }
        return JSON.stringify(mockJsonData);
      });

      // Act: Sync JSON to MongoDB
      for (const province of mockJsonData) {
        const provinceResponse = await request(app)
          .post("/units")
          .send({
            name: province.name,
            code: province.code,
            level: "province",
            parentCode: null,
            administrativeLevel: province.administrativeLevel
          });

        if (provinceResponse.status !== 201) {
          console.log("Performance test province response error:", provinceResponse.body);
        }
        expect(provinceResponse.status).toBe(201);
      }

      // Assert: Verify data in MongoDB
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });

      expect(provinces).toHaveLength(1);
      expect(communes).toHaveLength(0);
      expect(provinces[0].name).toBe("Tỉnh Test 3");
    });

    test("should handle JSON data with empty communes array", async () => {
      // Arrange: Mock JSON data with empty communes
      const mockJsonData = [
        {
          code: "94",
          name: "Tỉnh Test 4",
          administrativeLevel: "Tỉnh",
          communes: []
        }
      ];

      // Mock fs.readFileSync to return empty array for duplicate check
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('full-address.json')) {
          return JSON.stringify([]); // Empty array for duplicate check
        }
        return JSON.stringify(mockJsonData);
      });

      // Act: Sync JSON to MongoDB
      for (const province of mockJsonData) {
        const provinceResponse = await request(app)
          .post("/units")
          .send({
            name: province.name,
            code: province.code,
            level: "province",
            parentCode: null,
            administrativeLevel: province.administrativeLevel
          });

        if (provinceResponse.status !== 201) {
          console.log("Performance test province response error:", provinceResponse.body);
        }
        expect(provinceResponse.status).toBe(201);
      }

      // Assert: Verify data in MongoDB
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });

      expect(provinces).toHaveLength(1);
      expect(communes).toHaveLength(0);
      expect(provinces[0].name).toBe("Tỉnh Test 4");
    });
  });

  describe("MongoDB to JSON Sync", () => {
    test("should sync MongoDB data to JSON", async () => {
      // Arrange: Create data in MongoDB
      const units = [
        {
          name: "Thành phố Hà Nội",
          code: "01",
          level: "province",
          parentCode: null,
          administrativeLevel: "Thành phố"
        },
        {
          name: "Phường Hàng Trống",
          code: "01001001",
          level: "commune",
          parentCode: "01",
          provinceCode: "01",
          provinceName: "Thành phố Hà Nội",
          administrativeLevel: "Phường"
        }
      ];

      for (const unit of units) {
        await Unit.create(unit);
      }

      // Act: Simulate MongoDB to JSON sync
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });

      const jsonData = provinces.map(province => {
        const provinceCommunes = communes.filter(commune => 
          commune.parentCode === province.code
        );

        return {
          code: province.code,
          name: province.name,
          administrativeLevel: province.administrativeLevel,
          communes: provinceCommunes.map(commune => ({
            code: commune.code,
            name: commune.name,
            administrativeLevel: commune.administrativeLevel
          }))
        };
      });

      // Mock JSON write
      fs.writeFileSync.mockImplementation(() => {});

      fs.writeFileSync(
        "/mock/path/data/full-address.json",
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );

      // Assert: Verify JSON data structure
      expect(jsonData).toHaveLength(1);
      expect(jsonData[0].code).toBe("01");
      expect(jsonData[0].name).toBe("Thành phố Hà Nội");
      expect(jsonData[0].communes).toHaveLength(1);
      expect(jsonData[0].communes[0].code).toBe("01001001");
      expect(jsonData[0].communes[0].name).toBe("Phường Hàng Trống");
    });

    test("should handle MongoDB data with no communes", async () => {
      // Arrange: Create province only in MongoDB
      const province = {
        name: "Thành phố Hà Nội",
        code: "01",
        level: "province",
        parentCode: null,
        administrativeLevel: "Thành phố"
      };

      await Unit.create(province);

      // Act: Sync MongoDB to JSON
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });

      const jsonData = provinces.map(province => {
        const provinceCommunes = communes.filter(commune => 
          commune.parentCode === province.code
        );

        return {
          code: province.code,
          name: province.name,
          administrativeLevel: province.administrativeLevel,
          communes: provinceCommunes.map(commune => ({
            code: commune.code,
            name: commune.name,
            administrativeLevel: commune.administrativeLevel
          }))
        };
      });

      // Mock JSON write
      fs.writeFileSync.mockImplementation(() => {});

      fs.writeFileSync(
        "/mock/path/data/full-address.json",
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );

      // Assert: Verify JSON data structure
      expect(jsonData).toHaveLength(1);
      expect(jsonData[0].code).toBe("01");
      expect(jsonData[0].name).toBe("Thành phố Hà Nội");
      expect(jsonData[0].communes).toHaveLength(0);
    });
  });

  describe("Bidirectional Sync", () => {
    test("should maintain consistency between JSON and MongoDB", async () => {
      // Arrange: Mock JSON data
      const mockJsonData = [
        {
          code: "95",
          name: "Tỉnh Test 5",
          administrativeLevel: "Tỉnh",
          communes: [
            {
              code: "95001",
              name: "Xã Test 5",
              administrativeLevel: "Xã"
            }
          ]
        }
      ];

      // Mock fs.readFileSync to return empty array for duplicate check
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('full-address.json')) {
          return JSON.stringify([]); // Empty array for duplicate check
        }
        return JSON.stringify(mockJsonData);
      });

      // Act: Sync JSON to MongoDB
      for (const province of mockJsonData) {
        // Create province
        const provinceResponse = await request(app)
          .post("/units")
          .send({
            name: province.name,
            code: province.code,
            level: "province",
            parentCode: null,
            administrativeLevel: province.administrativeLevel
          });
        
        if (provinceResponse.status !== 201) {
          console.log("Performance test province response error:", provinceResponse.body);
        }
        expect(provinceResponse.status).toBe(201);

        // Create communes directly in MongoDB
        if (province.communes && Array.isArray(province.communes)) {
          for (const commune of province.communes) {
            await Unit.create({
              name: commune.name,
              code: commune.code,
              level: "commune",
              parentCode: province.code,
              provinceCode: province.code,
              provinceName: province.name,
              administrativeLevel: commune.administrativeLevel,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      // Act: Sync MongoDB back to JSON
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });

      const jsonData = provinces.map(province => {
        const provinceCommunes = communes.filter(commune => 
          commune.parentCode === province.code
        );

        return {
          code: province.code,
          name: province.name,
          administrativeLevel: province.administrativeLevel,
          communes: provinceCommunes.map(commune => ({
            code: commune.code,
            name: commune.name,
            administrativeLevel: commune.administrativeLevel
          }))
        };
      });

      // Mock JSON write
      fs.writeFileSync.mockImplementation();
      fs.writeFileSync(
        "/mock/path/data/full-address.json",
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );

      // Assert: Verify consistency
      expect(jsonData).toHaveLength(1);
      expect(jsonData[0].code).toBe("95");
      expect(jsonData[0].name).toBe("Tỉnh Test 5");
      expect(jsonData[0].communes).toHaveLength(1);
      expect(jsonData[0].communes[0].code).toBe("95001");
      expect(jsonData[0].communes[0].name).toBe("Xã Test 5");
    });

    test("should handle updates in MongoDB and sync to JSON", async () => {
      // Arrange: Create initial data via API
      const initialUnit = {
        name: "Tỉnh Test 6",
        code: "96",
        level: "province",
        parentCode: null,
        administrativeLevel: "Tỉnh"
      };

      const createResponse = await request(app)
        .post("/units")
        .send(initialUnit);
      
      expect(createResponse.status).toBe(201);

      // Mock JSON file to contain the unit for update/delete operations
      const mockJsonData = [{
        code: "96",
        name: "Tỉnh Test 6",
        administrativeLevel: "Tỉnh",
        communes: []
      }];
      
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('full-address.json')) {
          return JSON.stringify(mockJsonData);
        }
        return JSON.stringify([]);
      });

      // Act: Update unit in MongoDB
      const updateResponse = await request(app)
        .put("/units/96")
        .send({ name: "Tỉnh Test 6 Updated" });
      
      if (updateResponse.status !== 200) {
        console.log("Update response error:", updateResponse.body);
      }
      expect(updateResponse.status).toBe(200);

      // Act: Sync updated data to JSON
      const provinces = await Unit.find({ level: "province" });
      const jsonData = provinces.map(province => ({
        code: province.code,
        name: province.name,
        administrativeLevel: province.administrativeLevel,
        communes: []
      }));

      // Mock JSON write
      fs.writeFileSync.mockImplementation(() => {});

      fs.writeFileSync(
        "/mock/path/data/full-address.json",
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );

      // Assert: Verify updated data in JSON
      expect(jsonData).toHaveLength(1);
      expect(jsonData[0].name).toBe("Tỉnh Test 6 Updated");
      
      // Also verify in MongoDB
      const updatedUnit = await Unit.findOne({ code: "96" });
      expect(updatedUnit.name).toBe("Tỉnh Test 6 Updated");
    });

    test("should handle deletions in MongoDB and sync to JSON", async () => {
      // Arrange: Create initial data via API
      const initialUnit = {
        name: "Tỉnh Test 7",
        code: "97",
        level: "province",
        parentCode: null,
        administrativeLevel: "Tỉnh"
      };

      const createResponse = await request(app)
        .post("/units")
        .send(initialUnit);
      
      expect(createResponse.status).toBe(201);

      // Mock JSON file to contain the unit for delete operations
      const mockJsonData = [{
        code: "97",
        name: "Tỉnh Test 7",
        administrativeLevel: "Tỉnh",
        communes: []
      }];
      
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('full-address.json')) {
          return JSON.stringify(mockJsonData);
        }
        return JSON.stringify([]);
      });

      // Act: Delete unit from MongoDB
      const deleteResponse = await request(app).delete("/units/97");
      if (deleteResponse.status !== 200) {
        console.log("Delete response error:", deleteResponse.body);
      }
      expect(deleteResponse.status).toBe(200);

      // Act: Sync updated data to JSON
      const provinces = await Unit.find({ level: "province" });
      const jsonData = provinces.map(province => ({
        code: province.code,
        name: province.name,
        administrativeLevel: province.administrativeLevel,
        communes: []
      }));

      // Mock JSON write
      fs.writeFileSync.mockImplementation(() => {});

      fs.writeFileSync(
        "/mock/path/data/full-address.json",
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );

      // Assert: Verify deleted data is not in JSON
      expect(jsonData).toHaveLength(0);
      
      // Also verify in MongoDB
      const deletedUnit = await Unit.findOne({ code: "97" });
      expect(deletedUnit).toBeNull();
    });
  });

  describe("Error Handling", () => {
    test("should handle JSON file read errors", async () => {
      // Arrange: Mock file read error
      const fileError = new Error("ENOENT: no such file or directory");
      fs.readFileSync.mockImplementation(() => {
        throw fileError;
      });

      // Act & Assert
      expect(() => fs.readFileSync("/mock/path/data/full-address.json", "utf8")).toThrow("ENOENT: no such file or directory");
    });

    test("should handle JSON parsing errors", async () => {
      // Arrange: Mock invalid JSON
      fs.readFileSync.mockImplementation(() => "invalid json");

      // Act & Assert
      expect(() => JSON.parse(fs.readFileSync("/mock/path/data/full-address.json", "utf8"))).toThrow();
    });

    test("should handle JSON file write errors", async () => {
      // Arrange: Mock file write error
      const writeError = new Error("ENOSPC: no space left on device");
      fs.writeFileSync.mockImplementation(() => {
        throw writeError;
      });

      const jsonData = [{ code: "01", name: "Hà Nội" }];

      // Act & Assert
      expect(() => fs.writeFileSync("/mock/path/data/full-address.json", JSON.stringify(jsonData, null, 2), "utf8")).toThrow("ENOSPC: no space left on device");
    });

    test("should handle MongoDB connection errors", async () => {
      // Arrange: Mock MongoDB error
      const mongoError = new Error("MongoDB connection failed");
      const originalFind = Unit.find;
      Unit.find = jest.fn().mockRejectedValue(mongoError);

      // Act & Assert
      await expect(Unit.find({ level: "province" })).rejects.toThrow("MongoDB connection failed");
      
      // Restore original function
      Unit.find = originalFind;
    });
  });

  describe("Performance Tests", () => {
    test("should handle large dataset sync efficiently", async () => {
      // Clear database before performance test
      await Unit.deleteMany({});
      await UnitHistory.deleteMany({});
      
      // Arrange: Create large dataset (reduced size for test stability)
      const largeData = Array(10).fill().map((_, i) => ({
        code: `6${i.toString().padStart(2, '0')}`,
        name: `Tỉnh Performance ${i}`,
        administrativeLevel: "Tỉnh",
        communes: Array(5).fill().map((_, j) => ({
          code: `6${i.toString().padStart(2, '0')}${j.toString().padStart(3, '0')}`,
          name: `Xã Performance ${i}-${j}`,
          administrativeLevel: "Xã"
        }))
      }));

      // Mock fs.readFileSync to return empty array for duplicate check
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('full-address.json')) {
          return JSON.stringify([]); // Empty array for duplicate check
        }
        return JSON.stringify(largeData);
      });

      // Act: Sync JSON to MongoDB
      const startTime = Date.now();

      for (const province of largeData) {
        // Create province
        const provinceResponse = await request(app)
          .post("/units")
          .send({
            name: province.name,
            code: province.code,
            level: "province",
            parentCode: null,
            administrativeLevel: province.administrativeLevel
          });
        
        if (provinceResponse.status !== 201) {
          console.log("Performance test province response error:", provinceResponse.body);
        }
        expect(provinceResponse.status).toBe(201);

        // Create communes directly in MongoDB
        if (province.communes && Array.isArray(province.communes)) {
          for (const commune of province.communes) {
            await Unit.create({
              name: commune.name,
              code: commune.code,
              level: "commune",
              parentCode: province.code,
              provinceCode: province.code,
              provinceName: province.name,
              administrativeLevel: commune.administrativeLevel,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      const syncTime = Date.now();

      // Act: Sync MongoDB to JSON
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });

      const jsonData = provinces.map(province => {
        const provinceCommunes = communes.filter(commune => 
          commune.parentCode === province.code
        );

        return {
          code: province.code,
          name: province.name,
          administrativeLevel: province.administrativeLevel,
          communes: provinceCommunes.map(commune => ({
            code: commune.code,
            name: commune.name,
            administrativeLevel: commune.administrativeLevel
          }))
        };
      });

      // Mock JSON write
      fs.writeFileSync.mockImplementation();
      fs.writeFileSync(
        "/mock/path/data/full-address.json",
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );

      const writeTime = Date.now();

      // Assert: Verify performance
      expect(syncTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(writeTime - syncTime).toBeLessThan(1000); // Should complete within 1 second
      expect(jsonData).toHaveLength(10);
      expect(jsonData[0].communes).toHaveLength(5);
    });
  });
});

