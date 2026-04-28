#!/usr/bin/env node
/**
 * Easy Poultry — final decoupling pass.
 *
 * Walks every .js / .jsx / .ts / .tsx file under src/ and rewrites:
 *   import { base44 } from '@/api/base44Client'   →  import { api } from '@/api/client'
 *   import { base44 } from "@/api/base44Client"   →  import { api } from "@/api/client"
 *   import base44 from '@/api/base44Client'       →  import api from '@/api/client'
 *   base44.entities.X                              →  api.entities.X
 *   base44.auth.X                                  →  api.auth.X
 *   base44.integrations.X                          →  api.integrations.X
 *   base44.functions.X                             →  api.functions.X
 *   base44.agents.X                                →  api.agents.X
 *   base44.appLogs.X                               →  api.appLogs.X
 *   (any other) base44.                            →  api.
 *
 * Then deletes src/api/base44Client.js.
 *
 * Usage:
 *   node scripts/decouple-from-base44.mjs
 *   node scripts/decouple-from-base44.mjs --dry        (preview without writing)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LEGACY_FILE = path.join(SRC, 'api', 'base44Client.js');
const DRY = process.argv.includes('--dry');

const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.next']);

const REPLACEMENTS = [
  // Import statements
  [/from\s+(['"])@\/api\/base44Client\1/g, "from $1@/api/client$1"],
  [/from\s+(['"])\.\/base44Client\1/g, "from $1./client$1"],
  [/from\s+(['"])\.\.\/api\/base44Client\1/g, "from $1../api/client$1"],
  // Named import: { base44 } → { api }
  [/import\s*\{\s*base44\s*\}/g, "import { api }"],
  // Default import: base44 → api
  [/import\s+base44\s+from/g, "import api from"],
  // Usages: base44.X → api.X
  [/\bbase44\./g, "api."],
];

async function* walk(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      yield* walk(full);
    } else if (EXTS.has(path.extname(ent.name))) {
      yield full;
    }
  }
}

let touched = 0, scanned = 0;

for await (const file of walk(SRC)) {
  scanned++;
  if (file === LEGACY_FILE) continue; // we'll delete this below
  const original = await fs.readFile(file, 'utf8');
  let updated = original;
  for (const [re, sub] of REPLACEMENTS) updated = updated.replace(re, sub);
  if (updated !== original) {
    touched++;
    const rel = path.relative(ROOT, file);
    if (DRY) {
      console.log(`would update  ${rel}`);
    } else {
      await fs.writeFile(file, updated, 'utf8');
      console.log(`updated       ${rel}`);
    }
  }
}

// Remove the legacy file
try {
  await fs.access(LEGACY_FILE);
  if (DRY) {
    console.log(`would delete  ${path.relative(ROOT, LEGACY_FILE)}`);
  } else {
    await fs.unlink(LEGACY_FILE);
    console.log(`deleted       ${path.relative(ROOT, LEGACY_FILE)}`);
  }
} catch {
  // already gone, that's fine
}

console.log(`\n${DRY ? '[dry run] ' : ''}scanned ${scanned} files, ${touched} ${DRY ? 'would change' : 'changed'}`);
console.log(DRY
  ? '\nRe-run without --dry to apply.'
  : '\nDone. The codebase no longer references `base44`.\nRestart your dev server (npm run dev).'
);
