// tests/integration/fullFlow.test.js
import request from "supertest";
import app from "../../server.js";
import Unit from "../../server/models/Unit.js";
import UnitHistory from "../../server/models/UnitHistory.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import fs from "fs";
import { jest } from "@jest/globals";

describe("🔄 Full Flow Integration Tests", () => {
  let mongoServer;
  let fakeStore = [];

  beforeAll(async () => {
    // Mock IO JSON bằng bộ nhớ tạm
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
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
    fakeStore = [];
  });

  afterEach(async () => {
    // Clean up after each test
    await Unit.deleteMany({});
    await UnitHistory.deleteMany({});
  });

  describe("Complete CRUD Flow", () => {
    test("should handle complete CRUD operations flow", async () => {
      // 1. Create a new unit
      const newUnit = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        parentCode: null,
        englishName: "Test Province",
        administrativeLevel: "Tỉnh",
        decree: "Test Decree"
      };

      const createResponse = await request(app)
        .post("/units")
        .send(newUnit);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data).toMatchObject({
        name: "Tỉnh Test",
        code: "99",
        level: "province"
      });

      // 2. Get the created unit
      const getResponse = await request(app).get("/units/99");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe("Tỉnh Test");

      // 3. Update the unit
      const updateData = {
        name: "Tỉnh Test Updated",
        englishName: "Test Province Updated"
      };

      const updateResponse = await request(app)
        .put("/units/99")
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.name).toBe("Tỉnh Test Updated");

      // 4. Get the updated unit
      const getUpdatedResponse = await request(app).get("/units/99");
      expect(getUpdatedResponse.status).toBe(200);
      expect(getUpdatedResponse.body.name).toBe("Tỉnh Test Updated");

      // 5. Delete the unit
      const deleteResponse = await request(app).delete("/units/99");
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toContain("xóa");

      // 6. Verify unit is deleted
      const getDeletedResponse = await request(app).get("/units/99");
      expect(getDeletedResponse.status).toBe(404);
    });

    test("should handle complete restore flow", async () => {
      // 1. Create a unit
      const newUnit = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        parentCode: null
      };

      const createResponse = await request(app)
        .post("/units")
        .send(newUnit);

      expect(createResponse.status).toBe(201);

      // 2. Update the unit
      const updateData = { name: "Tỉnh Test Updated" };
      const updateResponse = await request(app)
        .put("/units/99")
        .send(updateData);

      expect(updateResponse.status).toBe(200);

      // 3. Delete the unit
      const deleteResponse = await request(app).delete("/units/99");
      expect(deleteResponse.status).toBe(200);

      // 4. Get history
      const historyResponse = await request(app).get("/units/99/history");
      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body).toHaveLength(3); // create, update, delete

      // 5. Restore the unit
      const restoreResponse = await request(app)
        .post("/units/99/restore")
        .send({});

      expect(restoreResponse.status).toBe(200);
      expect(restoreResponse.body.message).toContain("khôi phục");

      // 6. Verify unit is restored
      const getRestoredResponse = await request(app).get("/units/99");
      expect(getRestoredResponse.status).toBe(200);
      expect(getRestoredResponse.body.name).toBe("Tỉnh Test Updated");
    });

    test("should handle complete search flow", async () => {
      // 1. Create multiple units
      const units = [
        {
          name: "Tỉnh Test 1",
          code: "99",
          level: "province",
          parentCode: null
        },
        {
          name: "Tỉnh Test 2",
          code: "98",
          level: "province",
          parentCode: null
        },
        {
          name: "Phường Test",
          code: "99001",
          level: "commune",
          parentCode: "99"
        }
      ];

      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }

      // 2. Search for provinces
      const searchProvincesResponse = await request(app)
        .get("/search?level=province");

      expect(searchProvincesResponse.status).toBe(200);
      expect(searchProvincesResponse.body).toHaveLength(2);

      // 3. Search for communes
      const searchCommunesResponse = await request(app)
        .get("/search?level=commune");

      expect(searchCommunesResponse.status).toBe(200);
      expect(searchCommunesResponse.body).toHaveLength(1);

      // 4. Search by name
      const searchByNameResponse = await request(app)
        .get("/search?name=Test");

      expect(searchByNameResponse.status).toBe(200);
      expect(searchByNameResponse.body).toHaveLength(3);
    });

    test("should handle complete tree flow", async () => {
      // 1. Create hierarchical units
      const units = [
        {
          name: "Tỉnh Test",
          code: "99",
          level: "province",
          parentCode: null
        },
        {
          name: "Xã Test 1",
          code: "99001",
          level: "commune",
          parentCode: "99"
        },
        {
          name: "Xã Test 2",
          code: "99002",
          level: "commune",
          parentCode: "99"
        }
      ];

      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }

      // 2. Get tree structure
      const treeResponse = await request(app).get("/tree");
      expect(treeResponse.status).toBe(200);
      expect(treeResponse.body).toHaveLength(1);
      expect(treeResponse.body[0].children).toHaveLength(2);
    });

    test("should handle complete convert flow", async () => {
      // 1. Create units for conversion
      const units = [
        {
          name: "Tỉnh Test",
          code: "99",
          level: "province",
          parentCode: null
        },
        {
          name: "Phường Test",
          code: "99001",
          level: "commune",
          parentCode: "99"
        }
      ];

      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }

      // 2. Convert address
      const convertResponse = await request(app)
        .post("/convert")
        .send({ address: "Tỉnh Test, Phường Test" });

      expect(convertResponse.status).toBe(200);
      expect(convertResponse.body.found).toBe(true);
      expect(convertResponse.body.matched.province).toBe("Tỉnh Test");
      expect(convertResponse.body.matched.commune).toBe("Phường Test");
    });
  });

  describe("Data Consistency Tests", () => {
    test("should maintain data consistency across operations", async () => {
      // 1. Create a unit
      const newUnit = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        parentCode: null
      };

      await request(app).post("/units").send(newUnit);

      // 2. Verify in database
      const unit = await Unit.findOne({ code: "99" });
      expect(unit).toBeTruthy();
      expect(unit.name).toBe("Tỉnh Test");

      // 3. Update the unit
      const updateData = { name: "Tỉnh Test Updated" };
      await request(app).put("/units/99").send(updateData);

      // 4. Verify update in database
      const updatedUnit = await Unit.findOne({ code: "99" });
      expect(updatedUnit.name).toBe("Tỉnh Test Updated");

      // 5. Delete the unit
      await request(app).delete("/units/99");

      // 6. Verify deletion in database
      const deletedUnit = await Unit.findOne({ code: "99" });
      expect(deletedUnit).toBeNull();

      // 7. Verify history is maintained
      const history = await UnitHistory.find({ code: "99" });
      expect(history).toHaveLength(3); // create, update, delete
    });

    test("should maintain history consistency", async () => {
      // 1. Create a unit
      const newUnit = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        parentCode: null
      };

      await request(app).post("/units").send(newUnit);

      // 2. Update the unit multiple times
      const updates = [
        { name: "Tỉnh Test 1" },
        { name: "Tỉnh Test 2" },
        { name: "Tỉnh Test 3" }
      ];

      for (const update of updates) {
        await request(app).put("/units/99").send(update);
      }

      // 3. Verify history
      const history = await UnitHistory.find({ code: "99" }).sort({ changedAt: -1 });
      expect(history).toHaveLength(4); // create + 3 updates

      // 4. Verify history order
      expect(history[0].action).toBe("update");
      expect(history[0].newData.name).toBe("Tỉnh Test 3");
      expect(history[1].action).toBe("update");
      expect(history[1].newData.name).toBe("Tỉnh Test 2");
      expect(history[2].action).toBe("update");
      expect(history[2].newData.name).toBe("Tỉnh Test 1");
      expect(history[3].action).toBe("create");
    });
  });

  describe("Error Recovery Tests", () => {
    test("should handle errors gracefully", async () => {
      // 1. Try to create unit with invalid data
      const invalidUnit = {
        name: "",
        code: "",
        level: "invalid"
      };

      const createResponse = await request(app)
        .post("/units")
        .send(invalidUnit);

      expect(createResponse.status).toBe(400);

      // 2. Try to get non-existent unit
      const getResponse = await request(app).get("/units/99999");
      expect(getResponse.status).toBe(404);

      // 3. Try to update non-existent unit
      const updateResponse = await request(app)
        .put("/units/99999")
        .send({ name: "Updated" });

      expect(updateResponse.status).toBe(404);

      // 4. Try to delete non-existent unit
      const deleteResponse = await request(app).delete("/units/99999");
      expect(deleteResponse.status).toBe(404);
    });

    test("should handle concurrent operations", async () => {
      // 1. Create multiple units concurrently
      const units = Array(10).fill().map((_, i) => ({
        name: `Tỉnh Test ${i}`,
        code: `${i.toString().padStart(2, '0')}`,
        level: "province",
        parentCode: null
      }));

      const createPromises = units.map(unit => 
        request(app).post("/units").send(unit)
      );

      const createResponses = await Promise.all(createPromises);
      createResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // 2. Update multiple units concurrently
      const updatePromises = units.map(unit => 
        request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` })
      );

      const updateResponses = await Promise.all(updatePromises);
      updateResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // 3. Verify all units are updated
      const getPromises = units.map(unit => 
        request(app).get(`/units/${unit.code}`)
      );

      const getResponses = await Promise.all(getPromises);
      getResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.name).toContain("Updated");
      });
    });
  });

  describe("Performance Tests", () => {
    test("should handle large dataset efficiently", async () => {
      // 1. Create large dataset
      const units = Array(100).fill().map((_, i) => ({
        name: `Tỉnh Test ${i}`,
        code: `${i.toString().padStart(3, '0')}`,
        level: "province",
        parentCode: null
      }));

      const startTime = Date.now();

      // 2. Create all units
      for (const unit of units) {
        await request(app).post("/units").send(unit);
      }

      const createTime = Date.now();

      // 3. Get all units
      const getResponse = await request(app).get("/units");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveLength(100);

      const getTime = Date.now();

      // 4. Search all units
      const searchResponse = await request(app).get("/search");
      expect(searchResponse.status).toBe(200);
      // API giới hạn 50 kết quả
      expect(searchResponse.body).toHaveLength(50);

      const searchTime = Date.now();

      // 5. Get tree structure
      const treeResponse = await request(app).get("/tree");
      expect(treeResponse.status).toBe(200);
      expect(treeResponse.body).toHaveLength(100);

      const treeTime = Date.now();

      // Assert performance
      expect(createTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(getTime - createTime).toBeLessThan(1000); // Should complete within 1 second
      expect(searchTime - getTime).toBeLessThan(1000); // Should complete within 1 second
      expect(treeTime - searchTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle concurrent operations efficiently", async () => {
      // 1. Create units concurrently
      const units = Array(50).fill().map((_, i) => ({
        name: `Tỉnh Test ${i}`,
        code: `${i.toString().padStart(2, '0')}`,
        level: "province",
        parentCode: null
      }));

      const startTime = Date.now();

      const createPromises = units.map(unit => 
        request(app).post("/units").send(unit)
      );

      const createResponses = await Promise.all(createPromises);
      const createTime = Date.now();

      // 2. Update units concurrently
      const updatePromises = units.map(unit => 
        request(app).put(`/units/${unit.code}`).send({ name: `${unit.name} Updated` })
      );

      const updateResponses = await Promise.all(updatePromises);
      const updateTime = Date.now();

      // 3. Get units concurrently
      const getPromises = units.map(unit => 
        request(app).get(`/units/${unit.code}`)
      );

      const getResponses = await Promise.all(getPromises);
      const getTime = Date.now();

      // Assert performance
      expect(createTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(updateTime - createTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(getTime - updateTime).toBeLessThan(1000); // Should complete within 1 second

      // Assert results
      createResponses.forEach(response => {
        expect(response.status).toBe(201);
      });
      updateResponses.forEach(response => {
        expect(response.status).toBe(200);
      });
      getResponses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Data Integrity Tests", () => {
    test("should maintain referential integrity", async () => {
      // 1. Create parent unit
      const parentUnit = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        parentCode: null
      };

      await request(app).post("/units").send(parentUnit);

      // 2. Create child unit
      const childUnit = {
        name: "Xã Test",
        code: "99001",
        level: "commune",
        parentCode: "99"
      };

      await request(app).post("/units").send(childUnit);

      // 3. Verify parent-child relationship
      const parent = await Unit.findOne({ code: "99" });
      const child = await Unit.findOne({ code: "99001" });

      expect(parent).toBeTruthy();
      expect(child).toBeTruthy();
      expect(child.parentCode).toBe("99");

      // 4. Delete parent unit
      await request(app).delete("/units/99");

      // 5. Verify child unit still exists but parent is deleted
      const deletedParent = await Unit.findOne({ code: "99" });
      const existingChild = await Unit.findOne({ code: "99001" });

      expect(deletedParent).toBeNull();
      expect(existingChild).toBeTruthy();
    });

    test("should maintain data consistency across operations", async () => {
      // 1. Create unit
      const newUnit = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        parentCode: null
      };

      await request(app).post("/units").send(newUnit);

      // 2. Update unit
      const updateData = { name: "Tỉnh Test Updated" };
      await request(app).put("/units/99").send(updateData);

      // 3. Verify in database
      const unit = await Unit.findOne({ code: "99" });
      expect(unit.name).toBe("Tỉnh Test Updated");

      // 4. Verify in API
      const getResponse = await request(app).get("/units/99");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe("Tỉnh Test Updated");

      // 5. Verify in search
      const searchResponse = await request(app).get("/search?name=Updated");
      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0].name).toBe("Tỉnh Test Updated");
    });
  });
});

