// tests/performance/bulkInsert.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

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
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
  });

  describe("Bulk Insert Performance", () => {
    test("should handle 100 units efficiently", async () => {
      // Arrange
      const units = Array(100).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
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
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(100);
    });

    test("should handle 500 units efficiently", async () => {
      // Arrange
      const units = Array(500).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
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
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(500);
    });

    test("should handle 1000 units efficiently", async () => {
      // Arrange
      const units = Array(1000).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(4, '0')}`,
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
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(1000);
    });

    test("should handle mixed level units efficiently", async () => {
      // Arrange
      const units = [];
      
      // Create 100 provinces
      for (let i = 1; i <= 100; i++) {
        units.push({
          name: `Tỉnh ${i}`,
          code: `${i.toString().padStart(2, '0')}`,
          level: "province",
          parentCode: null
        });
      }
      
      // Create 500 districts
      for (let i = 1; i <= 100; i++) {
        for (let j = 1; j <= 5; j++) {
          units.push({
            name: `Huyện ${i}-${j}`,
            code: `${i.toString().padStart(2, '0')}${j.toString().padStart(2, '0')}`,
            level: "district",
            parentCode: `${i.toString().padStart(2, '0')}`
          });
        }
      }
      
      // Create 1000 communes
      for (let i = 1; i <= 100; i++) {
        for (let j = 1; j <= 5; j++) {
          for (let k = 1; k <= 2; k++) {
            units.push({
              name: `Xã ${i}-${j}-${k}`,
              code: `${i.toString().padStart(2, '0')}${j.toString().padStart(2, '0')}${k.toString().padStart(2, '0')}`,
              level: "commune",
              parentCode: `${i.toString().padStart(2, '0')}${j.toString().padStart(2, '0')}`
            });
          }
        }
      }

      // Act
      const startTime = Date.now();
      
      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(1600); // 100 + 500 + 1000
      
      const provinces = await Unit.find({ level: "province" });
      const districts = await Unit.find({ level: "district" });
      const communes = await Unit.find({ level: "commune" });
      
      expect(provinces).toHaveLength(100);
      expect(districts).toHaveLength(500);
      expect(communes).toHaveLength(1000);
    });
  });

  describe("Concurrent Operations Performance", () => {
    test("should handle concurrent bulk inserts efficiently", async () => {
      // Arrange
      const batchSize = 50;
      const numberOfBatches = 10;
      const units = Array(batchSize * numberOfBatches).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
      const batches = [];
      for (let i = 0; i < units.length; i += batchSize) {
        const batch = units.slice(i, i + batchSize);
        const batchPromises = batch.map(unit => 
          request(app).post("/units").send(unit)
        );
        batches.push(Promise.all(batchPromises));
      }
      
      await Promise.all(batches);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(500);
    });

    test("should handle concurrent mixed operations efficiently", async () => {
      // Arrange
      const units = Array(100).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
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
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(100);
    });
  });

  describe("Memory Usage Performance", () => {
    test("should handle large dataset without memory issues", async () => {
      // Arrange
      const units = Array(2000).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(4, '0')}`,
        level: "province",
        parentCode: null,
        description: `Description for unit ${i}`.repeat(100), // Large description
        metadata: {
          created: new Date(),
          tags: Array(10).fill().map((_, j) => `tag${j}`),
          data: Array(100).fill().map((_, k) => ({ key: `key${k}`, value: `value${k}` }))
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
      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
      expect(memoryUsed).toBeLessThan(100 * 1024 * 1024); // Should use less than 100MB
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(2000);
    });

    test("should handle bulk operations without memory leaks", async () => {
      // Arrange
      const units = Array(1000).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(4, '0')}`,
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
        await request(app).delete(`/units/${unit.code}`);
      }
      
      const endMemory = process.memoryUsage();
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

      // Assert
      expect(memoryUsed).toBeLessThan(50 * 1024 * 1024); // Should use less than 50MB
      
      const remainingUnits = await Unit.find();
      expect(remainingUnits).toHaveLength(0);
    });
  });

  describe("Database Performance", () => {
    test("should handle bulk inserts with indexes efficiently", async () => {
      // Arrange
      const units = Array(1000).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(4, '0')}`,
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
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(1000);
    });

    test("should handle bulk queries efficiently", async () => {
      // Arrange: Create large dataset
      const units = Array(1000).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(4, '0')}`,
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
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(allUnitsResponse.status).toBe(200);
      expect(provincesResponse.status).toBe(200);
      expect(searchResponse.status).toBe(200);
      expect(treeResponse.status).toBe(200);
    });

    test("should handle bulk updates efficiently", async () => {
      // Arrange: Create large dataset
      const units = Array(500).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
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
        await request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      
      const updatedUnits = await Unit.find();
      expect(updatedUnits).toHaveLength(500);
      expect(updatedUnits[0].name).toContain("Updated");
    });

    test("should handle bulk deletes efficiently", async () => {
      // Arrange: Create large dataset
      const units = Array(500).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
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
        await request(app).delete(`/units/${unit.code}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      const remainingUnits = await Unit.find();
      expect(remainingUnits).toHaveLength(0);
    });
  });

  describe("API Performance", () => {
    test("should handle high request volume efficiently", async () => {
      // Arrange
      const units = Array(100).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
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
      for (let i = 0; i < 10; i++) {
        operations.push(request(app).get("/units"));
        operations.push(request(app).get("/search"));
        operations.push(request(app).get("/tree"));
      }
      
      await Promise.all(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(100);
    });

    test("should handle concurrent API requests efficiently", async () => {
      // Arrange
      const units = Array(100).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
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
      
      // Perform concurrent operations
      const operationPromises = [];
      for (let i = 0; i < 50; i++) {
        operationPromises.push(request(app).get("/units"));
        operationPromises.push(request(app).get("/search"));
        operationPromises.push(request(app).get("/tree"));
      }
      
      await Promise.all(operationPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      
      const createdUnits = await Unit.find();
      expect(createdUnits).toHaveLength(100);
    });
  });

  describe("History Performance", () => {
    test("should handle bulk operations with history efficiently", async () => {
      // Arrange
      const units = Array(100).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      // Act
      const startTime = Date.now();
      
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
        await request(app).delete(`/units/${unit.code}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
      
      const history = await UnitHistory.find();
      expect(history).toHaveLength(300); // 100 create + 100 update + 100 delete
    });

    test("should handle history queries efficiently", async () => {
      // Arrange: Create units with history
      const units = Array(50).fill().map((_, i) => ({
        name: `Unit ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      for (const unit of units) {
        await request(app).post("/units").send(unit);
        await request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` });
        await request(app).delete(`/units/${unit.code}`);
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
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const history = await UnitHistory.find();
      expect(history).toHaveLength(150); // 50 * 3 operations
    });
  });
});
