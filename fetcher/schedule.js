import cron from "node-cron";
// Sửa tên hàm import
import { fetchAllData } from "./index.js"; 

// Only start cron job if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const cronJob = cron.schedule("0 3 * * *", async () => {
    console.log("⏰ Running daily update...");
    // Sửa tên hàm gọi
    await fetchAllData(); 
    console.log("✅ Update complete");
  });

  // Export cron job for cleanup if needed
  export { cronJob };
} else {
  // Export empty object for tests
  export const cronJob = null;
}