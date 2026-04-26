# ADR-002: Bubba's World Analytics — Vercel Analytics Now, Custom Events Later

**Status:** Proposed (Phase 2A)
**Date:** 2026-04-26
**Deciders:** Lily (CTO, sole engineer, dog mom)
**Related:** ADR-001 (Phase 2 episodic weekly drops)

> **TL;DR.** Turn on Vercel Web Analytics today — one toggle in the dashboard, optionally one `<script>` tag, ~1 KB on the wire, no cookies, no consent banner needed, free. That answers the only question you currently have: *how many people are playing and are they coming back?* When Phase 2B lands and Supabase comes in, layer custom level events on top for difficulty data and (eventually) credible numbers for advertisers.

---

## 1. Context

Phase 2A is shipping with no analytics. Lily's stated need is narrow: she wants to know *how many people play and whether they come back*. No PII required. Long-term curiosity: would the audience be big enough to support ads as a revenue stream.

ADR-001 already mentions "Vercel analytics" three times as the assumed measurement layer for the Phase 2A → Phase 2B decision (when to invest in Supabase). This ADR formalizes that choice and extends it.

### Goals
- **G1.** Daily/weekly visitor count for `bubbasworld.vercel.app`.
- **G2.** New vs. returning visitor split, to test the core Phase 2A bet (weekly Volume drops drive return visits).
- **G3.** Traffic source breakdown — separate Insta-driven traffic from organic/direct, so you can tell whether a Bubba post moves the needle.
- **G4.** A foundation that can grow into per-Volume engagement data and credible numbers for advertiser conversations — without rebuilding it.

### Non-goals (explicit)
- Per-player behavioral funnels right now (drop-off points, retry counts). Will revisit in Phase 2B.
- Personalized identifiers, accounts, emails. Phase 2B at earliest.
- Heatmaps, session replay. Overkill for a single-screen canvas game.
- A/B testing infrastructure. Premature.

### Constraints
- **No-deps culture.** ADR-001 and `CLAUDE.md` lock in "no external JS dependencies" as part of the project's character. Any analytics decision needs to defend itself against that rule.
- **Mobile performance.** iOS Safari and Android Chrome are the targets. Every KB and every blocking script costs frame budget on a canvas game.
- **Privacy posture.** Lily explicitly said "no personal information at this phase." That rules out cookie-based GA-style tracking and any tool that needs a consent banner.
- **Cost.** Free tier preferred ($0/mo).
- **Solo dev / weekend cadence.** Whatever we pick has to be installable in <15 minutes and require zero ongoing maintenance.

---

## 2. Decision

**Phase 2A (now): turn on Vercel Web Analytics.** It is the only option that satisfies all four constraints simultaneously — no cookies, ~1 KB script, free at this scale, and zero new infrastructure since we're already on Vercel.

**Phase 2B (when Supabase lands): add custom level events** as a thin layer on top, written through Supabase. This unlocks per-Volume engagement metrics, which is what advertisers actually buy against — not raw visitor counts.

**Do not add Google Analytics.** Even though it would technically support an AdSense path later, GA introduces cookies, requires a consent banner in the EU, and pulls ~50 KB of JS — none of which fits the project's character or your stated privacy posture. There is a cleaner ad path (see §7) that doesn't require GA.

---

## 3. Options Considered

### Option A — Vercel Web Analytics (RECOMMENDED for Phase 2A)

| Dimension | Assessment |
|---|---|
| Setup time | ~5 min (toggle in Vercel dashboard) |
| Bundle cost | ~1 KB async script |
| Cookies | None |
| Consent banner needed | No |
| Cost | Free tier: 2,500 events/mo. Pro: $10/mo for 100k. |
| Data ownership | Vercel-hosted, exportable |
| Trade-off | Aggregate-only — can't drill into individual sessions |

**What you get out of the box:** unique visitor count, page views, top referrers (so you'll see `instagram.com` as a source), top pages, country breakdown, device type breakdown, returning vs. new visitor split.

**Why this fits:** Vercel Analytics uses a cookieless, fingerprint-free hashing approach (a daily-rotating salt + IP + UA) to count uniques without ever storing PII. That keeps you outside GDPR/CCPA's scope of "personal data" — no consent banner needed, no privacy policy update needed.

### Option B — Plausible Analytics (or Simple Analytics, Fathom)

Privacy-first paid alternatives (~$9/mo). Cleaner dashboard than Vercel's, supports custom events. **Why not pick this?** You're already paying for Vercel hosting. Adding a second SaaS for marginal dashboard polish is bad cost discipline at this stage. If Vercel's UI ever feels limiting, this is the easy upgrade path.

### Option C — Self-hosted (Umami, Plausible CE)

A Postgres + container deploy. **Why not pick this?** Solo dev, weekend budget. Self-hosting analytics is a project, not a feature. Reconsider only if you have a privacy-policy reason to keep data inside infra you control.

### Option D — Roll your own with `fetch()` + a Vercel serverless function

Send a `POST /api/track` from the page on load, write to a JSON file or KV store. **Why not pick this?** You'd reinvent uniqueness counting, geo lookups, bot filtering, and a dashboard. Free tier limits on Vercel Functions also make this risky if traffic actually picks up.

### Option E — Google Analytics 4

The default for "I want to monetize with ads later." **Why not pick this?** Cookies, consent banner, ~50 KB of JS, and a privacy posture that contradicts what you said you wanted. There's a cleaner ad path (§7) that doesn't require GA.

### Option F — Strict zero-dep (no analytics at all)

Honor the "no JS deps" rule absolutely. Look at Vercel's built-in request logs only. **Why not pick this?** Request logs don't dedupe visitors, don't separate bots, and don't show return-rate. You'd be "shipping blind" through the exact decision window (Phase 2A → 2B) where data is most valuable. The 1 KB cost of Option A is a fair tax for that visibility.

---

## 4. Trade-off Analysis

The tension here is between two of your operating principles:

1. *"Single-file static deploy is part of the project's character."* (CLAUDE.md)
2. *"After Volume 3, review Vercel analytics. Decide: stay static, or start Phase 2B."* (ADR-001 §9)

You can't fully honor both — the second one assumes the first is bent slightly. The right call is to bend the rule the smallest possible amount: **one async script tag, no cookies, no behavior change for the player**. The game still works with JS disabled (it doesn't, but for a different reason), the source still reads as a single-file project, and the deploy still has zero npm dependencies.

If you ever want to be even more strict, Vercel Analytics has a server-side mode that tracks via a middleware function — no client JS at all. That's an upgrade path, not a Phase 2A requirement.

---

## 5. High-level design

```
┌─────────────────────────┐
│  bubbasworld.vercel.app │
│  (index.html, canvas)   │
│                         │       ┌───────────────────────┐
│  + 1 line:              │  ───► │  Vercel Edge Network  │
│  <script defer src=     │       │  (event ingestion)    │
│    "/_vercel/insights/  │       └─────────┬─────────────┘
│    script.js"></script> │                 │
└─────────────────────────┘                 ▼
                                  ┌───────────────────────┐
                                  │  Vercel Analytics     │
                                  │  Dashboard            │
                                  │  (visitors, sources,  │
                                  │   pages, devices)     │
                                  └───────────────────────┘
```

Phase 2B (later, additive — does not replace the above):

```
┌─────────────────────────┐                 ┌───────────────────────┐
│  Game logic in          │                 │  Supabase project     │
│  index.html             │   ───POST───►   │                       │
│                         │   level_event   │  events table:        │
│  on level_start,        │                 │   - user_id (anon)    │
│  level_complete,        │                 │   - vol_id, level_idx │
│  level_quit:            │                 │   - kind (start/      │
│    track('level_event') │                 │      complete/quit)   │
└─────────────────────────┘                 │   - duration_ms       │
                                            │   - timestamp         │
                                            └───────────────────────┘
```

---

## 6. Phase 2A implementation — concrete steps

This is a separate task. Suggested ID: **T11**, ~10 minutes, no dependencies.

### Step 1 — Enable in Vercel dashboard
1. Open the Bubba's World project in Vercel
2. Analytics tab → "Enable Web Analytics"
3. Confirm the free tier (2,500 events/mo is plenty for current traffic)

### Step 2 — Add the script to `index.html`

One line, just before `</body>`:

```html
<script defer src="/_vercel/insights/script.js"></script>
```

That's it. `defer` means the script doesn't block first paint. The path is served by Vercel's edge — no DNS lookup, no third-party domain, no CORS headache.

### Step 3 — Verify
1. `git push` to deploy
2. Open the live site on phone + desktop
3. Wait ~30 seconds
4. Check the Vercel dashboard — should see visitors counted

### Step 4 — Add a private bookmarklet to the architecture doc
So future-you remembers where the dashboard lives. (Already covered by adding this ADR — done.)

### What this does NOT do
- Doesn't track which level you played.
- Doesn't track speedrun times.
- Doesn't tell you whether someone gave up at V1-L5.

That's all Phase 2B work, wired through Supabase. Don't try to bolt it onto Vercel Analytics — Vercel's custom events tier costs more and the data shape is wrong for game analytics.

---

## 7. The ad question (you asked)

Short version: **don't optimize for ads yet, but the path exists, and Vercel Analytics doesn't close any doors.**

Three realistic monetization paths, ordered by fit:

### Path 1 — Direct Insta-aligned sponsorships (RECOMMENDED, eventually)
A dog treat brand, a pet camera company, a local dog walker. They pay you a flat fee to put their logo on a "this Volume sponsored by ___" splash, or a "Bubba's official treat partner" home-screen badge. This is what dog influencers actually do. To pitch it, you need:
- Credible monthly visitor numbers (Vercel Analytics gives you this)
- Insta engagement numbers (Insta gives you this)
- A pitch deck (we can build that when the time comes)

This path wants brand fit, not raw scale. 2,000 engaged dog people who play a dog game is more valuable to a dog brand than 200,000 random impressions.

### Path 2 — Programmatic display ads (Google AdSense, Ezoic, etc.)
Drop in their script, they auto-place banner ads, you get a small revenue share per impression. The math: most casual web games make ~$1–3 per 1,000 page views. You'd need *significant* scale before this earns more than a dollar a day — and the trade is intrusive ads, mandatory consent banners, GA-style tracking, and visual clutter that fights the pixel-art aesthetic. **Not recommended** unless traffic gets serious.

### Path 3 — Premium features / cosmetics
Phase 2C+ idea: optional paid Volumes, a "tip jar" for Bubba, cosmetic skins. Nothing here requires analytics beyond what we already have. Worth a separate ADR if/when you want to explore.

### COPPA flag
A "play as a dog" game is plausibly child-directed under FTC guidelines. If you ever pursue Path 2 (programmatic ads), you'll need to declare the site as child-directed in the ad network's settings, which restricts targeting and lowers CPM dramatically. This further pushes you toward Path 1 (direct sponsorships) where you control the creative.

---

## 8. Phase 2B — extending analytics with Supabase

This is **deferred** until Supabase is in (per ADR-001 §7). Sketching it here so future-you knows the shape.

### Schema (proposed)

```sql
create table events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,           -- anon Supabase user id
  vol_id      text not null,           -- 'vol-02'
  level_idx   smallint not null,       -- 0..4
  kind        text not null,           -- 'start' | 'complete' | 'quit'
  duration_ms integer,                 -- null on 'start'
  ts          timestamptz default now()
);

create index on events (vol_id, level_idx, kind);
create index on events (user_id, ts desc);
```

### Client integration

A single `track(kind, vol, level, durMs)` helper that POSTs through Supabase's REST API. Fires from three places in the game loop: `onLevelStart`, `onLevelComplete`, `onLevelQuit`. Gracefully no-ops if Supabase isn't configured (so the game still ships static if Phase 2B stalls).

### Questions this unlocks
- **Difficulty curve check:** completion rate per level per Volume. If V2-L3 has a 12% completion rate vs L2 at 80%, the ramp is broken.
- **Climax test:** is L5 actually the moment people remember? (Compare share-card share rate by level.)
- **Volume drop impact:** session count Mon vs. Wed of release week.
- **Advertiser pitch math:** "X unique players, Y minutes/session, Z% return rate." Direct sponsorship gold.

### Why not now
Setting up Supabase is its own project (auth, RLS, schema, key management) and ADR-001 explicitly defers it. Premature analytics is just engineering debt you can't yet read.

---

## 9. Scale and reliability

Honestly: not interesting at this scale. Vercel Analytics tolerates orders of magnitude more traffic than a single dog game will see in 2026. The free tier (2,500 events/month) covers ~80 visitors/day — if you exceed that, congratulations, upgrade to Pro for $10/mo and forget about it.

**Bot filtering** is handled by Vercel automatically. **Geo lookups** are at the edge. **No backups required** — analytics data is replayable from server logs in a pinch, but you won't need to.

The only failure mode worth naming: if Vercel ever has an outage, you lose data for the duration. Acceptable for non-financial analytics.

---

## 10. What I'd revisit as the system grows

| Trigger | Revisit |
|---|---|
| Traffic exceeds 50k monthly visitors | Consider a paid plan or a self-hosted alternative for cost |
| You want event-level data without committing to Supabase | Plausible Analytics' custom events tier is the lightest-touch upgrade |
| First sponsorship conversation | Build a simple monthly stats PDF generator from the Vercel API |
| First child-protection question from Apple/Google about a future native port | Tighten data collection further — may need to fully remove even the Vercel script |
| Phase 2B ships | Add the Supabase events layer per §8 |

---

## 11. Action items

Phase 2A (this task — proposed T11):
1. [ ] Turn on Vercel Web Analytics in the project dashboard
2. [ ] Add the one-line `<script defer src="/_vercel/insights/script.js"></script>` to `index.html` before `</body>`
3. [ ] Deploy, verify on phone + desktop, confirm dashboard populates
4. [ ] Update CLAUDE.md to note that the no-JS-deps rule has one principled exception (Vercel's first-party analytics script)

Decision check-ins:
5. [ ] After Volume 3 ships: review the dashboard. Is returning-visitor rate climbing? (This is the Phase 2B trigger from ADR-001.)
6. [ ] After ~6 Volumes: if you're still curious about per-level engagement, that's the signal Phase 2B's analytics layer is worth the work.

Long-term:
7. [ ] If/when total monthly visitors crosses ~5,000, draft a one-page sponsorship pitch deck.
