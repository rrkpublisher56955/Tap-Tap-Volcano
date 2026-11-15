import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const vercelStaticDir = path.join(rootDir, ".vercel", "output", "static");
const distDir = path.join(rootDir, "dist");

// 1. Ensure dist directory exists for static hosts that look for 'dist'
if (fs.existsSync(vercelStaticDir)) {
  fs.cpSync(vercelStaticDir, distDir, { recursive: true, force: true });
  console.log("✓ Copied .vercel/output/static to dist for static host compatibility.");
} else {
  const outputPublic = path.join(rootDir, ".output", "public");
  if (fs.existsSync(outputPublic)) {
    fs.cpSync(outputPublic, distDir, { recursive: true, force: true });
    console.log("✓ Copied .output/public to dist for static host compatibility.");
  }
}

// 2. Normalize Vercel Serverless Function runtime to an officially supported Node version (nodejs20.x)
const vcConfigPath = path.join(
  rootDir,
  ".vercel",
  "output",
  "functions",
  "__server.func",
  ".vc-config.json",
);
if (fs.existsSync(vcConfigPath)) {
  try {
    const raw = fs.readFileSync(vcConfigPath, "utf-8");
    const cfg = JSON.parse(raw);
    console.log(`✓ Normalizing Vercel function runtime from ${cfg.runtime} to nodejs20.x`);
    cfg.runtime = "nodejs20.x";
    fs.writeFileSync(vcConfigPath, JSON.stringify(cfg, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not patch .vc-config.json:", err);
  }
}
