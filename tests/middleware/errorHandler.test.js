// tests/middleware/errorHandler.test.js
import request from "supertest";
import app from "../../server.js";

describe("🚨 ErrorHandler Middleware Tests", () => {
  describe("404 Not Found Handler", () => {
    test("should return 404 for non-existent routes", async () => {
      // Act
      const response = await request(app).get("/non-existent-route");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("path");
      expect(response.body.error).toContain("Route not found");
      expect(response.body.path).toBe("/non-existent-route");
    });

    test("should return 404 for non-existent API endpoints", async () => {
      // Act
      const response = await request(app).get("/api/non-existent");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("path");
      expect(response.body.error).toContain("Route not found");
    });

    test("should return 404 for invalid HTTP methods", async () => {
      // Act
      const response = await request(app).patch("/provinces");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("path");
    });

    test("should return 404 for routes with query parameters", async () => {
      // Act
      const response = await request(app).get("/non-existent?param=value");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("path");
      expect(response.body.path).toBe("/non-existent?param=value");
    });

    test("should return 404 for routes with hash fragments", async () => {
      // Act
      const response = await request(app).get("/non-existent#fragment");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("path");
      expect(response.body.path).toBe("/non-existent");
    });
  });

  describe("500 Internal Server Error Handler", () => {
    test("should handle generic errors", async () => {
      // Arrange: Create a test route that throws an error
      app.get("/test-error", (req, res, next) => {
        throw new Error("Test error");
      });

      // Act
      const response = await request(app).get("/test-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle async errors", async () => {
      // Arrange: Create a test route that throws an async error
      app.get("/test-async-error", async (req, res, next) => {
        throw new Error("Async test error");
      });

      // Act
      const response = await request(app).get("/test-async-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle database connection errors", async () => {
      // Arrange: Create a test route that simulates database error
      app.get("/test-db-error", (req, res, next) => {
        const error = new Error("MongoDB connection failed");
        error.name = "MongoError";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-db-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle validation errors", async () => {
      // Arrange: Create a test route that throws validation error
      app.get("/test-validation-error", (req, res, next) => {
        const error = new Error("Validation failed");
        error.name = "ValidationError";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-validation-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle JSON parsing errors", async () => {
      // Arrange: Create a test route that throws JSON parsing error
      app.get("/test-json-error", (req, res, next) => {
        const error = new Error("Unexpected token in JSON");
        error.name = "SyntaxError";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-json-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle file system errors", async () => {
      // Arrange: Create a test route that throws file system error
      app.get("/test-fs-error", (req, res, next) => {
        const error = new Error("ENOENT: no such file or directory");
        error.code = "ENOENT";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-fs-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle network errors", async () => {
      // Arrange: Create a test route that throws network error
      app.get("/test-network-error", (req, res, next) => {
        const error = new Error("ECONNREFUSED");
        error.code = "ECONNREFUSED";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-network-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle timeout errors", async () => {
      // Arrange: Create a test route that throws timeout error
      app.get("/test-timeout-error", (req, res, next) => {
        const error = new Error("Request timeout");
        error.code = "ETIMEDOUT";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-timeout-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle memory errors", async () => {
      // Arrange: Create a test route that throws memory error
      app.get("/test-memory-error", (req, res, next) => {
        const error = new Error("JavaScript heap out of memory");
        error.name = "RangeError";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-memory-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle type errors", async () => {
      // Arrange: Create a test route that throws type error
      app.get("/test-type-error", (req, res, next) => {
        const error = new Error("Cannot read property 'property' of undefined");
        error.name = "TypeError";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-type-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should handle reference errors", async () => {
      // Arrange: Create a test route that throws reference error
      app.get("/test-reference-error", (req, res, next) => {
        const error = new Error("variable is not defined");
        error.name = "ReferenceError";
        next(error);
      });

      // Act
      const response = await request(app).get("/test-reference-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal Server Error");
    });
  });

  describe("Error Response Format", () => {
    test("should return consistent error response structure", async () => {
      // Act
      const response = await request(app).get("/non-existent-route");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("path");
      expect(typeof response.body.error).toBe("string");
      expect(typeof response.body.path).toBe("string");
    });

    test("should return consistent 500 error response structure", async () => {
      // Arrange: Create a test route that throws an error
      app.get("/test-500-error", (req, res, next) => {
        throw new Error("Test 500 error");
      });

      // Act
      const response = await request(app).get("/test-500-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body.error).toBe("string");
      expect(response.body.error).toBe("Internal Server Error");
    });

    test("should not expose internal error details", async () => {
      // Arrange: Create a test route that throws an error with sensitive info
      app.get("/test-sensitive-error", (req, res, next) => {
        throw new Error("Database password: secret123, API key: abc123");
      });

      // Act
      const response = await request(app).get("/test-sensitive-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal Server Error");
      expect(response.body.error).not.toContain("secret123");
      expect(response.body.error).not.toContain("abc123");
    });

    test("should not expose stack traces", async () => {
      // Arrange: Create a test route that throws an error
      app.get("/test-stack-error", (req, res, next) => {
        throw new Error("Test error with stack trace");
      });

      // Act
      const response = await request(app).get("/test-stack-error");

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

      // Create a test route that throws an error
      app.get("/test-logging-error", (req, res, next) => {
        throw new Error("Test logging error");
      });

      // Act
      await request(app).get("/test-logging-error");

      // Assert
      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "🔥 Server Error:",
        expect.any(Error)
      );

      // Restore original console.error
      console.error = originalConsoleError;
    });

    test("should log error stack trace", async () => {
      // Arrange: Mock console.error
      const originalConsoleError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;

      // Create a test route that throws an error
      app.get("/test-stack-logging-error", (req, res, next) => {
        throw new Error("Test stack logging error");
      });

      // Act
      await request(app).get("/test-stack-logging-error");

      // Assert
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedError = mockConsoleError.mock.calls[0][1];
      expect(loggedError).toHaveProperty("stack");

      // Restore original console.error
      console.error = originalConsoleError;
    });
  });

  describe("Edge Cases", () => {
    test("should handle null error", async () => {
      // Arrange: Create a test route that passes null error
      app.get("/test-null-error", (req, res, next) => {
        next(null);
      });

      // Act
      const response = await request(app).get("/test-null-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    test("should handle undefined error", async () => {
      // Arrange: Create a test route that passes undefined error
      app.get("/test-undefined-error", (req, res, next) => {
        next(undefined);
      });

      // Act
      const response = await request(app).get("/test-undefined-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    test("should handle string error", async () => {
      // Arrange: Create a test route that passes string error
      app.get("/test-string-error", (req, res, next) => {
        next("String error");
      });

      // Act
      const response = await request(app).get("/test-string-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    test("should handle object error", async () => {
      // Arrange: Create a test route that passes object error
      app.get("/test-object-error", (req, res, next) => {
        next({ message: "Object error", code: "CUSTOM_ERROR" });
      });

      // Act
      const response = await request(app).get("/test-object-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    test("should handle array error", async () => {
      // Arrange: Create a test route that passes array error
      app.get("/test-array-error", (req, res, next) => {
        next(["Array", "error"]);
      });

      // Act
      const response = await request(app).get("/test-array-error");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Performance", () => {
    test("should handle error processing efficiently", async () => {
      // Arrange: Create a test route that throws an error
      app.get("/test-performance-error", (req, res, next) => {
        throw new Error("Performance test error");
      });

      // Act
      const startTime = Date.now();
      const response = await request(app).get("/test-performance-error");
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(500);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle multiple concurrent errors", async () => {
      // Arrange: Create a test route that throws an error
      app.get("/test-concurrent-error", (req, res, next) => {
        throw new Error("Concurrent test error");
      });

      // Act: Make multiple concurrent requests
      const promises = Array(10).fill().map(() => 
        request(app).get("/test-concurrent-error")
      );
      const responses = await Promise.all(promises);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("error");
      });
    });
  });
});

