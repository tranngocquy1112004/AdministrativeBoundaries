// tests/middleware/validateUnit.test.js
import validateUnit from "../../server/middleware/validateUnit.js";
import { jest } from "@jest/globals";

describe("🔍 ValidateUnit Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe("Valid Input Validation", () => {
    test("should pass validation for valid province data", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("should pass validation for valid district data", () => {
      // Arrange
      req.body = {
        name: "Quận Test",
        code: "99001",
        level: "district"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("should pass validation for valid commune data", () => {
      // Arrange
      req.body = {
        name: "Phường Test",
        code: "99001001",
        level: "commune"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("should pass validation with additional fields", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: "province",
        englishName: "Test Province",
        administrativeLevel: "Tỉnh",
        decree: "Test Decree",
        parentCode: null,
        provinceCode: "99",
        provinceName: "Tỉnh Test"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("Invalid Name Validation", () => {
    test("should reject missing name", () => {
      // Arrange
      req.body = {
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject null name", () => {
      // Arrange
      req.body = {
        name: null,
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject undefined name", () => {
      // Arrange
      req.body = {
        name: undefined,
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject empty string name", () => {
      // Arrange
      req.body = {
        name: "",
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject whitespace-only name", () => {
      // Arrange
      req.body = {
        name: "   ",
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject non-string name", () => {
      // Arrange
      req.body = {
        name: 123,
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject array name", () => {
      // Arrange
      req.body = {
        name: ["Tỉnh Test"],
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject object name", () => {
      // Arrange
      req.body = {
        name: { value: "Tỉnh Test" },
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Invalid Code Validation", () => {
    test("should reject missing code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject null code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: null,
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject undefined code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: undefined,
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject empty string code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject whitespace-only code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "   ",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject non-string code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: 99,
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject array code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: ["99"],
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject object code", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: { value: "99" },
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Invalid Level Validation", () => {
    test("should reject missing level", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject null level", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: null
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject undefined level", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: undefined
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject invalid level values", () => {
      // Arrange
      const invalidLevels = [
        "invalid",
        "city",
        "town",
        "village",
        "ward",
        "hamlet",
        "region",
        "area",
        "zone",
        "territory"
      ];

      for (const level of invalidLevels) {
        req.body = {
          name: "Tỉnh Test",
          code: "99",
          level: level
        };

        // Act
        validateUnit(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
        });
        expect(next).not.toHaveBeenCalled();

        // Reset mocks for next iteration
        res.status.mockClear();
        res.json.mockClear();
        next.mockClear();
      }
    });

    test("should reject case-sensitive level values", () => {
      // Arrange
      const caseSensitiveLevels = [
        "Province",
        "DISTRICT",
        "Commune",
        "PROVINCE",
        "District",
        "COMMUNE"
      ];

      for (const level of caseSensitiveLevels) {
        req.body = {
          name: "Tỉnh Test",
          code: "99",
          level: level
        };

        // Act
        validateUnit(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
        });
        expect(next).not.toHaveBeenCalled();

        // Reset mocks for next iteration
        res.status.mockClear();
        res.json.mockClear();
        next.mockClear();
      }
    });

    test("should reject non-string level", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: 123
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject array level", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: ["province"]
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject object level", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: { value: "province" }
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'level' field. Must be one of: province, district, commune"
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Multiple Field Validation", () => {
    test("should reject when multiple fields are invalid", () => {
      // Arrange
      req.body = {
        name: "",
        code: "",
        level: "invalid"
      };

      // Act
      validateUnit(req, res, next);

      // Assert - Should fail on first invalid field (name)
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject when name and code are invalid", () => {
      // Arrange
      req.body = {
        name: null,
        code: null,
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert - Should fail on first invalid field (name)
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject when code and level are invalid", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: null,
        level: "invalid"
      };

      // Act
      validateUnit(req, res, next);

      // Assert - Should fail on first invalid field (code)
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'code' field."
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty request body", () => {
      // Arrange
      req.body = {};

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle null request body", () => {
      // Arrange
      req.body = null;

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Request body is required."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle undefined request body", () => {
      // Arrange
      req.body = undefined;

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Request body is required."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle very long valid strings", () => {
      // Arrange
      const longName = "A".repeat(1000);
      const longCode = "B".repeat(100);
      
      req.body = {
        name: longName,
        code: longCode,
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("should handle special characters in valid strings", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Nghệ An (Special Characters: !@#$%^&*())",
        code: "40-SPECIAL-001",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("Response Format", () => {
    test("should return consistent error response format", () => {
      // Arrange
      req.body = {
        name: "",
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or missing 'name' field."
      });
      expect(res.status).toHaveReturnedWith(res);
      expect(res.json).toHaveReturnedWith(res);
    });

    test("should not call next when validation fails", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
    });

    test("should call next when validation passes", () => {
      // Arrange
      req.body = {
        name: "Tỉnh Test",
        code: "99",
        level: "province"
      };

      // Act
      validateUnit(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });
  });
});

