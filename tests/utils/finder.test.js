// tests/utils/finder.test.js
import { buildTree } from "../../server/utils/finder.js";

describe("🔍 Finder Utils Tests", () => {
  describe("buildTree function", () => {
    test("should build tree from flat list with parent-child relationships", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" },
        { code: "01002", name: "Ba Đình", level: "district", parentCode: "01" },
        { code: "01001001", name: "Hàng Trống", level: "commune", parentCode: "01001" },
        { code: "01001002", name: "Lý Thái Tổ", level: "commune", parentCode: "01001" },
        { code: "01002001", name: "Phúc Xá", level: "commune", parentCode: "01002" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("01");
      expect(result[0].name).toBe("Hà Nội");
      expect(result[0].children).toHaveLength(2);
      
      const hoanKiem = result[0].children.find(child => child.code === "01001");
      expect(hoanKiem).toBeTruthy();
      expect(hoanKiem.name).toBe("Hoàn Kiếm");
      expect(hoanKiem.children).toHaveLength(2);
      
      const baDinh = result[0].children.find(child => child.code === "01002");
      expect(baDinh).toBeTruthy();
      expect(baDinh.name).toBe("Ba Đình");
      expect(baDinh.children).toHaveLength(1);
    });

    test("should handle multiple root nodes", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null },
        { code: "79", name: "Hồ Chí Minh", level: "province", parentCode: null },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" },
        { code: "79001", name: "Quận 1", level: "district", parentCode: "79" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.find(node => node.code === "01")).toBeTruthy();
      expect(result.find(node => node.code === "79")).toBeTruthy();
      
      const hanoi = result.find(node => node.code === "01");
      expect(hanoi.children).toHaveLength(1);
      expect(hanoi.children[0].code).toBe("01001");
      
      const hcm = result.find(node => node.code === "79");
      expect(hcm.children).toHaveLength(1);
      expect(hcm.children[0].code).toBe("79001");
    });

    test("should handle empty input array", () => {
      // Arrange
      const units = [];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    test("should handle single node without parent", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("01");
      expect(result[0].name).toBe("Hà Nội");
      expect(result[0].children).toHaveLength(0);
    });

    test("should handle single node with invalid parent", () => {
      // Arrange
      const units = [
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "99" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("01001");
      expect(result[0].name).toBe("Hoàn Kiếm");
      expect(result[0].children).toHaveLength(0);
    });

    test("should handle nodes with missing parentCode", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province" },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("01");
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].code).toBe("01001");
    });

    test("should preserve all original properties", () => {
      // Arrange
      const units = [
        { 
          code: "01", 
          name: "Hà Nội", 
          level: "province", 
          parentCode: null,
          englishName: "Hanoi",
          administrativeLevel: "Thành phố",
          decree: "Decree 123",
          boundary: { type: "Polygon", coordinates: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          code: "01001", 
          name: "Hoàn Kiếm", 
          level: "district", 
          parentCode: "01",
          provinceCode: "01",
          provinceName: "Hà Nội"
        }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result[0]).toHaveProperty("englishName");
      expect(result[0]).toHaveProperty("administrativeLevel");
      expect(result[0]).toHaveProperty("decree");
      expect(result[0]).toHaveProperty("boundary");
      expect(result[0]).toHaveProperty("createdAt");
      expect(result[0]).toHaveProperty("updatedAt");
      expect(result[0].children[0]).toHaveProperty("provinceCode");
      expect(result[0].children[0]).toHaveProperty("provinceName");
    });

    test("should handle deep nesting", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" },
        { code: "01001001", name: "Hàng Trống", level: "commune", parentCode: "01001" },
        { code: "01001001001", name: "Tổ 1", level: "hamlet", parentCode: "01001001" },
        { code: "01001001002", name: "Tổ 2", level: "hamlet", parentCode: "01001001" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].children).toHaveLength(2);
    });

    test("should handle circular references gracefully", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: "01001" },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(0); // Both become orphaned due to circular reference
    });

    test("should handle duplicate codes", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội 1", level: "province", parentCode: null },
        { code: "01", name: "Hà Nội 2", level: "province", parentCode: null },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1); // Only one node becomes root (first one)
      expect(result[0].children).toHaveLength(0); // No valid parent found
    });

    test("should handle null and undefined values", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" },
        { code: "01002", name: "Ba Đình", level: "district", parentCode: undefined }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(2); // One root node and one orphaned node
      expect(result[0].children).toHaveLength(1);
      expect(result[1].code).toBe("01002");
    });

    test("should handle empty parentCode string", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: "" },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("01");
      expect(result[0].children).toHaveLength(1);
    });

    test("should handle large dataset efficiently", () => {
      // Arrange: Create large dataset
      const units = [];
      for (let i = 1; i <= 100; i++) {
        units.push({
          code: i.toString().padStart(2, '0'),
          name: `Province ${i}`,
          level: "province",
          parentCode: null
        });
        
        for (let j = 1; j <= 10; j++) {
          const districtCode = `${i.toString().padStart(2, '0')}${j.toString().padStart(2, '0')}`;
          units.push({
            code: districtCode,
            name: `District ${i}-${j}`,
            level: "district",
            parentCode: i.toString().padStart(2, '0')
          });
        }
      }

      // Act
      const startTime = Date.now();
      const result = buildTree(units);
      const endTime = Date.now();

      // Assert
      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result[0].children).toHaveLength(10);
    });

    test("should handle mixed data types", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null, value: 123 },
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01", flag: true },
        { code: "01001001", name: "Hàng Trống", level: "commune", parentCode: "01001", data: null }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result[0]).toHaveProperty("value", 123);
      expect(result[0].children[0]).toHaveProperty("flag", true);
      expect(result[0].children[0].children[0]).toHaveProperty("data", null);
    });

    test("should handle special characters in codes and names", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội (Thủ đô)", level: "province", parentCode: null },
        { code: "01-001", name: "Hoàn Kiếm - Trung tâm", level: "district", parentCode: "01" },
        { code: "01-001-001", name: "Hàng Trống & Lý Thái Tổ", level: "commune", parentCode: "01-001" }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Hà Nội (Thủ đô)");
      expect(result[0].children[0].name).toBe("Hoàn Kiếm - Trung tâm");
      expect(result[0].children[0].children[0].name).toBe("Hàng Trống & Lý Thái Tổ");
    });

    test("should handle numeric codes", () => {
      // Arrange
      const units = [
        { code: 1, name: "Hà Nội", level: "province", parentCode: null },
        { code: 101, name: "Hoàn Kiếm", level: "district", parentCode: 1 },
        { code: 10101, name: "Hàng Trống", level: "commune", parentCode: 101 }
      ];

      // Act
      const result = buildTree(units);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(1);
      expect(result[0].children[0].code).toBe(101);
      expect(result[0].children[0].children[0].code).toBe(10101);
    });
  });

  describe("Edge Cases", () => {
    test("should handle null input", () => {
      // Act & Assert
      expect(() => buildTree(null)).toThrow();
    });

    test("should handle undefined input", () => {
      // Act & Assert
      expect(() => buildTree(undefined)).toThrow();
    });

    test("should handle non-array input", () => {
      // Act & Assert
      expect(() => buildTree("not an array")).not.toThrow();
      expect(() => buildTree(123)).not.toThrow();
      expect(() => buildTree({})).not.toThrow();
    });

    test("should handle array with null elements", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null },
        null,
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" }
      ];

      // Act & Assert
      expect(() => buildTree(units)).toThrow();
    });

    test("should handle array with undefined elements", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null },
        undefined,
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" }
      ];

      // Act & Assert
      expect(() => buildTree(units)).toThrow();
    });

    test("should handle array with non-object elements", () => {
      // Arrange
      const units = [
        { code: "01", name: "Hà Nội", level: "province", parentCode: null },
        "not an object",
        { code: "01001", name: "Hoàn Kiếm", level: "district", parentCode: "01" }
      ];

      // Act & Assert
      expect(() => buildTree(units)).not.toThrow();
    });
  });
});

