// tests/performance/bulkInsert.test.js
import request from "supertest";
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Set test environment to prevent JSON file writing
process.env.NODE_ENV = 'test';

// Create test app without connecting to real database
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import unitsRoutes from "../../server/routes/units.js";
import searchRoutes from "../../server/routes/search.js";
import treeRoutes from "../../server/routes/tree.js";
import { notFoundHandler, errorHandler } from "../../server/middleware/errorHandler.js";

// Mount routes
app.use("/units", unitsRoutes);
app.use("/search", searchRoutes);
app.use("/tree", treeRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

describe("⚡ Bulk Insert Performance Tests", () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
    
    // Wait for connection to be ready
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
    
    // Wait a bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
    
    // Wait a bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe("Bulk Insert Performance", () => {
    test("should handle 2 units efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
    });

    test("should handle mixed level units efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = [
        {
          name: "Tỉnh 1",
          code: `${timestamp}01`,
          level: "province",
          parentCode: null
        },
        {
          name: "Xã 1-1",
          code: `${timestamp}0101`,
          level: "commune",
          parentCode: `${timestamp}01`,
          provinceCode: `${timestamp}01`,
          provinceName: "Tỉnh 1"
        }
      ];

      // Act
      const startTime = Date.now();
      
      // Create province first
      const provinceResponse = await request(app).post("/units").send(units[0]);
      expect(provinceResponse.status).toBe(201);
      
      // Then create commune
      const communeResponse = await request(app).post("/units").send(units[1]);
      expect(communeResponse.status).toBe(201);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
      
      const provinces = await Unit.find({ level: "province" });
      const communes = await Unit.find({ level: "commune" });
      
      expect(provinces).toHaveLength(1);
      expect(communes).toHaveLength(1);
    });
  });

  describe("Concurrent Operations Performance", () => {
    test("should handle concurrent bulk inserts efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
      const createPromises = units.map(async (unit) => {
        const response = await request(app).post("/units").send(unit);
        expect(response.status).toBe(201);
        return response;
      });
      
      await Promise.all(createPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
    });

    test("should handle concurrent mixed operations efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
      // Create units concurrently
      const createPromises = units.map(unit => 
        request(app).post("/units").send(unit)
      );
      
      await Promise.all(createPromises);
      
      // Update units concurrently
      const updatePromises = units.map(unit => 
        request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` })
      );
      
      await Promise.all(updatePromises);
      
      // Get units concurrently
      const getPromises = units.map(unit => 
        request(app).get(`/units/${unit.code}`)
      );
      
      await Promise.all(getPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
    });
  });

  describe("Memory Usage Performance", () => {
    test("should handle dataset without memory issues", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(4, '0')}`,
        level: "province",
        parentCode: null,
        description: `Description for unit ${i}`.repeat(10), // Smaller description
        metadata: {
          created: new Date(),
          tags: Array(2).fill().map((_, j) => `tag${j}`),
          data: Array(5).fill().map((_, k) => ({ key: `key${k}`, value: `value${k}` }))
        }
      }));

      // Act
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

      // Assert
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(memoryUsed).toBeLessThan(20 * 1024 * 1024); // Should use less than 20MB
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
    });

    test("should handle bulk operations without memory leaks", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(4, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startMemory = process.memoryUsage();
      
      // Create units
      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }
      
      // Update units
      for (const unit of units) {
        await request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` });
      }
      
      // Delete units
      for (const unit of units) {
        const deleteResponse = await request(app).delete(`/units/${unit.code}`);
        if (deleteResponse.status !== 200) {
          console.log("Delete error:", deleteResponse.body);
        }
        expect(deleteResponse.status).toBe(200);
      }
      
      const endMemory = process.memoryUsage();
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

      // Assert
      expect(memoryUsed).toBeLessThan(20 * 1024 * 1024); // Should use less than 20MB
      
      const remainingUnits = await Unit.find();
      expect(remainingUnits).toHaveLength(0);
    });
  });

  describe("Database Performance", () => {
    test("should handle bulk inserts with indexes efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(4, '0')}`,
        level: "province",
        parentCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Act
      const startTime = Date.now();
      
      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
    });

    test("should handle bulk queries efficiently", async () => {
      // Arrange: Create dataset
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(4, '0')}`,
        level: "province",
        parentCode: null
      }));

      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }

      // Act
      const startTime = Date.now();
      
      // Perform bulk queries
      const allUnitsResponse = await request(app).get("/units");
      const provincesResponse = await request(app).get("/search?level=province");
      const searchResponse = await request(app).get("/search?name=Unit");
      const treeResponse = await request(app).get("/tree");
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(allUnitsResponse.status).toBe(200);
      expect(provincesResponse.status).toBe(200);
      expect(searchResponse.status).toBe(200);
      expect(treeResponse.status).toBe(200);
    });

    test("should handle bulk updates efficiently", async () => {
      // Arrange: Create dataset
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }

      // Act
      const startTime = Date.now();
      
      // Perform bulk updates
      for (const unit of units) {
        const updateResponse = await request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` });
        if (updateResponse.status !== 200) {
          console.log("Update error:", updateResponse.body);
        }
        expect(updateResponse.status).toBe(200);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      const updatedUnits = await Unit.find();
      expect(updatedUnits).toHaveLength(2);
      expect(updatedUnits[0].name).toContain("Updated");
    });

    test("should handle bulk deletes efficiently", async () => {
      // Arrange: Create dataset
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }

      // Act
      const startTime = Date.now();
      
      // Perform bulk deletes
      for (const unit of units) {
        const deleteResponse = await request(app).delete(`/units/${unit.code}`);
        if (deleteResponse.status !== 200) {
          console.log("Delete error:", deleteResponse.body);
        }
        expect(deleteResponse.status).toBe(200);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      const remainingUnits = await Unit.find();
      expect(remainingUnits).toHaveLength(0);
    });
  });

  describe("API Performance", () => {
    test("should handle request volume efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
      // Create units
      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }
      
      // Perform multiple operations
      const operations = [];
      for (let i = 0; i < 3; i++) {
        operations.push(request(app).get("/units"));
        operations.push(request(app).get("/search"));
        operations.push(request(app).get("/tree"));
      }
      
      await Promise.all(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
    });

    test("should handle concurrent API requests efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
      // Create units concurrently
      const createPromises = units.map(async (unit) => {
        const response = await request(app).post("/units").send(unit);
        expect(response.status).toBe(201);
        return response;
      });
      
      await Promise.all(createPromises);
      
      // Perform concurrent operations
      const operationPromises = [];
      for (let i = 0; i < 5; i++) {
        operationPromises.push(request(app).get("/units"));
        operationPromises.push(request(app).get("/search"));
        operationPromises.push(request(app).get("/tree"));
      }
      
      await Promise.all(operationPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2);
    });
  });

  describe("History Performance", () => {
    test("should handle bulk operations with history efficiently", async () => {
      // Arrange
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
      // Create units
      for (const unit of units) {
        const createResponse = await request(app).post("/units").send(unit);
        expect(createResponse.status).toBe(201);
      }
      
      // Update units
      for (const unit of units) {
        const updateResponse = await request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` });
        expect(updateResponse.status).toBe(200);
      }
      
      // Delete units
      for (const unit of units) {
        const deleteResponse = await request(app).delete(`/units/${unit.code}`);
        expect(deleteResponse.status).toBe(200);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const history = await UnitHistory.find();
      expect(history.length).toBeGreaterThanOrEqual(4); // At least 2 update + 2 delete
    });

    test("should handle history queries efficiently", async () => {
      // Arrange: Create units with history
      const timestamp = Date.now();
      const units = Array(2).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${timestamp}${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      for (const unit of units) {
        const createResponse = await request(app).post("/units").send(unit);
        expect(createResponse.status).toBe(201);
        
        const updateResponse = await request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` });
        expect(updateResponse.status).toBe(200);
        
        const deleteResponse = await request(app).delete(`/units/${unit.code}`);
        expect(deleteResponse.status).toBe(200);
      }

      // Act
      const startTime = Date.now();
      
      // Query history for all units
      const historyPromises = units.map(unit => 
        request(app).get(`/units/${unit.code}/history`)
      );
      
      await Promise.all(historyPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      const history = await UnitHistory.find();
      expect(history.length).toBeGreaterThanOrEqual(4); // At least 2 * 2 operations
    });
  });
});
