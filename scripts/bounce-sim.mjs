#!/usr/bin/env node
// Headless physics sim mirroring index.html's updateBubba — used to PROVE bounce-pad steps
// in Vol 8 are reachable before authoring them into a level. Not shipped to players.
//
// Usage: node scripts/bounce-sim.mjs            (runs the built-in vol-08 bounce-step asserts)

const GRAVITY = 0.55, MOVE_SPEED = 3.0, BOUNCE_POWER = 16, MAX_FALL = 14, JUMP_POWER = 12.5;
const BW = 72, BH = 60, GAME_W = 400, GAME_H = 700;

const solid = (p, facing) =>
  p.color === 'white' || p.color === 'bounce' ||
  (p.color === 'amber' && facing === 1) || (p.color === 'blue' && facing === -1);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Simulate from a standing position, optionally launched by a bounce, holding `dir` (-1/0/1).
// Returns {landedOn, x, y, frames, bonk} — where Bubba comes to rest, or null if he falls out.
function sim(platforms, start, { dir = 0, launched = true, jump = false, maxFrames = 240 } = {}) {
  const b = { x: start.x, y: start.y, w: BW, h: BH, vx: 0, vy: launched ? -BOUNCE_POWER : 0, facing: start.facing ?? 1, onGround: false };
  if (jump) b.vy = -JUMP_POWER;
  let bonk = false;
  for (let f = 0; f < maxFrames; f++) {
    if (dir !== 0) b.facing = dir;
    b.vx = dir * MOVE_SPEED;
    b.vy += GRAVITY; if (b.vy > MAX_FALL) b.vy = MAX_FALL;
    // horizontal
    b.x += b.vx;
    if (b.x < 0) b.x = 0;
    if (b.x + b.w > GAME_W) b.x = GAME_W - b.w;
    for (const p of platforms) {
      if (!solid(p, b.facing)) continue;
      if (overlap(b, p)) { b.x = b.vx > 0 ? p.x - b.w : p.x + p.w; b.vx = 0; }
    }
    // vertical
    b.y += b.vy;
    b.onGround = false;
    let landed = null;
    for (const p of platforms) {
      if (!solid(p, b.facing)) continue;
      if (overlap(b, p)) {
        if (b.vy > 0) {
          b.y = p.y - b.h;
          if (p.color === 'bounce') { b.vy = -BOUNCE_POWER; }
          else { b.vy = 0; b.onGround = true; landed = p; }
        } else if (b.vy < 0) { b.y = p.y + p.h; b.vy = 0; bonk = true; }
      }
    }
    if (b.onGround && landed) return { landedOn: landed, x: Math.round(b.x), y: Math.round(b.y), frames: f, bonk };
    if (b.y > GAME_H + 100) return { landedOn: null, x: Math.round(b.x), y: Math.round(b.y), frames: f, bonk, fell: true };
  }
  return { landedOn: null, x: Math.round(b.x), y: Math.round(b.y), frames: maxFrames, bonk, timeout: true };
}

// label a platform for readable output
const lbl = (p) => p ? `${p.color}@(${p.x},${p.y})` : 'VOID';

// Try all three holds from a pad-top start, report where Bubba lands.
function probe(name, platforms, padTop) {
  console.log(`\n${name}`);
  for (const dir of [-1, 0, 1]) {
    const r = sim(platforms, { x: padTop.x, y: padTop.y - BH, facing: dir || 1 }, { dir, launched: true });
    const d = dir === -1 ? 'hold ←' : dir === 1 ? 'hold →' : 'no hold';
    console.log(`  ${d}: lands ${lbl(r.landedOn)} at x=${r.x},y=${r.y}  f=${r.frames}${r.bonk ? ' [bonk]' : ''}${r.fell ? ' [FELL]' : ''}`);
  }
}

// Dump the full launch arc over a floor-only world, so catches can be placed on the
// DESCENDING segment (vy>0) at x-positions the ascending segment never occupies.
function trajectory(padTop, dir, power = BOUNCE_POWER) {
  const floor = [{ x: 0, y: 650, w: 400, h: 50, color: 'white' }];
  const b = { x: padTop.x, y: padTop.y - BH, w: BW, h: BH, vx: 0, vy: -power, facing: dir || 1 };
  const pts = [];
  for (let f = 0; f < 120; f++) {
    if (dir !== 0) b.facing = dir;
    b.vx = dir * MOVE_SPEED;
    b.vy += GRAVITY; if (b.vy > MAX_FALL) b.vy = MAX_FALL;
    b.x += b.vx; if (b.x < 0) b.x = 0; if (b.x + b.w > GAME_W) b.x = GAME_W - b.w;
    b.y += b.vy;
    let onFloor = false;
    for (const p of floor) if (overlap(b, p) && b.vy > 0) { b.y = p.y - b.h; onFloor = true; }
    pts.push({ f, x: Math.round(b.x), top: Math.round(b.y), feet: Math.round(b.y + BH), vy: +b.vy.toFixed(1), up: b.vy < 0 });
    if (onFloor) break;
  }
  return pts;
}

function showArc(label, padX, padY, w) {
  const startX = padX + w / 2 - BW / 2;
  for (const dir of [-1, 1]) {
    const pts = trajectory({ x: startX, y: padY }, dir);
    const apex = pts.reduce((m, p) => p.top < m.top ? p : m, pts[0]);
    console.log(`\n${label} pad(${padX},${padY})w${w}  start x=${startX}  ${dir < 0 ? 'hold ←' : 'hold →'}  apex top=${apex.top} @x=${apex.x} f=${apex.f}`);
    // print descending samples (where a catch can be landed)
    const desc = pts.filter(p => !p.up && p.top > apex.top + 1);
    const rows = desc.filter((_, i) => i % 4 === 0);
    console.log('  descending (land a catch where its top≈feet & x within sprite, clear of ascent):');
    for (const p of rows) console.log(`    f=${p.f} x=${p.x}(L)..${p.x + BW}(R) top=${p.top} feet=${p.feet}`);
  }
}

if (process.argv.includes('--arc')) {
  // RIGHT module: pad on the left, drift right, catch hugging the right.
  showArc('RIGHT-mod', 120, 610, 120);
  // LEFT module: pad on the right, drift left, catch hugging the left.
  showArc('LEFT-mod', 200, 610, 120);
  process.exit(0);
}

// ---- import the actual vol-08 level data and probe each bounce pad ----
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const volPath = join(ROOT, 'levels/vol-08.json');

if (!existsSync(volPath)) {
  console.log('No levels/vol-08.json yet — author it, then re-run to probe each bounce pad.');
  process.exit(0);
}
const vol = JSON.parse(readFileSync(volPath, 'utf8'));
for (const lvl of vol.levels) {
  const pads = (lvl.platforms || []).filter(p => p.color === 'bounce');
  for (const pad of pads) {
    probe(`${lvl.name} — bounce pad @(${pad.x},${pad.y}) w=${pad.w}`, lvl.platforms, { x: pad.x + pad.w / 2 - BW / 2, y: pad.y });
  }
}
