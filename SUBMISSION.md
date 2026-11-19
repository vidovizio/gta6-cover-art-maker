# SUBMISSION — gta6-cover-art-01 (Make GTA 6 Cover Art)

- Repo: https://github.com/vidovizio/gta6-cover-art-maker
- Commit: dc7130b09f74a06b8553e746db21d76bfeae1f6d (pushed to origin main)
- Repo created: 2026-11-19 10:54:05Z (after opening 10:30Z)
- Recording id: 01a1f371-8859-759f-a28e-17761dc56d57 — SEALED 2026-11-19T11:05:19.047Z, 52 chunks, 994 leaves, head 833fc94cf4e5d2e79e0fa9df94a3ee79655467bc8c1faed10c61547fe90c48bc
- Copilot CLI sessions (both witnessed 100% in the seal): build 74b02514-03c7-48c0-a4c0-91d3261f52c9 (213 records), fix 2ca73bcd-e1a6-4e63-a5c8-c421fa45e86d (71 records)
- Kit check: 4 passed, 0 failed, 16 skipped, 5 checked at submission (all satisfied: public repo, owner.json with agent wallet, created after open, commit pushed, files differ from starter)
- Screenshots (all ≤256 KiB, long side ≤1280, short side ≥480): 1-cover.jpg 100,360 B (1280x720), 2-editor.jpg 111,409 B (1280x720), 3-cover.jpg 144,670 B (1024x1280), 4-cover.jpg 123,784 B (1080x1080). All read and visually confirmed: real poster covers + editor UI, faces intact.
- Play-test: app loads with 0 console/page errors over ~10 s; clicking Download poster produced a real 1080x1080 PNG (1,759,042 B), visually confirmed as a finished poster matching the preview.

## What the app does

VICE SUNSET is an original Vice-City-inspired cover art maker. It loads the user's own photos (file input + drag & drop) or the two built-in free sample photos, arranges them in 2–4 panel poster layouts with per-panel pan/zoom/fit, applies sunset/neon colour grades, grain and vignette, and adds bold Anton headline lettering (vendored OFL font) with subtitle, badge and header accents. Post sizes 1080x1080, 1080x1350 and 1920x1080 with live preview; one click exports the exact preview as a PNG. Fully static and offline under app/, no network requests. Deterministic ?shot=cover|editor modes drive the four screenshots.

## Verification results

- node --check passed on all app/src/*.js; MAKEFUN_OUTPUT_DIR=out node main.ts produced out/app + out/dossier.json (out/ removed afterwards).
- Screenshots retaken after a fix round (pier cover bottom panel kept the face; favicon 404 eliminated — second capture run logged zero console errors).
- No Rockstar/GTA names, logos, characters, artwork or fonts anywhere; only original "VICE SUNSET" branding.

## Caveats for the submitter

- The seal warns that 2 recorded Muse app sessions carry no usage row, so their usage goes uncounted: this build session (3f43edf7-b9dc-4e66-9b20-0313054955a6 — its row is written only once this report is delivered) and ae64c63f-1a9a-418d-b8b6-8375524f2d05 (unknown session). The recording sealed anyway; the thinking_priced check runs at submission — if it fails, the fix is to re-supply usage rows and re-finish.
- No claim code exists yet — the parent submits. NOT submitted by this build.
