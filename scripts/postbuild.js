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

  // 2. Normalize index.html paths to relative (./) for multi-host compatibility (GitHub Pages + Vercel)
  const distIndexPath = path.join(distDir, "index.html");
  if (fs.existsSync(distIndexPath)) {
    let html = fs.readFileSync(distIndexPath, "utf-8");
    html = html.replace(/href="\/assets\//g, 'href="./assets/');
    html = html.replace(/src="\/assets\//g, 'src="./assets/');
    html = html.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
    fs.writeFileSync(distIndexPath, html, "utf-8");
    console.log("✓ Normalized dist/index.html to relative paths for GitHub Pages subpath support");

    // Create 404.html fallback for client-side routing on GitHub Pages
    const fallback404 = path.join(distDir, "404.html");
    fs.writeFileSync(fallback404, html, "utf-8");
    console.log("✓ Created dist/404.html for SPA client-side routing");
  }

  // 3. Create .nojekyll in both dist and sourceDir to bypass Jekyll processing on GitHub Pages
  fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf-8");
  if (fs.existsSync(outputPublic)) {
    fs.writeFileSync(path.join(outputPublic, ".nojekyll"), "", "utf-8");
  }
  console.log("✓ Created .nojekyll marker to bypass GitHub Pages Jekyll builds");
} else {
  console.warn("Notice: No static output directory found to synchronize.");
}

console.log("✓ Postbuild synchronization complete.");
