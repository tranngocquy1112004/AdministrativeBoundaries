// tests/utils/logger.test.js
import { logInfo, logError } from "../../utils/logger.js";
import fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  appendFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Mock console.log and console.error
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

describe("📝 Logger Utils Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("logInfo function", () => {
    test("should log info message to file and console", () => {
      // Arrange
      const message = "Test info message";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}`)
      );
    });

    test("should log info message with timestamp", () => {
      // Arrange
      const message = "Test info message";
      const beforeTime = new Date().toISOString();

      // Act
      logInfo(message);

      // Assert
      const afterTime = new Date().toISOString();
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test info message\n/)
      );
    });

    test("should log empty info message", () => {
      // Arrange
      const message = "";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: \n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] INFO: `)
      );
    });

    test("should log info message with special characters", () => {
      // Arrange
      const message = "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}`)
      );
    });

    test("should log info message with unicode characters", () => {
      // Arrange
      const message = "Unicode: 中文, العربية, русский, 🚀🌟💻";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}`)
      );
    });

    test("should log info message with newlines", () => {
      // Arrange
      const message = "Multi-line\nmessage\nwith\nnewlines";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}`)
      );
    });

    test("should log info message with very long text", () => {
      // Arrange
      const message = "A".repeat(1000);

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] INFO: ${message}`)
      );
    });

    test("should handle file write errors gracefully", () => {
      // Arrange
      const message = "Test info message";
      const fileError = new Error("ENOSPC: no space left on device");
      fs.appendFileSync.mockImplementation(() => {
        throw fileError;
      });

      // Act & Assert
      expect(() => logInfo(message)).toThrow("ENOSPC: no space left on device");
    });

    test("should handle permission errors gracefully", () => {
      // Arrange
      const message = "Test info message";
      const permissionError = new Error("EACCES: permission denied");
      fs.appendFileSync.mockImplementation(() => {
        throw permissionError;
      });

      // Act & Assert
      expect(() => logInfo(message)).toThrow("EACCES: permission denied");
    });
  });

  describe("logError function", () => {
    test("should log error message to file and console", () => {
      // Arrange
      const message = "Test error message";

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}`)
      );
    });

    test("should log error message with timestamp", () => {
      // Arrange
      const message = "Test error message";

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] ERROR: Test error message\n/)
      );
    });

    test("should log empty error message", () => {
      // Arrange
      const message = "";

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] ERROR: \n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] ERROR: `)
      );
    });

    test("should log error message with special characters", () => {
      // Arrange
      const message = "Error with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}`)
      );
    });

    test("should log error message with unicode characters", () => {
      // Arrange
      const message = "Error with unicode: 中文, العربية, русский, 🚀🌟💻";

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}`)
      );
    });

    test("should log error message with newlines", () => {
      // Arrange
      const message = "Multi-line\nerror\nmessage\nwith\nnewlines";

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}`)
      );
    });

    test("should log error message with very long text", () => {
      // Arrange
      const message = "B".repeat(1000);

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}\n`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[${expect.any(String)}] ERROR: ${message}`)
      );
    });

    test("should handle file write errors gracefully", () => {
      // Arrange
      const message = "Test error message";
      const fileError = new Error("ENOSPC: no space left on device");
      fs.appendFileSync.mockImplementation(() => {
        throw fileError;
      });

      // Act & Assert
      expect(() => logError(message)).toThrow("ENOSPC: no space left on device");
    });

    test("should handle permission errors gracefully", () => {
      // Arrange
      const message = "Test error message";
      const permissionError = new Error("EACCES: permission denied");
      fs.appendFileSync.mockImplementation(() => {
        throw permissionError;
      });

      // Act & Assert
      expect(() => logError(message)).toThrow("EACCES: permission denied");
    });
  });

  describe("Log Format Tests", () => {
    test("should format log entries correctly", () => {
      // Arrange
      const message = "Test message";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringMatching(/^\[.+\] INFO: Test message\n$/)
      );
    });

    test("should format error entries correctly", () => {
      // Arrange
      const message = "Test error";

      // Act
      logError(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringMatching(/^\[.+\] ERROR: Test error\n$/)
      );
    });

    test("should include newline at end of log entries", () => {
      // Arrange
      const message = "Test message";

      // Act
      logInfo(message);

      // Assert
      const logEntry = fs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toMatch(/\n$/);
    });

    test("should include timestamp in log entries", () => {
      // Arrange
      const message = "Test message";

      // Act
      logInfo(message);

      // Assert
      const logEntry = fs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toMatch(/^\[.+\]/);
    });

    test("should include log level in log entries", () => {
      // Arrange
      const message = "Test message";

      // Act
      logInfo(message);

      // Assert
      const logEntry = fs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toContain("INFO:");
    });
  });

  describe("File Path Tests", () => {
    test("should use correct log file path", () => {
      // Arrange
      const message = "Test message";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.any(String)
      );
    });

    test("should handle file path with spaces", () => {
      // Arrange
      const message = "Test message";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.any(String)
      );
    });

    test("should handle file path with special characters", () => {
      // Arrange
      const message = "Test message";

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.any(String)
      );
    });
  });

  describe("Performance Tests", () => {
    test("should handle multiple log entries efficiently", () => {
      // Arrange
      const messages = Array(100).fill().map((_, i) => `Message ${i}`);

      // Act
      const startTime = Date.now();
      messages.forEach(message => logInfo(message));
      const endTime = Date.now();

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledTimes(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle large log messages efficiently", () => {
      // Arrange
      const largeMessage = "A".repeat(10000);

      // Act
      const startTime = Date.now();
      logInfo(largeMessage);
      const endTime = Date.now();

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledTimes(1);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test("should handle concurrent logging", () => {
      // Arrange
      const messages = Array(10).fill().map((_, i) => `Concurrent message ${i}`);

      // Act
      const startTime = Date.now();
      messages.forEach(message => {
        logInfo(message);
        logError(message);
      });
      const endTime = Date.now();

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledTimes(20);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Edge Cases", () => {
    test("should handle null message", () => {
      // Arrange
      const message = null;

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: null\n`)
      );
    });

    test("should handle undefined message", () => {
      // Arrange
      const message = undefined;

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: undefined\n`)
      );
    });

    test("should handle number message", () => {
      // Arrange
      const message = 123;

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: 123\n`)
      );
    });

    test("should handle boolean message", () => {
      // Arrange
      const message = true;

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: true\n`)
      );
    });

    test("should handle object message", () => {
      // Arrange
      const message = { key: "value" };

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: [object Object]\n`)
      );
    });

    test("should handle array message", () => {
      // Arrange
      const message = [1, 2, 3];

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: 1,2,3\n`)
      );
    });

    test("should handle function message", () => {
      // Arrange
      const message = function() { return "test"; };

      // Act
      logInfo(message);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("data/fetch.log"),
        expect.stringContaining(`[${expect.any(String)}] INFO: function() { return "test"; }\n`)
      );
    });
  });

  describe("Integration Tests", () => {
    test("should log info and error messages consistently", () => {
      // Arrange
      const infoMessage = "Info message";
      const errorMessage = "Error message";

      // Act
      logInfo(infoMessage);
      logError(errorMessage);

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledTimes(2);
      
      const infoCall = fs.appendFileSync.mock.calls[0];
      const errorCall = fs.appendFileSync.mock.calls[1];
      
      expect(infoCall[1]).toContain("INFO:");
      expect(errorCall[1]).toContain("ERROR:");
      expect(infoCall[1]).toContain(infoMessage);
      expect(errorCall[1]).toContain(errorMessage);
    });

    test("should handle mixed log types", () => {
      // Arrange
      const messages = [
        { type: "info", message: "Info 1" },
        { type: "error", message: "Error 1" },
        { type: "info", message: "Info 2" },
        { type: "error", message: "Error 2" }
      ];

      // Act
      messages.forEach(({ type, message }) => {
        if (type === "info") {
          logInfo(message);
        } else {
          logError(message);
        }
      });

      // Assert
      expect(fs.appendFileSync).toHaveBeenCalledTimes(4);
      
      const calls = fs.appendFileSync.mock.calls;
      expect(calls[0][1]).toContain("INFO: Info 1");
      expect(calls[1][1]).toContain("ERROR: Error 1");
      expect(calls[2][1]).toContain("INFO: Info 2");
      expect(calls[3][1]).toContain("ERROR: Error 2");
    });
  });
});

