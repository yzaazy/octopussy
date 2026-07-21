import { readFileSync } from 'node:fs';

export interface WantedPart {
  /** Unique key: `${partId}-${colorId}` */
  key: string;
  partId: string;
  colorId: number;
  qtyNeeded: number;
}

/**
 * Parse a BrickLink wanted-list XML file into a list of parts.
 * Duplicate partId+color entries within one file are merged by summing MINQTY.
 */
export function parseWantedList(filePath: string): WantedPart[] {
  const xml = readFileSync(filePath, 'utf-8');
  const parts = new Map<string, WantedPart>();

  for (const [, itemXml] of xml.matchAll(/<ITEM>([\s\S]*?)<\/ITEM>/g)) {
    const tag = (name: string) =>
      itemXml.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1].trim() ?? '';

    const partId = tag('ITEMID');
    if (!partId) continue;
    const colorId = Number(tag('COLOR') || '0');
    const qtyNeeded = Number(tag('MINQTY') || '1');

    const key = `${partId}-${colorId}`;
    const existing = parts.get(key);
    if (existing) {
      existing.qtyNeeded += qtyNeeded;
    } else {
      parts.set(key, { key, partId, colorId, qtyNeeded });
    }
  }

  return [...parts.values()].sort(
    (a, b) => a.colorId - b.colorId || a.partId.localeCompare(b.partId)
  );
}
