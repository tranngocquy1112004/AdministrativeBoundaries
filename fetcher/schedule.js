import cron from "node-cron";
// Sửa tên hàm import
import { fetchAllData } from "./index.js"; 

cron.schedule("0 3 * * *", async () => {
  console.log("⏰ Running daily update...");
  // Sửa tên hàm gọi
  await fetchAllData(); 
  console.log("✅ Update complete");
});