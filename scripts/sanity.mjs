#!/usr/bin/env node
// Bubba's World — level sanity checker.
//
// Usage:  node scripts/sanity.mjs levels/vol-08.json [more.json ...]
//         node scripts/sanity.mjs                 (checks every levels/vol-*.json)
//         node scripts/sanity.mjs --info ...      (also print advisory notes)
//
// Design note: this game's traversal is DIAGONAL cross-color (coyote-flip), and treats/
// enemies legitimately float in mid-air flight paths over gaps. So most "structural" rules
// (column gaps, treat-sits-on-platform, patrol-stays-on-platform) produce false alarms on the
// known-good shipped levels — they are NOT encoded as failures here. This checker only FAILS on
// things that are unambiguously broken and that every shipped Volume already passes, plus the
// genuinely new Vol-8 bounce-pad hazards. Everything softer is an --info advisory. Real
// verification is playing the level on a phone.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOW_INFO = process.argv.includes('--info');

const FLOOR_Y = 650;
const BOUNCE_REACH = 200;
const SEAT = { squirrel: { w: 22, off: 16 }, 'big-dog': { w: 30, off: 26 } };

const inBounds = (x, y) => x >= -40 && x <= 440 && y >= -60 && y <= 720;
const xOverlap = (ax, aw, bx, bw) => ax < bx + bw && ax + aw > bx;
const xCover = (inner, iw, outer, ow) => { // fraction of inner's width covered by outer
  const lo = Math.max(inner, outer), hi = Math.min(inner + iw, outer + ow);
  return Math.max(0, hi - lo) / iw;
};

function checkLevel(lvl, li, push) {
  const tag = `L${li + 1} ${lvl.name || '(unnamed)'}`;
  const fail = (m) => push('FAIL', `${tag}: ${m}`);
  const info = (m) => push('INFO', `${tag}: ${m}`);
  const plats = lvl.platforms || [];

  // --- required fields ---
  for (const f of ['name', 'start', 'platforms', 'treats']) {
    if (lvl[f] === undefined) fail(`missing required field "${f}"`);
  }
  if (lvl.start && !inBounds(lvl.start.x, lvl.start.y)) fail(`start out of bounds (${lvl.start.x},${lvl.start.y})`);

  // --- every coordinate inside the playfield (catches typos / unreachable strays) ---
  for (const p of plats) if (!inBounds(p.x, p.y)) fail(`platform out of bounds x=${p.x},y=${p.y}`);
  for (const t of (lvl.treats || [])) if (!inBounds(t.x, t.y)) fail(`treat out of bounds x=${t.x},y=${t.y}`);
  if (lvl.goldenTreat && !inBounds(lvl.goldenTreat.x, lvl.goldenTreat.y)) fail(`golden treat out of bounds`);
  for (const e of (lvl.enemies || [])) {
    if (!inBounds(e.x1, e.y) || !inBounds(e.x2, e.y)) fail(`${e.type} patrol out of bounds (${e.x1}..${e.x2} @ ${e.y})`);
    if (e.x2 < e.x1) fail(`${e.type} patrol x2(${e.x2}) < x1(${e.x1})`);
  }

  // --- bounce-pad hazards (the real new risk in Vol 8) ---
  const pads = plats.filter(p => p.color === 'bounce');
  for (const b of pads) {
    // A platform sitting in the launch column within the bonk zone stops the launch dead.
    for (const q of plats) {
      if (q === b || q.y >= b.y) continue;
      const rise = b.y - q.y;
      if (rise > 0 && rise <= 145 && xCover(b.x, b.w, q.x, q.w) > 0.5) {
        fail(`bounce pad (x=${b.x},y=${b.y}) head-bonks platform x=${q.x},y=${q.y} ${rise}px above (clear the launch column)`);
      }
    }
    // Nothing catchable within reach above the pad → you bounce into the void.
    const hasCatch = plats.some(q => q !== b && q.y < b.y && (b.y - q.y) <= BOUNCE_REACH &&
      xOverlap(b.x - 90, b.w + 180, q.x, q.w));
    if (!hasCatch) info(`bounce pad (x=${b.x},y=${b.y}) has no catch platform within ${BOUNCE_REACH}px above — confirm intended`);
  }

  // --- advisory: recovery floor (most levels want it; a few intentionally omit) ---
  const hasFloor = plats.some(p => p.color === 'white' && p.x <= 0 && p.w >= 380 && p.y === FLOOR_Y);
  if (!hasFloor) info(`no full-width recovery floor at y=${FLOOR_Y} — confirm intended (hazard level?)`);

  // --- advisory: enemy seat (floating enemy is usually a mistake, sometimes intended) ---
  for (const e of (lvl.enemies || [])) {
    const s = SEAT[e.type]; if (!s) continue;
    const seated = plats.some(p => Math.abs((p.y - s.off) - e.y) <= 4 && xOverlap(e.x1, e.x2 - e.x1 + s.w, p.x, p.w));
    if (!seated) info(`${e.type} @ y=${e.y} not seated on a platform (expect platform top ≈ ${e.y + s.off}) — confirm float intended`);
  }
}

function checkFile(path) {
  const out = [];
  let data;
  try { data = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { return [['FAIL', `invalid JSON — ${e.message}`]]; }
  if (!data.id) out.push(['FAIL', `missing top-level "id"`]);
  if (!Array.isArray(data.levels) || data.levels.length !== 5)
    out.push(['INFO', `expected 5 levels, found ${data.levels ? data.levels.length : 0}`]);
  (data.levels || []).forEach((lvl, i) => checkLevel(lvl, i, (sev, msg) => out.push([sev, msg])));
  return out;
}

const args = process.argv.slice(2).filter(a => a !== '--info');
const files = args.length
  ? args
  : readdirSync(join(ROOT, 'levels')).filter(f => /^vol-\d+\.json$/.test(f)).map(f => join('levels', f));

let fails = 0, infos = 0;
for (const f of files) {
  const path = join(ROOT, f);
  const issues = checkFile(path);
  const fc = issues.filter(i => i[0] === 'FAIL').length;
  const ic = issues.filter(i => i[0] === 'INFO').length;
  fails += fc; infos += ic;
  console.log(`\n${fc ? '❌' : '✅'} ${basename(path)}  (${fc} fail${ic ? `, ${ic} info` : ''})`);
  for (const [sev, msg] of issues) {
    if (sev === 'INFO' && !SHOW_INFO) continue;
    console.log(`   ${sev === 'FAIL' ? '✗ FAIL' : '· info'}  ${msg}`);
  }
}
console.log(`\n— ${files.length} file(s): ${fails} FAIL${SHOW_INFO ? `, ${infos} info` : ''} —`);
process.exit(fails ? 1 : 0);
