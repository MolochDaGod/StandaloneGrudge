#!/usr/bin/env node
/**
 * Export Skill Trees to ObjectStore JSON
 *
 * Reads the authoritative skill trees from src/data/skillTrees.js and writes
 * a JSON file suitable for deployment to ObjectStore api/v1/skillTrees.json.
 *
 * Usage:
 *   node scripts/export-skill-trees.js                      # writes to stdout
 *   node scripts/export-skill-trees.js --out <path>         # writes to file
 *   node scripts/export-skill-trees.js --out ../ObjectStore/api/v1/skillTrees.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src', 'data', 'skillTrees.js');

// Strip the import/const lines and eval the raw data
// We can't import it directly because it now has a runtime dependency on OBJECTSTORE_BASE.
// Instead we read, strip the import/SK lines, and evaluate the pure data.
const raw = readFileSync(SRC, 'utf-8');

// Remove the import and SK const lines
const dataOnly = raw
  .replace(/^import\s.*?;\s*$/gm, '')
  .replace(/^const SK\s*=.*?;\s*$/gm, '')
  .replace(/SK\(\s*'([^']+)'\s*,\s*(\d+)\s*\)/g, (_, cls, n) => {
    const padded = String(n).padStart(2, '0');
    return `'https://molochdagod.github.io/ObjectStore/icons/skill_nobg/${cls}_${padded}_nobg.png'`;
  });

// Wrap in a function so we can grab the export
const fn = new Function(`
  ${dataOnly.replace('export const skillTrees', 'const skillTrees')}
  return skillTrees;
`);

const skillTrees = fn();

const output = {
  version: '1.0.0',
  updated: new Date().toISOString().split('T')[0],
  source: 'GrudgeWars/src/data/skillTrees.js',
  classes: Object.keys(skillTrees).length,
  totalSkills: Object.values(skillTrees).reduce(
    (sum, cls) => sum + cls.tiers.reduce((s, t) => s + t.skills.length, 0), 0
  ),
  skillTrees,
};

// Output
const outIdx = process.argv.indexOf('--out');
if (outIdx !== -1 && process.argv[outIdx + 1]) {
  const outPath = resolve(process.argv[outIdx + 1]);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`✅ Wrote ${outPath} (${output.totalSkills} skills across ${output.classes} classes)`);
} else {
  process.stdout.write(JSON.stringify(output, null, 2));
}
