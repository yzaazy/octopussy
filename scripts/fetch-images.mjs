// Downloads BrickLink part images into public/parts/ so the site is self-hosted.
// Skips files that already exist; network failures only warn (the page falls
// back to the BrickLink CDN for any missing image).
import { mkdirSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseWantedList } from '../src/lib/parseWantedList.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = `${root}public/parts`;
mkdirSync(outDir, { recursive: true });

const files = ['Octopussy.xml', 'backwall octopussy.xml', 'Octopussy power.xml'];
const parts = new Map();
for (const file of files) {
  for (const p of parseWantedList(`${root}${file}`)) parts.set(p.key, p);
}

const missing = [...parts.values()].filter(
  (p) => !existsSync(`${outDir}/${p.colorId}-${p.partId}.png`)
);
console.log(`${parts.size} part images, ${missing.length} to download`);

let failed = 0;
async function download(p) {
  const urls = [
    `https://img.bricklink.com/ItemImage/PN/${p.colorId}/${p.partId}.png`,
    `https://img.bricklink.com/ItemImage/PL/${p.partId}.png`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        writeFileSync(`${outDir}/${p.colorId}-${p.partId}.png`, Buffer.from(await res.arrayBuffer()));
        return;
      }
    } catch {}
  }
  failed++;
  console.warn(`  failed: ${p.partId} color ${p.colorId}`);
}

// download with limited concurrency
const queue = [...missing];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let p; (p = queue.shift()); ) await download(p);
  })
);

console.log(`done — ${readdirSync(outDir).length} images in public/parts${failed ? `, ${failed} failed (page will use BrickLink CDN for those)` : ''}`);
