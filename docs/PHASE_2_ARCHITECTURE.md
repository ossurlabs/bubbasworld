# ADR-001: Bubba's World Phase 2 — Episodic Weekly Drops over Backend-First Buildout

**Status:** Accepted (Phase 2A in progress)
**Date:** 2026-04-26 (revised 2026-04-26: rename Week → Volume)
**Deciders:** Lily (CTO, sole engineer, dog mom)
**Game:** https://bubbasworld.vercel.app · Insta: [@mrbubbaganoush](https://instagram.com/mrbubbaganoush)

> **Naming convention:** the *cadence* is weekly (a new drop every Monday), but each individual drop is a **Volume** with its own title, themes, and L1–L5 levels. UI displays "VOL N." Data IDs are `vol-NN`. Reference shorthand for a specific level is `V{n}-L{1-5}` (e.g. V2-L3).

---

## 1. Context

The Phase 1 build of Bubba's Two Worlds shipped successfully: 5 hand-designed levels, mobile-first canvas at 400x700, a clean orange/blue platform-summoning mechanic, and a narrator voice that's doing 80% of the emotional work ("MOM WHY", "THE VACUUM HAS RETURNED. MY ETERNAL NEMESIS"). It is one ~2,000-line `index.html` deployed on Vercel, no backend, no auth, no analytics. Player feedback after launch was directionally consistent: **more levels** and **Level 5 was too hard**.

### Player feedback received
- "Want more levels."
- "Level 5 is hard."
- (No reported requests for accounts, leaderboards, or social features yet.)

### Goals for Phase 2 (as stated)
- More levels (target: 10–20 across multiple volumes)
- Speedrun timer
- Optionally: leaderboard, accounts, PWA install
- Drive Instagram follows for [@mrbubbaganoush](https://instagram.com/mrbubbaganoush) — long-term goal is for Bubba to become a dog influencer
- Maximize laughter / surprise / "fall in love with Bubba" moments

### Constraints
- **Time budget:** one weekend (~10 hours)
- **Backend appetite:** willing to add a Backend-as-a-Service (Supabase/Firebase) if it earns its keep
- **Team:** solo
- **Cost ceiling:** $0/mo preferred (assume free tier)
- **Distribution:** Vercel static, mobile Safari + Chrome are the primary targets

### Strategic insight surfaced during scoping
Lily described — but did not commit to — a content model where **5 new levels ship every Monday** as a self-contained Volume, instead of a single big content drop. The Volume's stated goal is to clear all 5 of its levels (L1–L5). This is *episodic* content, not endless or procedural. This decision changes which features matter and which are noise. It is the linchpin of the architecture below.

---

## 2. Decision

**Phase 2 ships an "episodic weekly drops" content model with a weekend-sized engineering wedge.** Specifically:

1. **Adopt the weekly-drops content model** as the primary retention mechanic. The promise to players is: "5 new levels, every Monday — a fresh Volume." This replaces leaderboards as the reason-to-return for now.
2. **Refactor level data into external JSON files** loaded at runtime. This makes a new Volume a one-file edit + push to Vercel — no engine changes needed.
3. **Ship in Phase 2A (this weekend):** PWA install, speedrun timer + local best times, archive-aware level select screen, "Follow Bubba" Insta CTA, share card on win, and **Volume 2 (L1–L5, the first new themed Volume)**.
4. **Defer to Phase 2B** (a future weekend, only if retention demands it): Supabase auth, cloud-saved progress, global leaderboard.

The bet: episodic content + speedrun timer + a beautiful share moment will drive return visits and Insta follows *without* requiring a backend. If retention plateaus, **then** we add Supabase. Building the backend before knowing whether the loop works would be premature optimization.

---

## 3. Options Considered

### Option A — Episodic weekly drops, static-first (RECOMMENDED)

| Dimension | Assessment |
|---|---|
| Complexity | Low — no new infra, just refactor + content |
| Cost | $0/mo (Vercel free tier) |
| Scalability | Sufficient for tens of thousands of players |
| Team familiarity | High — same stack you already know |
| Time to first ship | 1 weekend |
| Retention mechanic | Weekly Volume drops + local best times |

**Pros**
- Fits the weekend budget honestly
- Weekly content tightly aligns with Insta posting cadence — each Volume = a Bubba post
- No auth = no friction, no GDPR/COPPA surface area
- Reversible — if the loop works, Supabase can be layered on later without breaking anything

**Cons**
- No global leaderboard (yet). Local best times only.
- No cross-device save. If a player switches phones they lose progress (mitigated: short games + weekly resets soften this)
- "Best time" claims aren't verifiable — could be edited in DevTools (in practice, nobody cares for a dog game)

### Option B — Backend-first with Supabase

| Dimension | Assessment |
|---|---|
| Complexity | Medium — auth flows, schema design, RLS policies |
| Cost | $0/mo at small scale, $25/mo if it grows |
| Scalability | Excellent |
| Team familiarity | New territory — would need to learn Supabase RLS |
| Time to first ship | 2–3 weekends minimum |
| Retention mechanic | Accounts + leaderboard + cloud save |

**Pros**
- Real social loop — verifiable leaderboard, friend invites, persistent identity
- Cloud-saved progress
- Foundation for future features (achievements, daily challenges)

**Cons**
- Doesn't fit the weekend budget
- Adds auth UX friction *before* you've proven players want to come back at all
- Schema/RLS bugs at this stage can leak data — real risk for a project where you don't have time to do incident response
- Builds infrastructure for problems you don't have yet

### Option C — Hybrid: ship Option A this weekend, plan Option B for weekend 3

| Dimension | Assessment |
|---|---|
| Complexity | Low now, medium later |
| Cost | $0/mo |
| Time to first ship | 1 weekend, then iterate |
| Retention mechanic | Starts simple, escalates if data justifies |

**Pros**
- Best of both — fast launch, optionality preserved
- Forces a check-in: only invest in Option B if Phase 2A retention numbers earn it

**Cons**
- Requires discipline not to build Option B prematurely
- Need basic analytics (even just `localStorage` event counts) to decide

---

## 4. Trade-off Analysis

The real question isn't "static vs. backend." It's **"what do we believe about retention, and what evidence would change that belief?"**

The case for backend-first (Option B) assumes leaderboards drive return visits. For a niche personal-brand game with no marketing budget except Bubba's Insta, that's unproven. The far more defensible bet is that **fresh content + character + a tiny speedrun loop** drives return visits — that's what TV shows, comic strips, and webcomics have run on for a century.

Option A ships in a weekend. Option B doesn't. In a project where total time is the binding constraint and the *brand* (Bubba) is the moat, every weekend spent on auth flows is a weekend not spent on the next Volume's intro copy. Recommendation: **Option C** — ship A now, revisit B once you have a couple of Volumes behind you and can actually see whether players are coming back.

---

## 5. Consequences

### What becomes easier
- Shipping a new Volume each Monday is now a JSON edit + `git push`, not an engine change
- The codebase stays comprehensible to one person on a Sunday afternoon
- No user data to protect, audit, or restore from backups
- The Insta tie-in becomes structurally simple: each Volume ships with a matching Bubba post

### What becomes harder
- No verifiable leaderboard — "I beat it in 32 seconds" claims are honor-system
- No cross-device progress — but with weekly resets and short levels, this hurts less than it sounds
- No analytics on individual player behavior. We'll know *that* the site got hit (Vercel analytics) but not *how* people played
- If a level is broken, players can't tell us through an in-game channel — surface a "yell at mom" mailto link

### What we'll need to revisit
- After ~3 Volumes shipped, look at Vercel analytics. If returning-visitor rate is climbing, hold the line. If it's flat, that's the signal to invest in Option B.
- If Bubba's Insta hits some milestone follower count, the leaderboard becomes a marketing asset (not just a feature) and the cost-benefit flips.
- Reconsider procedural levels only if the team scales beyond "Lily on Sundays."

---

## 6. Phase 2A Task Graph (this weekend, ~10 hrs)

Tasks are listed with their dependencies. The **critical path** — the longest chain that determines the earliest possible ship — is marked with ★.

| ID | Task | Depends on | Est. | Critical |
|---|---|---|---|---|
| T0 | Extract `LEVELS` array from `index.html` into `/levels/vol-01.json`; write tiny loader | — | 60 min | ★ |
| T1 | Create `manifest.json` + service worker + 192/512 icons → installable PWA | — | 60 min | |
| T2 | Add speedrun timer HUD; persist per-level best to `localStorage` | — | 45 min | |
| T3 | **Archive-aware level select** — list of Volumes, expand to show 5 levels + best time + paw-print on cleared | T0 | 75 min | |
| ~~T4~~ | ~~Rebalance Level 5~~ — **dropped**: feedback re-clarified that L5 difficulty is correct (people did beat it). Climactic L5 is the design intent. | — | — | |
| T5 | Add "Follow [@mrbubbaganoush](https://instagram.com/mrbubbaganoush)" CTA to win/lose screens | — | 20 min | |
| T6 | Share card on level complete (Web Share API; canvas screenshot with time + Bubba face) | T2 | 60 min | |
| T7 | **Author Volume 2 — L1–L5 (first new themed Volume)** — longer levels, more platforms, steady ramp to climactic L5; whole Volume beatable in 5–8 min for a confident player | T0 | 210 min | ★ |
| T8 | Home screen badge: "NEW LEVELS EVERY MONDAY 🦴" (no emoji actually — Bubba CSS-shape) | — | 20 min | |
| T9 | Cross-device smoke test (iPhone Safari + Android Chrome + desktop) | T1, T3, T6, T7, T8 | 30 min | ★ |
| T10 | Push to Vercel; verify install prompt fires; share to one IG story | T9 | 15 min | ★ |

**Critical path total:** T0 → T7 → T9 → T10 = 60 + 210 + 30 + 15 = **~5.25 hrs**.
**Parallel work (T1, T2, T3, T5, T6, T8):** ~4.75 hrs of work that fits alongside the critical path.

**Total weekend budget:** ~10 hrs. Fits — barely. T7 grew from 180 → 210 min because Phase 2's levels are longer/denser than Phase 1's. If you run over, the lever to pull is "ship 4 levels in Volume 2 instead of 5" — never sacrifice mobile testing or the data model refactor.

---

## 6.5 Archive data model

This is the schema that makes weekly Volumes + a permanent archive sustainable. Decide it once, in T0, and you'll never have to revisit it.

### File structure
```
/levels/
  manifest.json        # ordered list of Volumes (loaded at boot)
  vol-01.json          # the original 5 levels, just moved out of index.html
  vol-02.json          # next Monday's Volume
  vol-03.json
  ...
```

### `manifest.json` — the index of all Volumes
```json
{
  "volumes": [
    { "id": "vol-01", "title": "Origin",     "released": "2026-04-20", "theme": "tutorial → vacuum",        "file": "vol-01.json" },
    { "id": "vol-02", "title": "Adventures", "released": "2026-04-27", "theme": "beach → squirrels → home", "file": "vol-02.json" }
  ]
}
```

`released` is a date-only string for now. The current Volume is the most recent past `released` date. UI labels it as "VOL N" + the title (e.g. "VOL 2 · ADVENTURES"). If `released` equals today, show a "DROPPED TODAY" badge for 24 hours. Upgrade to ISO timestamps with offset (`"2026-04-27T09:00:00-07:00"`) only if you want to ship Volumes ahead of schedule and have them auto-go-live at a precise time.

Adding a new Volume = create one new file, add one line to `manifest.json`, push to Vercel. That's it. No engine changes.

### `vol-XX.json` — one Volume of 5 levels
```json
{
  "id": "vol-02",
  "title": "Adventures",
  "intro": "WE ARE GOING ON ADVENTURES TODAY. I AM READY. SO READY.",
  "levels": [ /* same level objects you already use, just lifted from the LEVELS array */ ]
}
```

### `localStorage` shape
```js
{
  "bubba.bestTimes":        { "vol-01/0": 12340, "vol-01/4": 31220, "vol-02/0": 9810 },  // ms
  "bubba.cleared":          { "vol-01/0": true,  "vol-01/4": true,  "vol-02/0": true },
  "bubba.volumesCompleted": ["vol-01"]   // all 5 levels of that Volume cleared
}
```

### Completion semantics
- A **level** is *cleared* when reached the end at least once. Best time is tracked separately and updated on every win.
- A **Volume** is *completed* when all 5 of its levels are cleared. Show a paw-print on the Volume's card in the archive.
- The archive screen shows every Volume ever released, with progress (e.g. "3 / 5 cleared"). Tapping a Volume opens its 5-level grid.

---

## 7. Phase 2B — Deferred Roadmap (DO NOT BUILD YET)

These are intentionally not built this weekend. They go on the shelf and only come down if Phase 2A's return-visitor data justifies them.

- **B1 — Supabase project setup, anonymous auth.** Players become identifiable across sessions without ever entering an email.
- **B2 — Magic-link account upgrade.** Optional. "Want to save your spot? Drop your email."
- **B3 — Cloud-saved progress.** `level_progress` table keyed on user id.
- **B4 — Global per-Volume leaderboard.** Top times for the current Volume. Resets every Monday with the new pack.
- **B5 — Friend codes / private leaderboards.** Share a code with friends; they appear on your board.

**Trigger to start Phase 2B:** ≥3 Volumes shipped AND visible returning-visitor uptick on Vercel analytics. Otherwise, the weekend is better spent on the next Volume.

---

## 8. Brainstormed level concepts tied to Bubba's real personality

Source material: Bubba loves the beach, the dog park, running, bones, sleeping on his back, chasing squirrels. He occasionally lunges at people. He has a big personality. The game's voice should stay in his ALL-CAPS dog-thought stream of consciousness.

Use these as level seeds — pick the 5 that feel funniest for Volume 2, save the rest for future Volumes.

| Theme | Mechanic / hazard | Bubba's intro line draft |
|---|---|---|
| THE BEACH | Sand slows you down; rolling waves are timed hazards; seagull enemies dive-bomb | "SAND. SO MUCH SAND. WHY IS IT IN MY MOUTH" |
| DOG PARK | Other dogs as obstacles you can chase or avoid; sticks = treats; the BIG dog is a mini-boss | "OKAY EVERYBODY LISTEN UP. I AM IN CHARGE NOW. THESE ARE MY GUYS." |
| THE SQUIRREL ENCOUNTER 2: ELECTRIC BUGALOO | Callback. ENTIRE level is squirrels. They're moving in patterns now. | "I WARNED THEM. I WARNED THEM AND THEY DID NOT LISTEN. NOW THERE ARE MORE." |
| BELLY UP | Gravity is flipped because Bubba fell asleep on his back. Platforms appear above him. | "WAIT. WAIT WHY IS THE CEILING THE FLOOR. WAIT. (snoring)" |
| BONE QUEST | Multiple golden treats (bones), some hidden behind fake walls; dad with the trash bag is the threat | "BONES. SO MANY BONES. THESE ARE ALL MINE. EVERY SINGLE ONE." |
| THE LUNGE | Timing puzzle. Pedestrians walk by. Lunge at the right moment = treat. Wrong moment = mom-leash recoil. | "HUMAN. STRANGER HUMAN. I MUST. I MUST. (LUNGES) (FAILS)" |
| MAILMAN | Auto-scrolling chase level. Mail truck moves screen-right. Bark at it = treats. | "HE'S BACK. HE BRINGS THE PAPER THINGS. WE HATE HIM. ESTABLISHED." |
| MOM'S COMING HOME | Race the door. Timer ticks down. If you don't make it to the welcome mat, sad face screen. | "KEY IN DOOR. KEY IN DOOR!! GO GO GO GO GO" |
| THE COUCH | The couch is forbidden. Climbing it = treats but also Mom's footsteps trigger a scramble. | "I AM NOT SUPPOSED TO BE HERE. THIS IS THE BEST PLACE." |
| THE ZOOMIES | High-speed auto-run level. Just hold one direction and react. | "I CANNOT EXPLAIN THIS. I JUST. I HAVE TO. I HAVE TO RUN. (RUNS)" |
| BATH TIME | Hazard floor is water; survive 30 seconds of platforming until Mom gives up | "ABSOLUTELY NOT. ABSOLUTELY NOT. I SAID GOOD DAY." |
| THE DREAM | Surreal palette swap. Squirrels are 8x bigger. Vacuum is your friend now? | "THIS IS WHERE I GO WHEN I SLEEP. IT IS A WEIRD PLACE. (PAW TWITCHES)" |

**Recommended Volume 2 (L1 → L5):** THE BEACH → DOG PARK → SQUIRREL 2 → MOM'S COMING HOME → BONE QUEST. Mix of new mechanics (sand, timer pressure, hidden walls) so each level feels distinct. Existing Phase 1 levels become Volume 1 ("Origin") in the archive — same 5 puzzles, just renamed under the new model. *Note:* the level concept catalog above (THE BEACH, DOG PARK, etc.) is themes, not numbers — within each Volume the levels are always numbered L1–L5. The same theme could appear as V2-L1 or V5-L3 depending on where it slots in the difficulty ramp.

### Difficulty curve within a single Volume

Confirmed design intent (2026-04-26): each Volume ramps **steadily upward to a climactic Level 5**. Don't insert a "silly easy reward" level in the middle — that breaks the arc. The Volume's narrative is *can you make it to the end of this Volume?*, and that question only lands if the end is genuinely the hardest. Level 5 of Volume 1 (the vacuum boss) is the model — challenging but beatable.

| Position | Role | Platform count guideline |
|---|---|---|
| L1 of Volume | Onramp — introduce the Volume's new mechanic in a forgiving setting | 4–6 |
| L2 | Build on L1 — combine the new mechanic with the orange/blue color flipping | 6–8 |
| L3 | Add a hazard or enemy that uses the mechanic against you | 8–10 |
| L4 | Multi-stage puzzle — harder traversal, more required decisions | 10–14 |
| L5 | **Climax.** A boss, a chase, or a multi-phase final puzzle. People should remember beating it. | 12–16 + special element |

### Level length and pacing

Levels can be physically longer in Phase 2 than in Phase 1 — more platforms, deeper puzzles, more strategic decisions per level — but **a confident player should be able to clear all 5 levels of a Volume in 5–8 minutes total**. That keeps Volumes snackable and replayable: easy to pick up and beat in one sitting, easy to come back to a few weeks later. The orange/blue platform-summoning mechanic stays untouched — that's the soul of the game. We're adding *content depth*, not changing the rules.

---

## 9. Action Items

Phase 2A — this weekend:

1. [x] T0 — Extract level data to `/levels/manifest.json` + `/levels/vol-01.json` + write loader (60 min) — committed `51995e7`
2. [ ] T1 — PWA: `manifest.json`, service worker, app icons (60 min)
3. [ ] T2 — Speedrun timer HUD + per-level best in `localStorage` (45 min)
4. [ ] T3 — Archive-aware level select (Volume list → 5-level grid, paw-prints on cleared) (75 min) — see T3a/T3b split below
5. [ ] T5 — Insta CTA on win/lose screens (20 min)
6. [ ] T6 — Web Share API + share card image (60 min)
7. [x] T7 — Author Volume 2 (L1–L5) themed pack — steady ramp to climactic L5, longer levels (210 min) — playable
8. [ ] T8 — "New levels every Monday" home badge (20 min)
9. [ ] T9 — Mobile smoke test (30 min)
10. [ ] T10 — Deploy + post first IG announcement (15 min)

T3 split (added 2026-04-26):

- [ ] **T3a — Home screen Volume indicator (~25 min).** Repurpose the top-corner pills on the home screen specifically to show "VOL 2" + "NEW · 04.27"; add a "▸ ADVENTURES · 5 NEW LEVELS" subtitle under LET ME IN; read current Volume from the manifest. Tomorrow's launch *needs* this.
- [ ] **T3b — Archive screen (~50 min).** PREVIOUS WEEKS button → Volume list → per-Volume 5-level grid. Real structural work. Can ship a day or two later.

Post-launch:

11. [ ] Add a `/feedback` mailto link or Tally form so future feedback has somewhere to land
12. [ ] After Volume 3, review Vercel analytics. Decide: stay static, or start Phase 2B?
13. [ ] Document the weekly Volume SOP — "how Lily ships a Monday Volume in 60 minutes"

---

## 10. Resolved design decisions (2026-04-26)

- **Drop cadence: Monday mornings.** New 5-level Volume ships every Monday. The "MONDAY MONDAY MONDAY" hook is part of the brand — small joy on the worst day of the week, full week to clear it. Insta posts go up Monday morning to catch the workday scroll.
- **Naming: Volume.** Each weekly drop is a Volume (e.g. "Vol 2 · Adventures"), not a "Week 2 pack." UI displays "VOL N." Data IDs are `vol-NN`. Reference shorthand for a specific level is `V{n}-L{1-5}` (e.g. V2-L3). The cadence is still "weekly" (we drop weekly), but the *thing* dropped is a Volume.
- **Level numbering: per-Volume local (L1–L5), forever.** Each Volume always has L1, L2, L3, L4, L5. Levels are never globally numbered ("Level 47") — that breaks the episodic season framing and the "make it to L5" brand promise. A separate "lifetime cleared" stat can capture cumulative progress without polluting the numbering.
- **Volume archive: YES, first-class.** All Volumes stay playable forever. Archive UI is part of T3, not a Phase 2B feature. Each Volume is its own pack with its own progress tracking.
- **Difficulty curve within a Volume: steady ramp to climactic L5.** No "silly reward" levels mid-pack. L1 is an onramp, L5 is the boss. The Volume's narrative depends on the climax actually being a climax.
- **L5 of Volume 1 (vacuum boss) is NOT being rebalanced.** Players beat it. The challenge is intentional and the model for future climactic levels.
- **Levels can be physically longer/denser in Phase 2.** More platforms, deeper puzzles. But a full Volume stays beatable in 5–8 min for a confident player — snackable replayability is the goal.
- **Core orange/blue platform-summoning mechanic is untouched.** That's the game's soul. Phase 2 adds depth, not new rules.

## 11. Still open

- **Weekly Insta post template visual** — keep cream/amber/blue, but design once and reuse. Worth one hour to nail.
- **Volume-completion celebration** — when a player clears all 5 of a Volume's levels, what does the screen show? Recommendation: a unique Bubba "victory pose" per Volume (different art for each pack), so completing a Volume feels like collecting a trading card. Cheap content win, big delight payoff.
- **Retroactive renaming of the original 5 levels.** Recommendation: rename in-game to "Volume 1 — Origin" to fit the archive model retroactively. (Manifest already reflects this.)
