import fs from "fs";
import path from "path";

/**
 * Returns the exact total number of frame images in /public/frames/
 * automatically by reading the directory on the server.
 * Checks for both .webp and .jpg/.png files.
 * If /public/frames is temporarily being populated, also checks /frames_backup.
 */
export function getTotalFramesServer(): number {
  try {
    const publicFramesDir = path.join(process.cwd(), "public", "frames");
    const backupDir = path.join(process.cwd(), "frames_backup");

    let targetDir = publicFramesDir;
    if (!fs.existsSync(publicFramesDir) || fs.readdirSync(publicFramesDir).length === 0) {
      if (fs.existsSync(backupDir) && fs.readdirSync(backupDir).length > 0) {
        targetDir = backupDir;
      } else {
        return 0;
      }
    }

    const files = fs.readdirSync(targetDir);
    const frameFiles = files.filter((file) =>
      /^frame_\d+\.(webp|jpe?g|png)$/i.test(file)
    );
    return frameFiles.length;
  } catch (error) {
    console.error("Failed to read frames directory:", error);
    return 0;
  }
}

/**
 * Server check to determine which image extension exists in /public/frames/
 */
export function getPreferredExtensionServer(): "webp" | "jpg" {
  try {
    const publicFramesDir = path.join(process.cwd(), "public", "frames");
    if (fs.existsSync(publicFramesDir)) {
      const files = fs.readdirSync(publicFramesDir);
      if (files.some((f) => f.endsWith(".webp"))) return "webp";
    }
    return "jpg";
  } catch {
    return "webp";
  }
}
