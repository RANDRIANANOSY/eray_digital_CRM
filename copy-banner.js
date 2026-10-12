import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath =
  "C:/Users/Maminiriana_Alain/.gemini/antigravity-ide/brain/b470e8b7-b9a2-4ede-b19f-4243a079544c/welcome_banner_illustration_1789031880029.jpg";
const destDir = path.join(__dirname, "src", "assets");
const destPath = path.join(destDir, "welcome-banner.jpg");

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log("SUCCESS: Banner copied to " + destPath);
  } else {
    console.error("ERROR: Source file not found at " + sourcePath);
  }
} catch (err) {
  console.error("ERROR: Failed to copy banner: ", err);
}
