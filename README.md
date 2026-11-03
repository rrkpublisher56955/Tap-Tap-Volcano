# Tap Tap Volcano — Web Lens Catalog 003

A portrait-friendly, upward-climbing 3D game built with PlayCanvas, Vite, TypeScript and Snap's official `@snap/web-lens-api` package. The gameplay does not depend on Snapchat capabilities: it remains playable in a normal desktop/mobile browser, with a procedural 3D explorer fallback when Bitmoji is unavailable.

## Gameplay

Tap anywhere in the playable scene to form a stone lift under the explorer. Each lift crumbles after 2.5 seconds; rare spring pads launch about five times higher than a normal lift. Magma rises continuously and accelerates as the run continues and altitude increases. Peak altitude is the score. Marble and Gold platform textures unlock at 25 m and 60 m.

The visual is deliberately a high-contrast, cinematic mobile 3D scene rather than literal 8K textures: PlayCanvas uses local procedural geometry/materials, a warm lava plane, ember particles, rim lighting, fog, spring motion, heat vignette and frosted-glass HUD. This keeps the ZIP compact and suitable for phones.

## Requirements

- Node.js 22+ recommended
- npm
- A browser with WebGL 2 for desktop development

## Quick browser preview (no install needed)

Open `preview.html` directly in a modern browser to play a self-contained visual/gameplay preview. It uses a lightweight canvas scene to test the tap-to-place loop, crumbling platforms, spring launches, rising magma, HUD, pause and replay even when npm is unavailable. This preview is **not** the production PlayCanvas/Web Lens build; `index.html` is the Vite entry point for that build.

## Commands

```powershell
npm install
npm run dev
npm run typecheck
npm run sourcecheck
npm run previewcheck
npm run build
npm run pack
npm run verify
npm run preview
```

Open the local URL printed by Vite. The production build is emitted to `dist/`. `npm run pack` creates `tap-tap-volcano-web-lens.zip` at the project root with `index.html` at the ZIP root. The package script rejects an `index.html` above 1 MiB or a ZIP above 8 MiB. `npm run sourcecheck` checks the project’s required architecture and gameplay hooks without needing to compile dependencies. `npm run previewcheck` parses and checks the standalone preview’s inline JavaScript and required gameplay controls. `npm run verify` checks the built HTML, relative local references, CSS asset references, archive-root layout and package sizes.

To simulate a larger top safe area during development, add `?debugSafeArea=1` to the local page URL.

## Snapchat integration

- `src/host.ts` calls `snapchat.init()` once and checks `isSupported()` before storage, Bitmoji and leaderboards.
- The Snap host's storage key is `volcano-save-v1`; it stores the best altitude and unlocked platform textures. Writes are serialized and only queued after the initial read completes.
- Bitmoji is used only when the host supports it, the player has an avatar, and the host is not the desktop stub. The GLB is loaded promptly; a built-in explorer remains the fallback.
- The score is sent as `snapchat.leaderboards.submitScore({ score })`. Configure a leaderboard named `volcano-altitude` for the Lens in My Lenses; the current API deprecates passing `leaderboardId` to `submitScore`.
- Web Audio begins only after the Start button gesture. Haptic vibration is best-effort and guarded by user activation.

## GitHub Actions

The `.github/workflows/ci.yml` workflow installs dependencies, type-checks the project, runs `sourcecheck`, builds the static Lens, creates the upload ZIP, and verifies the output. The resulting `tap-tap-volcano-web-lens.zip` is uploaded as a workflow artifact. The authoring environment used to prepare this source could not resolve the npm registry (`EAI_AGAIN` for `registry.npmjs.org` and the alternate mirror), so a dependency-backed build could not be run here. Use the workflow or install dependencies on a network-enabled machine before publishing.

## GitHub handoff

The connected GitHub account is `rrkpublisher56955`, but its accessible-repository list is empty, and the current integration cannot create a repository from scratch. Create an empty repository under that account, then provide its repository URL so the project can be committed to the correct target. The included `.github/workflows/ci.yml` runs the production checks and stores the Lens ZIP as a workflow artifact on pushes and pull requests.

## Publishing handoff

1. Run the commands above in an environment with npm registry access and confirm the output of `typecheck`, `build`, `pack`, and `verify`.
2. Test the production output on a phone in portrait. Check touch controls, safe areas, audio, heat/glow feedback and performance.
3. In My Lenses, create a Web Lens and upload `tap-tap-volcano-web-lens.zip`.
4. Add the Lens name, a centered 512 × 512 PNG icon, and a 5-second 720 × 1280 MP4 preview (H.264 video, AAC audio, 30 fps).
5. Submit for review. Desktop stub testing cannot prove live Bitmoji, durable storage or actual Snapchat leaderboard behavior; test in Snapchat after approval.

## Current implementation notes

This repository's authoring environment must be able to fetch npm dependencies before the commands can run. No remote scripts, fonts, images, audio or game server are used by gameplay at runtime. `@snap/web-lens-api` media URLs are only requested inside Snapchat for the optional Bitmoji API.
