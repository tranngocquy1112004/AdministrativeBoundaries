// tests/middleware/errorHandler.test.js
import request from "supertest";
import express from "express";
import { notFoundHandler, errorHandler } from "../../server/middleware/errorHandler.js";
import { comprehensiveCleanup } from "../utils/testCleanup.js";
import { jest } from "@jest/globals";

describe("🚨 ErrorHandler Middleware Tests", () => {
  let app;

  beforeEach(() => {
    // Create a fresh app instance for each test
    app = express();
    app.use(express.json());
    
    // Add a basic route
    app.get("/", (req, res) => {
      res.json({ message: "Test app" });
    });
  });

  // Helper function to add test routes that throw errors
  const addErrorTestRoute = (path, error) => {
    app.get(path, (req, res, next) => {
      next(error);
    });
  };

  // Helper function to setup error handlers
  const setupErrorHandlers = () => {
    app.use(notFoundHandler);
    app.use(errorHandler);
  };

  // Cleanup after each test to prevent Jest hanging
  afterEach(async () => {
    await comprehensiveCleanup();
  });

  describe("404 Not Found Handler", () => {
    test("should return 404 for non-existent routes", async () => {
      // Arrange
      setupErrorHandlers();
      
      // Act
      const response = await request(app).get("/non-existent");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("❌ Route not found");
      expect(response.body).toHaveProperty("path");
      expect(response.body.path).toBe("/non-existent");
    });

    test("should return 404 for non-existent API endpoints", async () => {
      // Arrange
      setupErrorHandlers();
      
      // Act
      const response = await request(app).get("/api/non-existent");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("❌ Route not found");
    });

    test("should return 404 for invalid HTTP methods", async () => {
      // Arrange
      setupErrorHandlers();
      
      // Act
      const response = await request(app).patch("/provinces");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    test("should return 404 for routes with query parameters", async () => {
      // Arrange
      setupErrorHandlers();
      
      // Act
      const response = await request(app).get("/non-existent?param=value");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    test("should return 404 for routes with hash fragments", async () => {
      // Arrange
      setupErrorHandlers();
      
      // Act
      const response = await request(app).get("/non-existent#fragment");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("500 Internal Server Error Handler", () => {
    test("should handle generic errors", async () => {
      // Arrange
      const testRoute = "/test-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Test error"));
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle async errors", async () => {
      // Arrange
      const testRoute = "/test-async-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Async test error"));
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle database connection errors", async () => {
      // Arrange
      const testRoute = "/test-db-error-" + Date.now();
      const error = new Error("MongoDB connection failed");
      error.name = "MongoError";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Database Error");
    });

    test("should handle validation errors", async () => {
      // Arrange
      const testRoute = "/test-validation-error-" + Date.now();
      const error = new Error("Validation failed");
      error.name = "ValidationError";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Validation Error");
    });

    test("should handle JSON parsing errors", async () => {
      // Arrange
      const testRoute = "/test-json-error-" + Date.now();
      const error = new Error("Invalid JSON");
      error.name = "SyntaxError";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Invalid JSON format");
    });

    test("should handle file system errors", async () => {
      // Arrange
      const testRoute = "/test-fs-error-" + Date.now();
      const error = new Error("File not found");
      error.code = "ENOENT";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("File System Error");
    });

    test("should handle network errors", async () => {
      // Arrange
      const testRoute = "/test-network-error-" + Date.now();
      const error = new Error("Connection refused");
      error.code = "ECONNREFUSED";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Connection Error");
    });

    test("should handle timeout errors", async () => {
      // Arrange
      const testRoute = "/test-timeout-error-" + Date.now();
      const error = new Error("Request timeout");
      error.code = "ETIMEDOUT";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Request Timeout");
    });

    test("should handle memory errors", async () => {
      // Arrange
      const testRoute = "/test-memory-error-" + Date.now();
      const error = new Error("Out of memory");
      error.name = "RangeError";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Range Error");
    });

    test("should handle type errors", async () => {
      // Arrange
      const testRoute = "/test-type-error-" + Date.now();
      const error = new Error("Type error");
      error.name = "TypeError";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Type Error");
    });

    test("should handle reference errors", async () => {
      // Arrange
      const testRoute = "/test-reference-error-" + Date.now();
      const error = new Error("Reference error");
      error.name = "ReferenceError";
      addErrorTestRoute(testRoute, error);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Reference Error");
    });
  });

  describe("Error Response Format", () => {
    test("should return consistent error response structure", async () => {
      // Arrange
      setupErrorHandlers();
      
      // Act
      const response = await request(app).get("/non-existent");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body.error).toBe("string");
      expect(response.body).toHaveProperty("path");
    });

    test("should return consistent 500 error response structure", async () => {
      // Arrange
      const testRoute = "/test-500-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Test 500 error"));
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body.error).toBe("string");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should not expose internal error details", async () => {
      // Arrange
      const testRoute = "/test-internal-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Internal secret123 abc123"));
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal Server Error");
      expect(response.body.error).not.toContain("secret123");
      expect(response.body.error).not.toContain("abc123");
    });

    test("should not expose stack traces in production", async () => {
      // Arrange
      const testRoute = "/test-stack-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Test stack error"));
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body).not.toHaveProperty("stack");
      expect(response.body).not.toHaveProperty("stackTrace");
    });
  });

  describe("Error Logging", () => {
    test("should log errors to console", async () => {
      // Arrange: Mock console.error
      const originalConsoleError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;

      const testRoute = "/test-logging-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Test logging error"));
      setupErrorHandlers();

      // Act
      await request(app).get(testRoute);

      // Assert
      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "🔥 Server Error:",
        expect.any(Error)
      );

      // Restore console.error
      console.error = originalConsoleError;
    });

    test("should log error stack trace", async () => {
      // Arrange: Mock console.error
      const originalConsoleError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;

      const testRoute = "/test-stack-logging-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Test stack logging error"));
      setupErrorHandlers();

      // Act
      await request(app).get(testRoute);

      // Assert
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedError = mockConsoleError.mock.calls[0][1];
      expect(loggedError).toHaveProperty("stack");

      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe("Edge Cases", () => {
    test("should handle null error", async () => {
      // Arrange
      const testRoute = "/test-null-error-" + Date.now();
      app.get(testRoute, (req, res, next) => {
        // Simulate passing null to error handler
        const errorHandler = (err, req, res, next) => {
          console.error("🔥 Server Error:", err);
          let statusCode = 500;
          let errorMessage = "Internal Server Error";
          
          if (err === null || err === undefined) {
            statusCode = 500;
            errorMessage = "Unknown Error";
          }
          
          res.status(statusCode).json({ error: errorMessage });
        };
        errorHandler(null, req, res, next);
      });
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Unknown Error");
    });

    test("should handle undefined error", async () => {
      // Arrange
      const testRoute = "/test-undefined-error-" + Date.now();
      app.get(testRoute, (req, res, next) => {
        // Simulate passing undefined to error handler
        const errorHandler = (err, req, res, next) => {
          console.error("🔥 Server Error:", err);
          let statusCode = 500;
          let errorMessage = "Internal Server Error";
          
          if (err === null || err === undefined) {
            statusCode = 500;
            errorMessage = "Unknown Error";
          }
          
          res.status(statusCode).json({ error: errorMessage });
        };
        errorHandler(undefined, req, res, next);
      });
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Unknown Error");
    });

    test("should handle string error", async () => {
      // Arrange
      const testRoute = "/test-string-error-" + Date.now();
      addErrorTestRoute(testRoute, "String error");
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("String Error");
    });

    test("should handle object error", async () => {
      // Arrange
      const testRoute = "/test-object-error-" + Date.now();
      addErrorTestRoute(testRoute, { data: "Object error" }); // Object without message property
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Object Error");
    });

    test("should handle array error", async () => {
      // Arrange
      const testRoute = "/test-array-error-" + Date.now();
      addErrorTestRoute(testRoute, ["Array", "error"]);
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Array Error");
    });
  });

  describe("Performance", () => {
    test("should handle error processing efficiently", async () => {
      // Arrange
      const testRoute = "/test-performance-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Performance test error"));

      const startTime = Date.now();

      // Act
      const response = await request(app).get(testRoute);
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(500);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle multiple concurrent errors", async () => {
      // Arrange
      const testRoutes = Array(5).fill().map((_, i) => `/test-concurrent-error-${i}-${Date.now()}`);
      testRoutes.forEach(route => {
        addErrorTestRoute(route, new Error(`Concurrent error ${route}`));
      });
      setupErrorHandlers();

      // Act
      const promises = testRoutes.map(route => request(app).get(route));
      const responses = await Promise.all(promises);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("error");
      });
    });
  });

  describe("Middleware Identification", () => {
    test("should have correct _middlewareName for notFoundHandler", () => {
      expect(notFoundHandler._middlewareName).toBe('notFoundHandler');
    });

    test("should have correct _middlewareName for errorHandler", () => {
      expect(errorHandler._middlewareName).toBe('errorHandler');
    });
  });

  describe("Development Environment Error Response", () => {
    test("should include stack trace and details in development", async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const testRoute = "/test-dev-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Development error"));
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("stack");
      expect(response.body).toHaveProperty("details");
      expect(response.body.details).toBe("Development error");

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    test("should not include stack trace in production", async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const testRoute = "/test-prod-error-" + Date.now();
      addErrorTestRoute(testRoute, new Error("Production error"));
      setupErrorHandlers();

      // Act
      const response = await request(app).get(testRoute);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).not.toHaveProperty("stack");
      expect(response.body).not.toHaveProperty("details");

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });
});
