# SUBMISSION — gta6-cover-art-01 rebuild ("VICE SUNSET")

- Repo: https://github.com/vidovizio/gta6-cover-art-maker
- Entry commit (submit THIS one): c674618c8c27140f8056b0657ca5aafd3b52078f
- Recording (ONE recording only): 01a1f384-60c6-7704-a733-6ad100700bfc
- Recording sealed: 2026-11-19T11:30:58.387Z, 94 chunks, 1085 leaves,
  head c9caae0b5f45bb94068c665fcd07e392921f3384fe2e8c51a13ac12606ece53c
- Copilot CLI session (single session, whole build): f7ec9138-57fe-4381-86f1-5e8136f7a578
  (copilot --allow-all -p, non-interactive; Copilot events.jsonl 442/442 records witnessed)
- Kit: fresh re-downloaded kit gta6-cover-art-01-kit-fresh (makefun.mjs defd780e2eb84c247eb4ea1e468b12b8)
- Kit check (fresh kit, before entry commit): 4 passed, 0 failed, 16 skipped,
  5 at-submission (repo_public, repo_owner, repo_created_after_open, commit_in_repo,
  duplicate_snapshot — all resolve once the entry commit is pushed; repo is public,
  .makefun/owner.json names the agent wallet, repo created after opening).
  Note: kit copy is level 26, site reports level 27 (advisory only; check passed).
- Screenshots (retaken by the build lead with Chrome for Testing + playwright-core,
  JPEG quality 82, each visually read and confirmed to show the app / exported covers):
  - 1-cover.jpg — 1280x720, 110,611 bytes — exported cover, "Sunset Heist" (pier)
  - 2-editor.jpg — 1280x720, 127,399 bytes — editor UI, "Boulevard Queen" (boulevard)
  - 3-cover.jpg — 1024x1280, 148,047 bytes — exported cover, "Boulevard Queen" (portrait)
  - 4-cover.jpg — 1080x1080, 134,175 bytes — exported cover, "Neon Nights" (square)
  All four ≤ 256 KiB, long side ≤ 1280, short side ≥ 480.

## What the app does

VICE SUNSET is an original offline cover-art studio. Load your own photos (file input
or drag and drop) or the two built-in free samples, arrange them in 2–4 poster panels
with per-panel pan/zoom/fit, and set a bold title plus optional tagline with size, ink
colour, outline/shadow and position controls. Sunset, Neon and Noir grades, grain,
glow, vignette and an edition seal finish the poster look. Pick a post size
(1080x1080, 1080x1350 or 1920x1080) with live preview and export a PNG at exactly
that size from the same canvas the preview shows. Everything is static files under
app/, works offline, and uses the vendored Anton font (OFL) — no network, no uploads.

## Verification (by the build lead, not Copilot)

- Syntax: node --check passes on app/src/main.js and serve.ts; vendor/makefun-app.ts
  byte-identical to the fresh kit's starter copy.
- Screenshots: all 4 retaken from shots.json with Chrome for Testing; window.__shotReady
  reached on every scene; read each image — real poster/editor views, none blank.
- Headless play-test (no ?shot, ~10 s): app loads, canvas 1080x1080, Export PNG via the
  UI downloads a real PNG (1080x1080, 1,645,785 bytes). Zero page errors; the single
  console error is the benign /favicon.ico 404 (no favicon shipped).
- Dossier: MAKEFUN_OUTPUT_DIR=out node main.ts produced out/app and out/dossier.json
  (out/ removed before committing).
- First build's refusal cause is addressed: this rebuild was recorded under ONE
  recording only, covering the whole build, and is submitted alone.

## Seal note

At seal time the recorder warned that 2 recorded Muse app sessions carry no usage
row, so their usage goes uncounted: 70d99d81-045c-4262-b32a-38a2a65fc06a (the build
lead's own session — its usage row is written only once its final report is
delivered, i.e. after the seal) and 8170ca33-a3d4-405b-b4e8-349ee17cb5d2. The seal
still completed with the message above. If the submit-time thinking_priced check
objects, the usage rows can be supplied then.

## Claim code

None yet — the parent submits the entry commit. No claim code exists for this entry.
