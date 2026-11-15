import fs from "fs";
import path from "path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const vercelOutputDir = path.join(rootDir, ".vercel", "output");
const vercelStaticDir = path.join(vercelOutputDir, "static");
const distDir = path.join(rootDir, "dist");

async function main() {
  console.log("▶ Running postbuild optimization suite...");

  // 1. Normalize Vercel Serverless Function runtime to an officially supported Node version (nodejs20.x)
  const vcConfigPath = path.join(
    vercelOutputDir,
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

  // 2. Prerender root index.html from Nitro SSR handler for static host & filesystem fallback
  const serverPath = path.join(
    vercelOutputDir,
    "functions",
    "__server.func",
    "index.mjs",
  );
  if (fs.existsSync(serverPath)) {
    try {
      const fileUrl = pathToFileURL(serverPath).href;
      const serverModule = await import(fileUrl);
      if (serverModule?.default?.fetch) {
        const req = new Request("http://localhost/");
        const res = await serverModule.default.fetch(req);
        if (res.ok) {
          const html = await res.text();
          if (fs.existsSync(vercelStaticDir)) {
            fs.writeFileSync(path.join(vercelStaticDir, "index.html"), html, "utf-8");
            fs.writeFileSync(path.join(vercelStaticDir, "404.html"), html, "utf-8");
            console.log("✓ Pre-rendered index.html & 404.html to .vercel/output/static");
          }
        }
      }
    } catch (err) {
      console.warn("Prerender notice (non-fatal):", err.message);
    }
  }

  // 3. Ensure dist directory exists and is synced for static hosts (Vercel / Cloudflare / Netlify)
  if (fs.existsSync(vercelStaticDir)) {
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    fs.cpSync(vercelStaticDir, distDir, { recursive: true, force: true });
    console.log("✓ Synchronized .vercel/output/static to dist directory.");
  } else {
    const outputPublic = path.join(rootDir, ".output", "public");
    if (fs.existsSync(outputPublic)) {
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
      fs.cpSync(outputPublic, distDir, { recursive: true, force: true });
      console.log("✓ Synchronized .output/public to dist directory.");
    }
  }

  console.log("✓ Postbuild optimization complete.");
}

main().catch((err) => {
  console.error("Postbuild error:", err);
  process.exit(0);
});
