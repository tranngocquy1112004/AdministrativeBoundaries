// tests/utils/db.test.js
import { jest } from "@jest/globals";
import { connectDB } from "../../server/utils/db.js";
import mongoose from "mongoose";

// Mock dotenv
jest.mock("dotenv", () => ({
  config: jest.fn()
}));

describe("🗄️ Database Connection Tests", () => {
  let mockConnect;
  let mockConsoleError;
  let mockProcessExit;

  beforeEach(() => {
    // Mock mockConnect
    mockConnect = jest.spyOn(mongoose, "connect").mockImplementation();
    
    // Mock console.error and process.exit
    mockConsoleError = jest.spyOn(console, "error").mockImplementation();
    mockProcessExit = jest.spyOn(process, "exit").mockImplementation();
    
    // Reset environment variables
    delete process.env.MONGODB_URI;
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("connectDB function", () => {
    test("should connect to MongoDB successfully", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      mockConnect.mockResolvedValue({
        connection: { host: "localhost" }
      });

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb://localhost:27017/test");
    });

    test("should handle successful connection", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      mockConnect.mockResolvedValue({
        connection: { host: "localhost" }
      });

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith("✅ MongoDB connected: localhost");
      
      // Restore console.log
      consoleSpy.mockRestore();
    });

    test("should exit process when MONGODB_URI is not set", async () => {
      // Arrange
      delete process.env.MONGODB_URI;
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MONGODB_URI not set in .env");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should exit process when MONGODB_URI is empty", async () => {
      // Arrange
      process.env.MONGODB_URI = "";
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MONGODB_URI not set in .env");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should exit process when MONGODB_URI is undefined", async () => {
      // Arrange
      process.env.MONGODB_URI = undefined;
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "Cannot read properties of undefined (reading 'connection')");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle MongoDB connection error", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      const connectionError = new Error("Connection failed");
      mockConnect.mockRejectedValue(connectionError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "Connection failed");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle network timeout error", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      const timeoutError = new Error("ETIMEDOUT");
      mockConnect.mockRejectedValue(timeoutError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "ETIMEDOUT");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle authentication error", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://user:password@localhost:27017/test";
      const authError = new Error("Authentication failed");
      mockConnect.mockRejectedValue(authError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "Authentication failed");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle database not found error", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/nonexistent";
      const dbError = new Error("Database not found");
      mockConnect.mockRejectedValue(dbError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "Database not found");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle invalid connection string", async () => {
      // Arrange
      process.env.MONGODB_URI = "invalid-connection-string";
      const invalidError = new Error("Invalid connection string");
      mockConnect.mockRejectedValue(invalidError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "Invalid connection string");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle connection refused error", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      const refusedError = new Error("ECONNREFUSED");
      mockConnect.mockRejectedValue(refusedError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "ECONNREFUSED");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe("Connection String Validation", () => {
    test("should accept valid MongoDB connection string", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/administrative_boundaries";
      mockConnect.mockResolvedValue({
        connection: { host: "localhost" }
      });

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb://localhost:27017/administrative_boundaries");
    });

    test("should accept MongoDB Atlas connection string", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb+srv://user:password@cluster.mongodb.net/database";
      mockConnect.mockResolvedValue({
        connection: { host: "cluster.mongodb.net" }
      });

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb+srv://user:password@cluster.mongodb.net/database");
    });

    test("should accept connection string with options", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test?retryWrites=true&w=majority";
      mockConnect.mockResolvedValue({
        connection: { host: "localhost" }
      });

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb://localhost:27017/test?retryWrites=true&w=majority");
    });
  });

  describe("Environment Variables", () => {
    test("should use MONGODB_URI from environment", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://custom-host:27017/custom-db";
      mockConnect.mockResolvedValue({
        connection: { host: "custom-host" }
      });

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb://custom-host:27017/custom-db");
    });

    test("should handle missing environment variable", async () => {
      // Arrange
      delete process.env.MONGODB_URI;
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MONGODB_URI not set in .env");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    test("should handle mongoose connection timeout", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      const timeoutError = new Error("MongoServerSelectionError: connection timeout");
      mockConnect.mockRejectedValue(timeoutError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "MongoServerSelectionError: connection timeout");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle mongoose validation error", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      const validationError = new Error("ValidationError: Invalid schema");
      mockConnect.mockRejectedValue(validationError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "ValidationError: Invalid schema");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test("should handle mongoose cast error", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      const castError = new Error("CastError: Invalid ObjectId");
      mockConnect.mockRejectedValue(castError);
      
      // Mock console.error and process.exit
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("❌ MongoDB connection error:", "CastError: Invalid ObjectId");
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe("Success Scenarios", () => {
    test("should connect to local MongoDB", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/administrative_boundaries";
      mockConnect.mockResolvedValue({
        connection: { host: "127.0.0.1" }
      });

      // Mock console.log
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb://127.0.0.1:27017/administrative_boundaries");
      expect(consoleSpy).toHaveBeenCalledWith("✅ MongoDB connected: 127.0.0.1");

      // Restore console.log
      consoleSpy.mockRestore();
    });

    test("should connect to remote MongoDB", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb://remote-host:27017/administrative_boundaries";
      mockConnect.mockResolvedValue({
        connection: { host: "remote-host" }
      });

      // Mock console.log
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb://remote-host:27017/administrative_boundaries");
      expect(consoleSpy).toHaveBeenCalledWith("✅ MongoDB connected: remote-host");

      // Restore console.log
      consoleSpy.mockRestore();
    });

    test("should connect to MongoDB Atlas", async () => {
      // Arrange
      process.env.MONGODB_URI = "mongodb+srv://user:password@cluster.mongodb.net/administrative_boundaries";
      mockConnect.mockResolvedValue({
        connection: { host: "cluster.mongodb.net" }
      });

      // Mock console.log
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await connectDB();

      // Assert
      expect(mockConnect).toHaveBeenCalledWith("mongodb+srv://user:password@cluster.mongodb.net/administrative_boundaries");
      expect(consoleSpy).toHaveBeenCalledWith("✅ MongoDB connected: cluster.mongodb.net");

      // Restore console.log
      consoleSpy.mockRestore();
    });
  });
});

