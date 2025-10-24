/**
 * @type {import('jest').Config}
 */
export default {
  // 💡 Chạy test trong môi trường Node.js (phù hợp cho backend)
  testEnvironment: "node",

  // 🧠 Thư mục chứa file test
  roots: ["<rootDir>/tests"],

  // 📁 Mẫu file test
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],

  // 🔍 Cấu hình module import
  moduleFileExtensions: ["js", "json", "jsx", "node"],
  
  // 🔄 Transform ESM modules
  transform: {},

  // 🧩 Hiển thị chi tiết kết quả test
  verbose: true,

  // 🧹 Dọn dẹp mock sau mỗi test
  clearMocks: true,

  // ⏱️ Timeout settings để tránh Jest hanging
  testTimeout: 30000, // 30 seconds
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // 💬 Báo cáo coverage (bao phủ code)
  collectCoverage: true,
  collectCoverageFrom: [
    "server/**/*.js",
    "fetcher/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",

  // 🧱 Alias import (tùy chọn)
  moduleNameMapper: {
    "^@data/(.*)$": "<rootDir>/data/$1",
    "^@server/(.*)$": "<rootDir>/server/$1",
    "^@utils/(.*)$": "<rootDir>/utils/$1"
  },

  // 🔧 Global setup và teardown
  globalSetup: "<rootDir>/jest.global-setup.js",
  globalTeardown: "<rootDir>/jest.global-teardown.js",
};
