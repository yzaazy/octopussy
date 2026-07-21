// Builds src/data/part-names.json: BrickLink part id → English part name.
// Names come from Rebrickable's free parts database (no API key needed);
// Rebrickable part numbers match BrickLink ids for most parts. Printed
// parts (…pb007) fall back to their base part's name; BrickLink-only ids
// (assemblies like 59510c01) simply get no name.
//
// Run manually after changing the wanted-list XMLs: npm run fetch-names
// The resulting JSON is committed, so normal builds don't need this.
import { writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { parseWantedList } from '../src/lib/parseWantedList.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

const files = ['Octopussy.xml', 'backwall octopussy.xml', 'Octopussy power.xml'];
const partIds = new Set();
for (const file of files) {
  for (const p of parseWantedList(`${root}${file}`)) partIds.add(p.partId);
}

console.log(`fetching Rebrickable parts database for ${partIds.size} part ids…`);
const res = await fetch('https://cdn.rebrickable.com/media/downloads/parts.csv.gz');
if (!res.ok) throw new Error(`download failed: ${res.status}`);
const csv = gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf-8');

// csv columns: part_num,name,part_cat_id,part_material — name may be quoted
const names = new Map();
for (const line of csv.split('\n').slice(1)) {
  const comma = line.indexOf(',');
  if (comma === -1) continue;
  const partNum = line.slice(0, comma);
  let rest = line.slice(comma + 1);
  let name;
  if (rest.startsWith('"')) {
    let i = 1;
    let out = '';
    while (i < rest.length) {
      if (rest[i] === '"') {
        if (rest[i + 1] === '"') {
          out += '"';
          i += 2;
          continue;
        }
        break;
      }
      out += rest[i++];
    }
    name = out;
  } else {
    const end = rest.indexOf(',');
    name = end === -1 ? rest : rest.slice(0, end);
  }
  names.set(partNum, name);
}

// known BrickLink → Rebrickable renumberings the heuristics can't guess
const ALIASES = { 4073: '6141' };

// BrickLink-only ids that don't exist in Rebrickable's database at all;
// names taken from the BrickLink catalog pages
const MANUAL_NAMES = {
  '18938u': 'Technic Turntable 60 Tooth, Top (Undetermined Type)',
  '2739b': 'Technic, Link 1 x 6 with Stoppers',
  '4265c': 'Technic Bush 1/2 Smooth',
  '58123c01': 'Electric Power Functions Receiver Unit with Dark Bluish Gray Bottom',
  '59510c01': 'Electric 9V Battery Box 4 x 11 x 7 PF with Orange Switch and Dark Bluish Gray Covers',
  '6538c': 'Technic, Axle Connector 2L (Smooth with x Hole + Orientation)',
  '92289': 'Minifigure, Weapon Trident',
  'x187': 'Technic, Gear 24 Tooth with 3 Axle Holes',
};

const result = {};
let misses = [];
for (const id of [...partIds].sort()) {
  // BrickLink and Rebrickable numbering mostly match, but variants differ:
  // try exact, printed-base (98138pb007 → 98138), mold variants (3070 ↔ 3070b,
  // 2436b → 2436), and assembly bases (58123c01 → 58123)
  const candidates = [
    ALIASES[id],
    id,
    id.replace(/p[bxr].*$/, ''),
    `${id}b`,
    `${id}a`,
    id.replace(/[ab]$/, ''),
    id.replace(/c\d+$/, ''),
  ];
  const name = MANUAL_NAMES[id] ?? candidates.map((c) => names.get(c)).find(Boolean);
  if (name) result[id] = name;
  else misses.push(id);
}

writeFileSync(`${root}src/data/part-names.json`, JSON.stringify(result, null, 1) + '\n');
console.log(`done — ${Object.keys(result).length}/${partIds.size} names found`);
if (misses.length) console.log(`no name for: ${misses.join(', ')}`);
