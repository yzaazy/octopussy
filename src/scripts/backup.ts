/**
 * Footer actions: the missing-parts BrickLink wanted-list XML, and
 * JSON backup export/import of the progress state.
 */

import { getState, replaceState, ownedOf, scheduleSave } from './state';

function downloadFile(name: string, content: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function initBackup(cards: HTMLElement[], onImported: () => void) {
  document.getElementById('export-missing')!.addEventListener('click', () => {
    // sum missing quantities per part+color across all three lists
    const missing = new Map<string, { part: string; color: string; qty: number }>();
    for (const card of cards) {
      const qty = Number(card.dataset.needed) - ownedOf(card);
      if (qty <= 0) continue;
      const id = `${card.dataset.part}-${card.dataset.color}`;
      const entry = missing.get(id) ?? { part: card.dataset.part!, color: card.dataset.color!, qty: 0 };
      entry.qty += qty;
      missing.set(id, entry);
    }
    if (!missing.size) {
      alert('Niets ontbreekt — je hebt alle stenen!');
      return;
    }
    const items = [...missing.values()]
      .map(
        (m) =>
          `<ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>${m.part}</ITEMID><COLOR>${m.color}</COLOR><MINQTY>${m.qty}</MINQTY><CONDITION>X</CONDITION></ITEM>`
      )
      .join('\n');
    downloadFile(
      'octopussy-missing.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<INVENTORY>\n${items}\n</INVENTORY>\n`,
      'application/xml'
    );
  });

  document.getElementById('export')!.addEventListener('click', () => {
    downloadFile('octopussy-progress.json', JSON.stringify(getState(), null, 2), 'application/json');
  });

  const importFile = document.getElementById('import-file') as HTMLInputElement;
  document.getElementById('import')!.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    try {
      replaceState(JSON.parse(await file.text()));
      onImported();
      scheduleSave();
    } catch {
      alert('Dat bestand is geen geldige backup.');
    }
    importFile.value = '';
  });
}
