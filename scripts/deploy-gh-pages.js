import { execSync } from "node:child_process";
import { existsSync, rmSync, cpSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import https from "node:https";

const rootDir = process.cwd();
const distDir = resolve(rootDir, "dist");
const tempDir = join(tmpdir(), `gh-pages-deploy-${Date.now()}`);

let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const repoOwner = "rrkpublisher56955";
const repoName = "Tap-Tap-Volcano";

let originUrl = `https://github.com/${repoOwner}/${repoName}.git`;
try {
  const currentRemote = execSync("git remote get-url origin", { cwd: rootDir, encoding: "utf-8" }).trim();
  if (currentRemote) {
    originUrl = currentRemote;
    if (!token && currentRemote.includes("@github.com")) {
      const match = currentRemote.match(/https:\/\/([^@]+)@github\.com/);
      if (match) token = match[1];
    }
  }
} catch {}

console.log("🚀 Building Tap Tap Volcano for GitHub Pages...");
execSync("npm run build", { stdio: "inherit", cwd: rootDir });

if (!existsSync(distDir) || !existsSync(join(distDir, "index.html"))) {
  console.error("❌ Build failed to generate dist/index.html");
  process.exit(1);
}

// Copy to temp directory for clean orphan branch push
if (existsSync(tempDir)) {
  rmSync(tempDir, { recursive: true, force: true });
}
cpSync(distDir, tempDir, { recursive: true });

console.log("📦 Initializing orphan git branch for gh-pages...");
execSync("git init", { stdio: "inherit", cwd: tempDir });
execSync('git config user.name "rrkpublisher56955"', { stdio: "inherit", cwd: tempDir });
execSync('git config user.email "rrkpublisher56955@gmail.com"', { stdio: "inherit", cwd: tempDir });
execSync("git checkout -b gh-pages", { stdio: "inherit", cwd: tempDir });
execSync("git add -A", { stdio: "inherit", cwd: tempDir });
execSync(
  'git commit -m "deploy(pages): publish Apple Design & 8K Retina Tap Tap Volcano to GitHub Pages"',
  { stdio: "inherit", cwd: tempDir },
);

console.log("🚀 Pushing to gh-pages branch on GitHub...");
execSync(`git remote add origin ${originUrl}`, { stdio: "inherit", cwd: tempDir });
execSync("git push -f origin gh-pages", { stdio: "inherit", cwd: tempDir });

// Clean up temp dir
try {
  rmSync(tempDir, { recursive: true, force: true });
} catch {}

if (token) {
  console.log("⚙️  Configuring GitHub Pages source to gh-pages branch via API...");
  const req = https.request(
    {
      hostname: "api.github.com",
      path: `/repos/${repoOwner}/${repoName}/pages`,
      method: "PUT",
      headers: {
        "User-Agent": "NodeJS",
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
    },
    (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        console.log(`✅ GitHub Pages configured! API Status: ${res.statusCode}`);
        console.log(`🌐 Live URL: https://${repoOwner.toLowerCase()}.github.io/${repoName}/`);
      });
    },
  );

  req.on("error", (err) => {
    console.error("Pages API error:", err);
  });

  req.write(JSON.stringify({ source: { branch: "gh-pages", path: "/" } }));
  req.end();
} else {
  console.log(`🌐 Live URL: https://${repoOwner.toLowerCase()}.github.io/${repoName}/`);
}
