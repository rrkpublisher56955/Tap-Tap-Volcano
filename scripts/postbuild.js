import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const outputPublic = path.join(rootDir, ".output", "public");
const vercelStatic = path.join(rootDir, ".vercel", "output", "static");
const distDir = path.join(rootDir, "dist");

console.log("▶ Running postbuild synchronization...");

// 1. Determine source static output directory
const sourceDir = fs.existsSync(outputPublic)
  ? outputPublic
  : fs.existsSync(vercelStatic)
    ? vercelStatic
    : null;

if (sourceDir) {
  // Ensure dist exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy all assets to dist
  fs.cpSync(sourceDir, distDir, { recursive: true, force: true });
  console.log(`✓ Synchronized assets from ${sourceDir} to ${distDir}`);

  // Ensure 404.html exists for SPA fallback routing
  const indexPath = path.join(distDir, "index.html");
  const fallback404 = path.join(distDir, "404.html");
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, fallback404);
    console.log("✓ Created dist/404.html for SPA client-side routing");
  }
} else {
  console.warn("Notice: No static output directory found to synchronize.");
}

console.log("✓ Postbuild synchronization complete.");
