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

## Level authoring — engine constraints

These rules are not stylistic. Violating any produces an unbeatable level (verified the hard way during V3 authoring).

- **Color-side convention is mandatory.** Amber sits to the RIGHT of every launch position; blue sits to the LEFT. The engine couples `b.facing` to input direction, so pressing right forces face-right which makes blue ghost. Blue-on-right is unreachable: to LAND, Bubba must face left, but to FLY right, he must face right.
- **Coyote-flip is THE traversal mechanic.** Stand on amber's left edge facing right → press LEFT (amber ghosts, Bubba falls) → press JUMP within ~6 coyote frames → launches up-left, now facing left → blue is solid → land. Every cross-color elevation gain uses this.
- **Platform collision is two-sided.** Ascending into a white platform's hitbox bonks the head and pushes Bubba below. NEVER place a full-width white (`x=0, w=400`) above the floor — it's a literal ceiling. Use a half-width walkway (`x=0, w=200`) PLUS a parallel amber-RIGHT (`x=240, w=110`) at the same y, so the climb path threads past the walkway via the right side.
- **No same-x stacks.** A blue at `x=50-160` directly under a walkway at `x=0-200` is unreachable from below — the walkway blocks ascent during the climbing arc. Stagger so the layer immediately above any walkway uses the OPPOSITE x range. Rule of thumb: never put a colored platform in the same x-column as a walkway above it.
- **Goal-bonk trap.** A face-right ascent from a centered position toward a centered goal can clip the goal's bottom edge. Two safe approaches: (1) launch from blue's far-LEFT edge (`b.x ≤ 50`) so the rising hitbox squeezes through left of the goal; (2) widen the final amber to ≥130 wide so Bubba can launch from far-RIGHT (`b.x ≥ 280`) past the goal's right edge.
- **Vertical gap ≤ 90 px.** Canonical limit (vol-01/02 use 80–90). Theoretical apex is ~140, but discrete time + tight horizontal coupling make >90 unreliable.
- **Bubba is 72 wide × 60 tall.** Platforms ≥ 80 wide to stand cleanly. Horizontal jump arc reaches ~70–110 px. "Same elevation" comparisons use feet (`b.y + 60` vs `e.y + sprite_h`), not raw y.
- **Win = all treats collected (+ golden if present).** `goalY` in JSON is documentation only — never read by the engine. Every treat must be reachable.
- **Standard placements.** Treats sit ~40 px above their platform. Squirrel (22×20): `enemy.y = platform.y - 16`. Big-dog (30×26): `enemy.y = platform.y - 26`. Patrol `x1`/`x2` must keep the full hitbox on the platform.
- **Big-dog charge** triggers when `|(b.y+60) − (e.y+26)| < 24` AND Bubba within `chargeRange` horizontally. Same-platform-only by design — to force a dodge, place a mandatory treat on the dog's platform.
- **Always include the full-width white floor at y=650.** It's the recovery zone — one mistimed flip without it soft-locks the run.
- **Hazard floor gaps ≤ 90 px horizontal** (vol-01 L4 model).
- **Sanity-check JSON before claiming done.** A node script that flags: max vertical gap > 90; full-width whites above the floor; treats not above any platform; enemy patrol bounds escaping their platform; same-x stacks (colored platform under a walkway in the same x-column); color-side convention violations.

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
