# Bubba's Two Worlds — project notes for Claude

A single-file HTML5 canvas platformer. Mobile-first. Lily is the sole engineer.
Live at https://bubbasworld.vercel.app · Bubba on Instagram: @mrbubbaganoush

## Read first

`docs/PHASE_2_ARCHITECTURE.md` is the source of truth for what we are building, why, and in what order. Read it before proposing structural changes. The task graph lives there. The locked design decisions live there. The brainstormed level concepts live there. If a request seems to contradict it, surface that — don't silently override.

## Stack

- One `index.html` with inline `<style>` and `<script>`. No build tools. No npm. Vanilla JS, HTML5 canvas, ~2,000 lines.
- Hosted on Vercel. Pushes to `main` auto-deploy.
- Phase 2A introduces a `/levels/` directory: `manifest.json` plus per-Volume JSON files (`vol-01.json`, `vol-02.json`, …) loaded at runtime via `fetch`. See the architecture doc for the schema.
- `localStorage` is the only persistence layer for Phase 2A. No backend yet.

## Locked design decisions — do not re-litigate without asking

- Core mechanic — orange platforms appear when Bubba faces right, blue when facing left — is untouched. This is the soul of the game. Phase 2 adds depth, not new rules.
- Weekly drop content model: 5 new levels every Monday, episodic, not procedural, not endless. Each weekly drop is a **Volume** (e.g. "Vol 2 · Adventures").
- Level numbering is per-Volume local: each Volume always has L1–L5. No global numbering. UI shows "VOL N." Data IDs are `vol-NN`. Reference shorthand for a specific level: `V{n}-L{1-5}` (e.g., V2-L3).
- Volume archive is first-class. Every Volume stays playable forever via the level select screen.
- Difficulty within a Volume ramps steadily to a climactic Level 5. No "easy reward" or "silly palate cleanser" level mid-pack.
- Level 5 of Volume 1 (vacuum boss) is not being rebalanced. Its difficulty is correct and is the model for future climaxes.
- Backend (Supabase auth, leaderboard, cloud save) is deferred to Phase 2B. Phase 2A is static-only.

## Voice and style

- The in-game narrator is Bubba in first person, ALL CAPS, dog-thought stream of consciousness ("MOM WHY", "OKAY OKAY OKAY WATCH THIS", "THE VACUUM HAS RETURNED. MY ETERNAL NEMESIS"). Preserve this voice in any new intro/win/lose copy.
- Colors come from existing CSS custom properties (`--cream`, `--amber`, `--amber-deep`, `--blue`, `--blue-deep`, `--ink`, `--brown`, `--pink`). Do not introduce new palette values without discussion.
- Pixel art style. The canvas uses `image-rendering: pixelated`. No anti-aliased decorative fonts inside the game canvas.
- No external JavaScript dependencies. The single-file static deploy is part of the project's character. Inline service worker code rather than pulling a library.

## Running locally

- Plain HTML: open `index.html` in a browser.
- For PWA / service worker testing (after T1): serve over HTTP, not `file://`. Quick option: `python3 -m http.server 8000` then open `http://localhost:8000`.
- Real mobile testing is required before declaring any task done. iOS Safari and Android Chrome are the production targets — desktop dev is not enough for a mobile-first canvas game.

## Working preferences

- Read a file before editing it.
- For tasks larger than a single edit, propose a plan in chat **before** writing code. Use plan mode if available.
- Commit after each major task from the architecture doc (T0, T1, T2, …) on its own — each task should be a clean rollback point.
- When scope or design is unclear, ask. A clarifying question is preferred over a wrong-direction first draft.
- Bubba is Lily's real dog. Be respectful of that — when narrator copy is about real Bubba behaviors (lunging, beach, dog park, sleeping on his back), reflect his actual personality, not a generic dog.
