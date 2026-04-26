# ADR-001: Bubba's World Phase 2 — Episodic Weekly Drops over Backend-First Buildout

**Status:** Proposed
**Date:** 2026-04-26
**Deciders:** Lily (CTO, sole engineer, dog mom)
**Game:** https://bubbasworld.vercel.app · Insta: [@mrbubbaganoush](https://instagram.com/mrbubbaganoush)

---

## 1. Context

The Phase 1 build of Bubba's Two Worlds shipped successfully: 5 hand-designed levels, mobile-first canvas at 400x700, a clean orange/blue platform-summoning mechanic, and a narrator voice that's doing 80% of the emotional work ("MOM WHY", "THE VACUUM HAS RETURNED. MY ETERNAL NEMESIS"). It is one ~2,000-line `index.html` deployed on Vercel, no backend, no auth, no analytics. Player feedback after launch was directionally consistent: **more levels** and **Level 5 was too hard**.

### Player feedback received
- "Want more levels."
- "Level 5 is hard."
- (No reported requests for accounts, leaderboards, or social features yet.)

### Goals for Phase 2 (as stated)
- More levels (target: 10–20 across multiple weeks)
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
Lily described — but did not commit to — a content model where **5 new levels ship every week** instead of a single big content drop. The week's stated goal is to clear that week's 5. This is *episodic* content, not endless or procedural. This decision changes which features matter and which are noise. It is the linchpin of the architecture below.

---

## 2. Decision

**Phase 2 ships an "episodic weekly drops" content model with a weekend-sized engineering wedge.** Specifically:

1. **Adopt the weekly-drops content model** as the primary retention mechanic. The promise to players is: "5 new levels, every Friday." This replaces leaderboards as the reason-to-return for now.
2. **Refactor level data into an external JSON file** loaded at runtime. This makes a weekly drop a one-file edit + push to Vercel — no engine changes needed.
3. **Ship in Phase 2A (this weekend):** PWA install, speedrun timer + local best times, level select screen, Level 5 difficulty fix, "Follow Bubba" Insta CTA, share card on win, and **Levels 6–10 (the first themed weekly drop)**.
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
| Retention mechanic | Weekly content drops + local best times |

**Pros**
- Fits the weekend budget honestly
- Weekly content tightly aligns with Insta posting cadence — each drop = a Bubba post
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

Option A ships in a weekend. Option B doesn't. In a project where total time is the binding constraint and the *brand* (Bubba) is the moat, every weekend spent on auth flows is a weekend not spent on the next drop's intro copy. Recommendation: **Option C** — ship A now, revisit B once you have a couple of weekly drops behind you and can actually see whether players are coming back.

---

## 5. Consequences

### What becomes easier
- Shipping a new level pack each week is now a JSON edit + `git push`, not an engine change
- The codebase stays comprehensible to one person on a Sunday afternoon
- No user data to protect, audit, or restore from backups
- The Insta tie-in becomes structurally simple: each weekly drop ships with a matching Bubba post

### What becomes harder
- No verifiable leaderboard — "I beat it in 32 seconds" claims are honor-system
- No cross-device progress — but with weekly resets and short levels, this hurts less than it sounds
- No analytics on individual player behavior. We'll know *that* the site got hit (Vercel analytics) but not *how* people played
- If a level is broken, players can't tell us through an in-game channel — surface a "yell at mom" mailto link

### What we'll need to revisit
- After ~3 weekly drops, look at Vercel analytics. If returning-visitor rate is climbing, hold the line. If it's flat, that's the signal to invest in Option B.
- If Bubba's Insta hits some milestone follower count, the leaderboard becomes a marketing asset (not just a feature) and the cost-benefit flips.
- Reconsider procedural levels only if the team scales beyond "Lily on Sundays."

---

## 6. Phase 2A Task Graph (this weekend, ~10 hrs)

Tasks are listed with their dependencies. The **critical path** — the longest chain that determines the earliest possible ship — is marked with ★.

| ID | Task | Depends on | Est. | Critical |
|---|---|---|---|---|
| T0 | Extract `LEVELS` array from `index.html` into `/levels/week-01.json`; write tiny loader | — | 60 min | ★ |
| T1 | Create `manifest.json` + service worker + 192/512 icons → installable PWA | — | 60 min | |
| T2 | Add speedrun timer HUD; persist per-level best to `localStorage` | — | 45 min | |
| T3 | **Archive-aware level select** — list of weekly drops, expand to show 5 levels + best time + paw-print on cleared | T0 | 75 min | |
| ~~T4~~ | ~~Rebalance Level 5~~ — **dropped**: feedback re-clarified that L5 difficulty is correct (people did beat it). Climactic L5 is the design intent. | — | — | |
| T5 | Add "Follow [@mrbubbaganoush](https://instagram.com/mrbubbaganoush)" CTA to win/lose screens | — | 20 min | |
| T6 | Share card on level complete (Web Share API; canvas screenshot with time + Bubba face) | T2 | 60 min | |
| T7 | **Author Levels 6–10 (first themed weekly drop)** — longer levels, more platforms, steady ramp to climactic L5; whole pack beatable in 5–8 min for a confident player | T0 | 210 min | ★ |
| T8 | Home screen badge: "NEW LEVELS EVERY FRIDAY 🦴" (no emoji actually — Bubba CSS-shape) | — | 20 min | |
| T9 | Cross-device smoke test (iPhone Safari + Android Chrome + desktop) | T1, T3, T4, T6, T7, T8 | 30 min | ★ |
| T10 | Push to Vercel; verify install prompt fires; share to one IG story | T9 | 15 min | ★ |

**Critical path total:** T0 → T7 → T9 → T10 = 60 + 210 + 30 + 15 = **~5.25 hrs**.
**Parallel work (T1, T2, T3, T5, T6, T8):** ~4.75 hrs of work that fits alongside the critical path.

**Total weekend budget:** ~10 hrs. Fits — barely. T7 grew from 180 → 210 min because Phase 2's levels are longer/denser than Phase 1's. If you run over, the lever to pull is "ship 4 levels in week 1's drop instead of 5" — never sacrifice mobile testing or the data model refactor.

---

## 6.5 Archive data model

This is the schema that makes weekly drops + a permanent archive sustainable. Decide it once, in T0, and you'll never have to revisit it.

### File structure
```
/levels/
  manifest.json        # ordered list of weekly drops (loaded at boot)
  week-01.json         # the original 5 levels, just moved out of index.html
  week-02.json         # next Friday's pack
  week-03.json
  ...
```

### `manifest.json` — the index of all drops
```json
{
  "weeks": [
    { "id": "week-01", "title": "Origin", "released": "2026-04-26", "theme": "tutorial → vacuum", "file": "week-01.json" },
    { "id": "week-02", "title": "Beach Days", "released": "2026-05-03", "theme": "sand and seagulls", "file": "week-02.json" }
  ]
}
```

Adding a new weekly drop = create one new file, add one line to `manifest.json`, push to Vercel. That's it. No engine changes.

### `week-XX.json` — one pack of 5 levels
```json
{
  "id": "week-02",
  "title": "Beach Days",
  "intro": "WE ARE GOING TO THE BEACH WHO'S READY I'M READY",
  "levels": [ /* same level objects you already use, just lifted from the LEVELS array */ ]
}
```

### `localStorage` shape
```js
{
  "bubba.bestTimes": { "week-01/0": 12340, "week-01/4": 31220, "week-02/0": 9810 },  // ms
  "bubba.cleared":   { "week-01/0": true,  "week-01/4": true,  "week-02/0": true },
  "bubba.weeksCompleted": ["week-01"]   // all 5 levels of that week cleared
}
```

### Completion semantics
- A **level** is *cleared* when reached the end at least once. Best time is tracked separately and updated on every win.
- A **week** is *completed* when all 5 of its levels are cleared. Show a paw-print on the week's card in the archive.
- The archive screen shows every week ever released, with progress (e.g. "3 / 5 cleared"). Tapping a week opens its 5-level grid.

---

## 7. Phase 2B — Deferred Roadmap (DO NOT BUILD YET)

These are intentionally not built this weekend. They go on the shelf and only come down if Phase 2A's return-visitor data justifies them.

- **B1 — Supabase project setup, anonymous auth.** Players become identifiable across sessions without ever entering an email.
- **B2 — Magic-link account upgrade.** Optional. "Want to save your spot? Drop your email."
- **B3 — Cloud-saved progress.** `level_progress` table keyed on user id.
- **B4 — Global per-week leaderboard.** Top times for the current week's drop. Resets every Friday with the new pack.
- **B5 — Friend codes / private leaderboards.** Share a code with friends; they appear on your board.

**Trigger to start Phase 2B:** ≥3 weekly drops shipped AND visible returning-visitor uptick on Vercel analytics. Otherwise, the weekend is better spent on the next drop.

---

## 8. Brainstormed level concepts tied to Bubba's real personality

Source material: Bubba loves the beach, the dog park, running, bones, sleeping on his back, chasing squirrels. He occasionally lunges at people. He has a big personality. The game's voice should stay in his ALL-CAPS dog-thought stream of consciousness.

Use these as level seeds — pick the 5 that feel funniest for week 1, save the rest for future drops.

| # | Level | Mechanic / hazard | Bubba's intro line draft |
|---|---|---|---|
| 6 | THE BEACH | Sand slows you down; rolling waves are timed hazards; seagull enemies dive-bomb | "SAND. SO MUCH SAND. WHY IS IT IN MY MOUTH" |
| 7 | DOG PARK | Other dogs as obstacles you can chase or avoid; sticks = treats; the BIG dog is a mini-boss | "OKAY EVERYBODY LISTEN UP. I AM IN CHARGE NOW. THESE ARE MY GUYS." |
| 8 | THE SQUIRREL ENCOUNTER 2: ELECTRIC BUGALOO | Callback. ENTIRE level is squirrels. They're moving in patterns now. | "I WARNED THEM. I WARNED THEM AND THEY DID NOT LISTEN. NOW THERE ARE MORE." |
| 9 | BELLY UP | Gravity is flipped because Bubba fell asleep on his back. Platforms appear above him. | "WAIT. WAIT WHY IS THE CEILING THE FLOOR. WAIT. (snoring)" |
| 10 | BONE QUEST | Multiple golden treats (bones), some hidden behind fake walls; dad with the trash bag is the threat | "BONES. SO MANY BONES. THESE ARE ALL MINE. EVERY SINGLE ONE." |
| 11 | THE LUNGE | Timing puzzle. Pedestrians walk by. Lunge at the right moment = treat. Wrong moment = mom-leash recoil. | "HUMAN. STRANGER HUMAN. I MUST. I MUST. (LUNGES) (FAILS)" |
| 12 | MAILMAN | Auto-scrolling chase level. Mail truck moves screen-right. Bark at it = treats. | "HE'S BACK. HE BRINGS THE PAPER THINGS. WE HATE HIM. ESTABLISHED." |
| 13 | MOM'S COMING HOME | Race the door. Timer ticks down. If you don't make it to the welcome mat, sad face screen. | "KEY IN DOOR. KEY IN DOOR!! GO GO GO GO GO" |
| 14 | THE COUCH | The couch is forbidden. Climbing it = treats but also Mom's footsteps trigger a scramble. | "I AM NOT SUPPOSED TO BE HERE. THIS IS THE BEST PLACE." |
| 15 | THE ZOOMIES | High-speed auto-run level. Just hold one direction and react. | "I CANNOT EXPLAIN THIS. I JUST. I HAVE TO. I HAVE TO RUN. (RUNS)" |
| 16 | BATH TIME | Hazard floor is water; survive 30 seconds of platforming until Mom gives up | "ABSOLUTELY NOT. ABSOLUTELY NOT. I SAID GOOD DAY." |
| 17 | THE DREAM | Surreal palette swap. Squirrels are 8x bigger. Vacuum is your friend now? | "THIS IS WHERE I GO WHEN I SLEEP. IT IS A WEIRD PLACE. (PAW TWITCHES)" |

**Recommended Week 1 drop (Levels 6–10):** THE BEACH → DOG PARK → SQUIRREL 2 → BELLY UP → BONE QUEST. Mix of new mechanics (sand, gravity flip, hidden walls) so each level feels distinct.

### Difficulty curve within a single week's drop

Confirmed design intent (2026-04-26): each weekly drop ramps **steadily upward to a climactic Level 5**. Don't insert a "silly easy reward" level in the middle — that breaks the arc. The week's narrative is *can you make it to the end this week?*, and that question only lands if the end is genuinely the hardest. Level 5 of Phase 1 (the vacuum boss) is the model — challenging but beatable.

| Position | Role | Platform count guideline |
|---|---|---|
| L1 of pack | Onramp — introduce the week's new mechanic in a forgiving setting | 4–6 |
| L2 | Build on L1 — combine the new mechanic with the orange/blue color flipping | 6–8 |
| L3 | Add a hazard or enemy that uses the mechanic against you | 8–10 |
| L4 | Multi-stage puzzle — harder traversal, more required decisions | 10–14 |
| L5 | **Climax.** A boss, a chase, or a multi-phase final puzzle. People should remember beating it. | 12–16 + special element |

### Level length and pacing

Levels can be physically longer in Phase 2 than in Phase 1 — more platforms, deeper puzzles, more strategic decisions per level — but **a confident player should be able to clear all 5 levels of a week in 5–8 minutes total**. That keeps weekly drops snackable and replayable: easy to pick up and beat in one sitting, easy to come back to a few weeks later. The orange/blue platform-summoning mechanic stays untouched — that's the soul of the game. We're adding *content depth*, not changing the rules.

---

## 9. Action Items

Phase 2A — this weekend:

1. [ ] T0 — Extract level data to `/levels/manifest.json` + `/levels/week-01.json` + write loader (60 min)
2. [ ] T1 — PWA: `manifest.json`, service worker, app icons (60 min)
3. [ ] T2 — Speedrun timer HUD + per-level best in `localStorage` (45 min)
4. [ ] T3 — Archive-aware level select (week list → 5-level grid, paw-prints on cleared) (75 min)
5. [ ] T5 — Insta CTA on win/lose screens (20 min)
6. [ ] T6 — Web Share API + share card image (60 min)
7. [ ] T7 — Author Levels 6–10 themed pack — steady ramp to climactic L5, longer levels (210 min)
8. [ ] T8 — "New levels every Friday" home badge (20 min)
9. [ ] T9 — Mobile smoke test (30 min)
10. [ ] T10 — Deploy + post first IG announcement (15 min)

Post-launch:

12. [ ] Add a `/feedback` mailto link or Tally form so future feedback has somewhere to land
13. [ ] After drop 3, review Vercel analytics. Decide: stay static, or start Phase 2B?
14. [ ] Document the weekly drop SOP — "how Lily ships a Friday drop in 60 minutes"

---

## 10. Resolved design decisions (2026-04-26)

- **Previous-weeks archive: YES, first-class.** All weekly drops stay playable forever. Archive UI is part of T3, not a Phase 2B feature. Each week is its own pack with its own progress tracking.
- **Difficulty curve within a week: steady ramp to climactic L5.** No "silly reward" levels mid-pack. L1 is an onramp, L5 is the boss. The week's narrative depends on the climax actually being a climax.
- **L5 of Phase 1 (vacuum boss) is NOT being rebalanced.** Players beat it. The challenge is intentional and the model for future climactic levels.
- **Levels can be physically longer/denser in Phase 2.** More platforms, deeper puzzles. But a full week's pack stays beatable in 5–8 min for a confident player — snackable replayability is the goal.
- **Core orange/blue platform-summoning mechanic is untouched.** That's the game's soul. Phase 2 adds depth, not new rules.

## 11. Still open

- **Weekly Insta post template visual** — keep cream/amber/blue, but design once and reuse. Worth one hour to nail.
- **Week-completion celebration** — when a player clears all 5 of a week's levels, what does the screen show? Recommendation: a unique Bubba "victory pose" per week (different art for each pack), so completing a week feels like collecting a trading card. Cheap content win, big delight payoff.
- **What happens to the current "all 5 from initial build" framing?** Recommendation: rename in-game to "Week 1 — Origin" to fit the archive model retroactively.
