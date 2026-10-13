#!/usr/bin/env node
/**
 * Validates data/skill-sky.json structure.
 * Run after edits: node scripts/validate-skill-sky.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data/skill-sky.json"), "utf8"));

const { starOrder, stars } = data;
const ids = stars.map((s) => s.id);
let errors = 0;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  errors += 1;
}

for (const id of ids) {
  if (!starOrder.includes(id)) fail(`star ${id} missing from starOrder`);
}
for (const id of starOrder) {
  if (!ids.includes(id)) fail(`starOrder entry ${id} has no star object`);
}

for (const star of stars) {
  if (!star.summary?.lead) fail(`${star.id}: summary.lead required`);
  if (!Array.isArray(star.summary?.bullets) || star.summary.bullets.length < 1) {
    fail(`${star.id}: summary.bullets must be a non-empty array`);
  }
  if (!star.glyph) fail(`${star.id}: glyph required`);
}

if (errors) {
  console.error(`\n${errors} error(s).`);
  process.exit(1);
}

console.log(`OK: ${ids.length} stars with per-star summaries.`);
