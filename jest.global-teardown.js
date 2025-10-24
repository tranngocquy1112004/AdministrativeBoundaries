// jest.global-teardown.js
// Global teardown that runs once after all tests

export default async function globalTeardown() {
  console.log('🧹 Starting Jest global teardown...');
  
  // Force close any remaining handles
  if (global.gc) {
    global.gc();
  }
  
  // Wait for any remaining operations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Jest global teardown completed');
}
