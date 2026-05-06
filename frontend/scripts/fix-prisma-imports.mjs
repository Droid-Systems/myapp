/**
 * Prisma 7.x generates .ts files with .js import extensions (TypeScript ESM convention).
 * Turbopack cannot resolve .js → .ts, so this script rewrites relative .js imports to .ts.
 * Run after `prisma generate`.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const GENERATED_DIR = join(process.cwd(), "generated", "prisma");

async function fixFile(filePath) {
  const content = await readFile(filePath, "utf-8");
  // Replace .js in relative import/export paths: from "./foo.js" → from "./foo.ts"
  const fixed = content.replace(
    /(from\s+['"]\.\.?\/[^'"]*?)\.js(['"])/g,
    "$1.ts$2"
  );
  if (fixed !== content) {
    await writeFile(filePath, fixed, "utf-8");
    console.log(`Fixed imports in ${filePath}`);
  }
}

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else if (entry.name.endsWith(".ts")) {
      await fixFile(fullPath);
    }
  }
}

await walkDir(GENERATED_DIR);
console.log("Done fixing Prisma generated imports.");
