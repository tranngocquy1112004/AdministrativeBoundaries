// jest.global-setup.js
// Global setup that runs once before all tests

export default async function globalSetup() {
  console.log('🚀 Starting Jest global setup...');
  
  // Set up environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  
  console.log('✅ Jest global setup completed');
}
