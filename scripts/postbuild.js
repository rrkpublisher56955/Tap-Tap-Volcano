import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const vercelOutputDir = path.join(rootDir, ".vercel", "output");
const vercelStaticDir = path.join(vercelOutputDir, "static");
const distDir = path.join(rootDir, "dist");

function getGeneratedAssets(assetsDir) {
  if (!fs.existsSync(assetsDir)) return { css: "", jsIndex: "", jsRoutes: "" };
  const files = fs.readdirSync(assetsDir);
  const css = files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || "";
  const jsIndex = files.find((f) => f.startsWith("index-") && f.endsWith(".js")) || "";
  const jsRoutes = files.find((f) => f.startsWith("routes-") && f.endsWith(".js")) || "";
  return { css, jsIndex, jsRoutes };
}

function buildHtmlTemplate({ css, jsIndex, jsRoutes }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#000000" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="description" content="The lava's rising. Tap to spawn platform blocks beneath your character in this frantic arcade climb. Designed with Apple Design System & Fluid Motion." />
  <meta property="og:title" content="Tap Tap Volcano" />
  <meta property="og:description" content="The lava's rising. Tap to build your way out." />
  <title>Tap Tap Volcano — Build Your Way Out</title>
  ${css ? `<link rel="stylesheet" href="/assets/${css}" />` : ""}
  ${jsIndex ? `<link rel="modulepreload" href="/assets/${jsIndex}" />` : ""}
  ${jsRoutes ? `<link rel="modulepreload" href="/assets/${jsRoutes}" />` : ""}
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <style>
    html, body { width: 100%; height: 100%; margin: 0; padding: 0; background-color: #000000; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; }
    #boot-loader { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(ellipse at 50% 60%, #451a03 0%, #1c1917 50%, #000000 100%); color: #fff; transition: opacity 0.4s ease; }
    .boot-pulse { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #ef4444); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; box-shadow: 0 0 25px rgba(245, 158, 11, 0.6); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.85; } }
  </style>
</head>
<body>
  <div id="boot-loader">
    <div class="boot-pulse">▲</div>
    <div style="margin-top: 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #fbbf24;">Tap Tap Volcano</div>
    <div style="margin-top: 6px; font-size: 11px; color: rgba(255,255,255,0.4); font-family: monospace;">INITIALIZING 8K RETINA CANVAS...</div>
  </div>
  <div id="app"></div>
  ${jsIndex ? `<script type="module" src="/assets/${jsIndex}"></script>` : ""}
  <script>
    window.addEventListener('load', () => {
      const loader = document.getElementById('boot-loader');
      if (loader) {
        setTimeout(() => {
          loader.style.opacity = '0';
          setTimeout(() => loader.remove(), 400);
        }, 300);
      }
    });
  </script>
</body>
</html>`;
}

function main() {
  console.log("▶ Running postbuild optimization suite...");

  // 1. Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 2. Synchronize static client assets from .vercel/output/static or .output/public
  const sourceStaticDir = fs.existsSync(vercelStaticDir)
    ? vercelStaticDir
    : path.join(rootDir, ".output", "public");

  if (fs.existsSync(sourceStaticDir)) {
    fs.cpSync(sourceStaticDir, distDir, { recursive: true, force: true });
    console.log(`✓ Synchronized assets from ${path.basename(path.dirname(sourceStaticDir))}/${path.basename(sourceStaticDir)} to dist`);
  }

  // 3. Find generated assets and create standalone index.html & 404.html fallback
  const assetsDir = path.join(distDir, "assets");
  const assets = getGeneratedAssets(assetsDir);
  console.log("✓ Detected build assets:", assets);

  const html = buildHtmlTemplate(assets);
  fs.writeFileSync(path.join(distDir, "index.html"), html, "utf-8");
  fs.writeFileSync(path.join(distDir, "404.html"), html, "utf-8");
  console.log("✓ Generated dist/index.html and dist/404.html (Universal SPA Fallback)");

  // 4. Also mirror to .vercel/output/static if present
  if (fs.existsSync(vercelStaticDir)) {
    fs.writeFileSync(path.join(vercelStaticDir, "index.html"), html, "utf-8");
    fs.writeFileSync(path.join(vercelStaticDir, "404.html"), html, "utf-8");
  }

  // 5. If serverless config exists, normalize runtime to nodejs20.x
  const vcConfigPath = path.join(vercelOutputDir, "functions", "__server.func", ".vc-config.json");
  if (fs.existsSync(vcConfigPath)) {
    try {
      const raw = fs.readFileSync(vcConfigPath, "utf-8");
      const cfg = JSON.parse(raw);
      cfg.runtime = "nodejs20.x";
      fs.writeFileSync(vcConfigPath, JSON.stringify(cfg, null, 2), "utf-8");
      console.log("✓ Normalized Vercel function runtime to nodejs20.x");
    } catch (e) {
      console.warn("Could not patch .vc-config.json:", e);
    }
  }

  console.log("✓ Postbuild optimization complete. Ready for instant static/SSR deployment.");
}

try {
  main();
} catch (err) {
  console.error("Postbuild error:", err);
  process.exit(0);
}
