// tests/utils/testCleanup.js
// Utility functions for test cleanup

import mongoose from 'mongoose';
import { jest } from '@jest/globals';

/**
 * Clean up MongoDB connections
 */
export async function cleanupMongoDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error cleaning up MongoDB:', error);
  }
}

/**
 * Clear all timers
 */
export function clearAllTimers() {
  jest.clearAllTimers();
}

/**
 * Wait for cleanup to complete
 */
export async function waitForCleanup(ms = 1000) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Force garbage collection if available
 */
export function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Comprehensive cleanup for tests
 */
export async function comprehensiveCleanup() {
  try {
    // Clear timers
    clearAllTimers();
    
    // Clean up MongoDB
    await cleanupMongoDB();
    
    // Force garbage collection
    forceGC();
    
    // Wait for cleanup
    await waitForCleanup(500);
  } catch (error) {
    console.error('Error during comprehensive cleanup:', error);
  }
}
