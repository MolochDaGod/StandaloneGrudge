#!/usr/bin/env node
/**
 * migrate-objectstore-to-s3.js
 *
 * Uploads ObjectStore assets from the local filesystem to the grudge-assets S3 bucket.
 * Preserves directory structure under organized prefixes.
 *
 * Usage:
 *   node scripts/migrate-objectstore-to-s3.js [--dry-run] [--prefix sprites] [--objectstore /path/to/ObjectStore]
 *
 * Requires env vars: BUCKET_NAME, BUCKET_ENDPOINT, BUCKET_ACCESS_KEY, BUCKET_SECRET_KEY
 * (set them in .env or export before running)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env if present
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch { /* ignore */ }

// Now import S3 (needs env vars loaded)
const S3 = await import('../api/lib/s3.js');

// ── Config ──────────────────────────────────────────────────────────────────
const MIME_MAP = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.flac': 'audio/flac',
  '.glb':  'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.fbx':  'application/octet-stream',
  '.obj':  'text/plain',
  '.mtl':  'text/plain',
};

/** Directories in ObjectStore to migrate, mapped to S3 prefixes */
const ASSET_DIRS = [
  { local: 'sprites',      s3Prefix: 'sprites/' },
  { local: 'backgrounds',  s3Prefix: 'backgrounds/' },
  { local: 'icons',        s3Prefix: 'icons/' },
  { local: 'audio',        s3Prefix: 'audio/' },
  { local: 'models',       s3Prefix: 'models/' },
  { local: 'effects',      s3Prefix: 'vfx/' },
  { local: 'api',          s3Prefix: 'exports/' },      // JSON API data
];

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const prefixFilter = args.find((_, i) => args[i - 1] === '--prefix') || null;

// Default ObjectStore path: sibling repo
const objectStoreArg = args.find((_, i) => args[i - 1] === '--objectstore');
const OBJECTSTORE_ROOT = objectStoreArg
  || path.resolve(__dirname, '..', '..', 'ObjectStore');

// ── Helpers ─────────────────────────────────────────────────────────────────
function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function* walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      yield* walkDir(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📦 ObjectStore → S3 Migration`);
  console.log(`   Source: ${OBJECTSTORE_ROOT}`);
  console.log(`   Bucket: ${process.env.BUCKET_NAME || '(not set)'}`);
  console.log(`   Mode:   ${dryRun ? 'DRY RUN' : 'LIVE UPLOAD'}`);
  if (prefixFilter) console.log(`   Filter: ${prefixFilter}`);
  console.log('');

  if (!fs.existsSync(OBJECTSTORE_ROOT)) {
    console.error(`ERROR: ObjectStore directory not found: ${OBJECTSTORE_ROOT}`);
    console.error('Use --objectstore /path/to/ObjectStore to specify the path.');
    process.exit(1);
  }

  if (!S3.isConfigured()) {
    console.error('ERROR: S3 not configured. Set BUCKET_NAME, BUCKET_ENDPOINT, BUCKET_ACCESS_KEY, BUCKET_SECRET_KEY.');
    process.exit(1);
  }

  const dirs = prefixFilter
    ? ASSET_DIRS.filter(d => d.local === prefixFilter || d.s3Prefix.startsWith(prefixFilter))
    : ASSET_DIRS;

  let totalFiles = 0;
  let totalBytes = 0;
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const { local, s3Prefix } of dirs) {
    const localDir = path.join(OBJECTSTORE_ROOT, local);
    if (!fs.existsSync(localDir)) {
      console.log(`⏭  Skipping ${local}/ (not found)`);
      continue;
    }

    console.log(`\n📁 ${local}/ → s3://${s3Prefix}`);

    for (const filePath of walkDir(localDir)) {
      totalFiles++;
      const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/');
      const s3Key = s3Prefix + relativePath;
      const stat = fs.statSync(filePath);
      totalBytes += stat.size;

      if (dryRun) {
        console.log(`   [dry] ${s3Key} (${(stat.size / 1024).toFixed(1)}KB)`);
        uploaded++;
        continue;
      }

      try {
        // Check if already exists (skip if same size)
        try {
          const existing = await S3.head(s3Key);
          if (existing.size === stat.size) {
            skipped++;
            continue; // Same size — skip
          }
        } catch {
          // Doesn't exist yet — upload
        }

        const body = fs.readFileSync(filePath);
        await S3.upload(s3Key, body, getMime(filePath));
        uploaded++;

        if (uploaded % 50 === 0) {
          console.log(`   ... ${uploaded} files uploaded`);
        }
      } catch (err) {
        errors++;
        console.error(`   ERROR: ${s3Key} — ${err.message}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Done!`);
  console.log(`   Files found:    ${totalFiles}`);
  console.log(`   Uploaded:       ${uploaded}`);
  console.log(`   Skipped (dup):  ${skipped}`);
  console.log(`   Errors:         ${errors}`);
  console.log(`   Total size:     ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
  if (dryRun) console.log(`\n   ⚠️  Dry run — nothing was actually uploaded. Remove --dry-run to upload.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
