// jest.setup.js
// Global setup for Jest tests
import { jest } from '@jest/globals';

// Increase timeout for all tests
jest.setTimeout(30000);

// Global cleanup after each test
afterEach(async () => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Wait for any pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));
  
  // Small delay to ensure cleanup
  await new Promise(resolve => setTimeout(resolve, 50));
});

// Global cleanup after all tests
afterAll(async () => {
  // Force close any remaining handles
  if (global.gc) {
    global.gc();
  }
  
  // Wait a bit for cleanup
  await new Promise(resolve => setTimeout(resolve, 200));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
