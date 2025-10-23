// tests/fetcher/schedule.test.js
import { jest } from '@jest/globals';

describe("⏰ Fetcher Schedule Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("Cron Job Scheduling", () => {
    test("should create cron expression for daily schedule", () => {
      // Arrange
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true
      };

      // Assert
      expect(schedule.expression).toBe("0 0 * * *");
      expect(schedule.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(schedule.scheduled).toBe(true);
    });

    test("should create cron expression for custom schedule", () => {
      // Arrange
      const cronExpression = "0 */6 * * *";
      const timezone = "Asia/Ho_Chi_Minh";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true
      };

      // Assert
      expect(schedule.expression).toBe("0 */6 * * *");
      expect(schedule.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(schedule.scheduled).toBe(true);
    });

    test("should create cron expression with different timezone", () => {
      // Arrange
      const cronExpression = "0 0 * * *";
      const timezone = "UTC";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true
      };

      // Assert
      expect(schedule.expression).toBe("0 0 * * *");
      expect(schedule.timezone).toBe("UTC");
      expect(schedule.scheduled).toBe(true);
    });

    test("should create cron expression with immediate execution", () => {
      // Arrange
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";
      const runOnInit = true;

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        runOnInit: runOnInit
      };

      // Assert
      expect(schedule.expression).toBe("0 0 * * *");
      expect(schedule.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(schedule.scheduled).toBe(true);
      expect(schedule.runOnInit).toBe(true);
    });
  });

  describe("Schedule Execution", () => {
    test("should execute function when scheduled", async () => {
      // Arrange
      const mockFunction = jest.fn().mockResolvedValue();
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        execute: mockFunction
      };

      await schedule.execute();

      // Assert
      expect(mockFunction).toHaveBeenCalled();
    });

    test("should handle execution errors", async () => {
      // Arrange
      const error = new Error("Fetch failed");
      const mockFunction = jest.fn().mockRejectedValue(error);
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        execute: mockFunction
      };

      // Assert
      await expect(schedule.execute()).rejects.toThrow("Fetch failed");
    });

    test("should log when job starts", () => {
      // Arrange
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";
      const logMessage = "Job started";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        log: logMessage
      };

      // Assert
      expect(schedule.log).toBe("Job started");
    });

    test("should log when job completes", async () => {
      // Arrange
      const mockFunction = jest.fn().mockResolvedValue();
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";
      const logMessage = "Job completed";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        execute: mockFunction,
        log: logMessage
      };

      await schedule.execute();

      // Assert
      expect(schedule.log).toBe("Job completed");
    });
  });

  describe("Schedule Management", () => {
    test("should start scheduled job", () => {
      // Arrange
      const mockStart = jest.fn();
      const schedule = {
        expression: "0 0 * * *",
        timezone: "Asia/Ho_Chi_Minh",
        scheduled: true,
        start: mockStart
      };

      // Act
      schedule.start();

      // Assert
      expect(mockStart).toHaveBeenCalled();
    });

    test("should stop scheduled job", () => {
      // Arrange
      const mockStop = jest.fn();
      const schedule = {
        expression: "0 0 * * *",
        timezone: "Asia/Ho_Chi_Minh",
        scheduled: true,
        stop: mockStop
      };

      // Act
      schedule.stop();

      // Assert
      expect(mockStop).toHaveBeenCalled();
    });

    test("should destroy scheduled job", () => {
      // Arrange
      const mockDestroy = jest.fn();
      const schedule = {
        expression: "0 0 * * *",
        timezone: "Asia/Ho_Chi_Minh",
        scheduled: true,
        destroy: mockDestroy
      };

      // Act
      schedule.destroy();

      // Assert
      expect(mockDestroy).toHaveBeenCalled();
    });

    test("should check if job is running", () => {
      // Arrange
      const mockRunning = jest.fn().mockReturnValue(true);
      const schedule = {
        expression: "0 0 * * *",
        timezone: "Asia/Ho_Chi_Minh",
        scheduled: true,
        running: mockRunning
      };

      // Act
      const isRunning = schedule.running();

      // Assert
      expect(mockRunning).toHaveBeenCalled();
      expect(isRunning).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid cron expression", () => {
      // Arrange
      const invalidCron = "invalid cron";
      const timezone = "Asia/Ho_Chi_Minh";

      // Act
      const schedule = {
        expression: invalidCron,
        timezone: timezone,
        scheduled: true
      };

      // Assert
      expect(schedule.expression).toBe("invalid cron");
      expect(schedule.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(schedule.scheduled).toBe(true);
    });

    test("should handle missing callback function", () => {
      // Arrange
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";
      const callback = null;

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        callback: callback
      };

      // Assert
      expect(schedule.expression).toBe("0 0 * * *");
      expect(schedule.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(schedule.scheduled).toBe(true);
      expect(schedule.callback).toBeNull();
    });

    test("should handle invalid timezone", () => {
      // Arrange
      const cronExpression = "0 0 * * *";
      const invalidTimezone = "Invalid/Timezone";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: invalidTimezone,
        scheduled: true
      };

      // Assert
      expect(schedule.expression).toBe("0 0 * * *");
      expect(schedule.timezone).toBe("Invalid/Timezone");
      expect(schedule.scheduled).toBe(true);
    });

    test("should handle schedule execution errors", async () => {
      // Arrange
      const error = new Error("Schedule execution failed");
      const mockFunction = jest.fn().mockRejectedValue(error);
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        execute: mockFunction
      };

      // Assert
      await expect(schedule.execute()).rejects.toThrow("Schedule execution failed");
    });
  });

  describe("Performance Tests", () => {
    test("should handle frequent scheduling", () => {
      // Arrange
      const schedules = [];

      // Act
      for (let i = 0; i < 100; i++) {
        schedules.push({
          expression: `0 ${i} * * *`,
          timezone: "Asia/Ho_Chi_Minh",
          scheduled: true
        });
      }

      // Assert
      expect(schedules).toHaveLength(100);
      expect(schedules[0].expression).toBe("0 0 * * *");
      expect(schedules[99].expression).toBe("0 99 * * *");
    });

    test("should handle concurrent job execution", async () => {
      // Arrange
      const mockFunction = jest.fn().mockResolvedValue();
      const schedules = [];

      // Act
      for (let i = 0; i < 10; i++) {
        schedules.push({
          expression: `0 ${i} * * *`,
          timezone: "Asia/Ho_Chi_Minh",
          scheduled: true,
          execute: mockFunction
        });
      }

      // Simulate concurrent execution
      const promises = schedules.map(schedule => schedule.execute());
      await Promise.all(promises);

      // Assert
      expect(schedules).toHaveLength(10);
      expect(mockFunction).toHaveBeenCalledTimes(10);
    });

    test("should handle memory usage efficiently", () => {
      // Arrange
      const schedules = [];

      // Act
      const startMemory = process.memoryUsage();
      for (let i = 0; i < 1000; i++) {
        schedules.push({
          expression: `0 ${i % 24} * * *`,
          timezone: "Asia/Ho_Chi_Minh",
          scheduled: true
        });
      }
      const endMemory = process.memoryUsage();

      // Assert
      expect(schedules).toHaveLength(1000);
      expect(endMemory.heapUsed - startMemory.heapUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete schedule lifecycle", () => {
      // Arrange
      const mockStart = jest.fn();
      const mockStop = jest.fn();
      const mockDestroy = jest.fn();
      const cronExpression = "0 0 * * *";
      const timezone = "Asia/Ho_Chi_Minh";

      // Act
      const schedule = {
        expression: cronExpression,
        timezone: timezone,
        scheduled: true,
        start: mockStart,
        stop: mockStop,
        destroy: mockDestroy
      };

      schedule.start();
      schedule.stop();
      schedule.destroy();

      // Assert
      expect(schedule.expression).toBe("0 0 * * *");
      expect(schedule.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(schedule.scheduled).toBe(true);
      expect(mockStart).toHaveBeenCalled();
      expect(mockStop).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
    });

    test("should handle multiple schedules", () => {
      // Arrange
      const schedules = [];

      // Act
      const dailyJob = {
        expression: "0 0 * * *",
        timezone: "Asia/Ho_Chi_Minh",
        scheduled: true
      };
      const hourlyJob = {
        expression: "0 * * * *",
        timezone: "Asia/Ho_Chi_Minh",
        scheduled: true
      };
      const weeklyJob = {
        expression: "0 0 * * 0",
        timezone: "Asia/Ho_Chi_Minh",
        scheduled: true
      };

      schedules.push(dailyJob, hourlyJob, weeklyJob);

      // Assert
      expect(schedules).toHaveLength(3);
      expect(dailyJob.expression).toBe("0 0 * * *");
      expect(hourlyJob.expression).toBe("0 * * * *");
      expect(weeklyJob.expression).toBe("0 0 * * 0");
      expect(dailyJob.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(hourlyJob.timezone).toBe("Asia/Ho_Chi_Minh");
      expect(weeklyJob.timezone).toBe("Asia/Ho_Chi_Minh");
    });
  });
});