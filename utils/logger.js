import fs from "fs";
import path from "path";

const LOG_PATH = path.resolve("data/fetch.log");

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(line.trim());
}

export const logInfo = (msg) => log(`INFO: ${msg}`);
export const logError = (msg) => log(`ERROR: ${msg}`);
