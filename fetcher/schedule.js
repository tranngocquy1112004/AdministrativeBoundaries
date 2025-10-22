import cron from "node-cron";
import { fetchAdministrativeData } from "./index.js";

cron.schedule("0 3 * * *", async () => {
  console.log("⏰ Running daily update...");
  await fetchAdministrativeData();
  console.log("✅ Update complete");
});
