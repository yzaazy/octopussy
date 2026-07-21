/**
 * Rendering of derived numbers: per-card owned/done state, header piece
 * counts, stud-bar fill, per-section bars, and section-complete detection
 * (which reports *newly* completed sections so main.ts can celebrate).
 */

import { ownedOf } from './state';

let cards: HTMLElement[] = [];
let onNewComplete: (sectionHead: HTMLElement) => void = () => {};

const completedSections = new Set<string>();
let sectionsSeeded = false;

export function initTotals(allCards: HTMLElement[], onSectionNewlyComplete: (head: HTMLElement) => void) {
  cards = allCards;
  onNewComplete = onSectionNewlyComplete;
}

export function renderCard(card: HTMLElement) {
  const owned = ownedOf(card);
  const needed = Number(card.dataset.needed);
  card.querySelector<HTMLInputElement>('.owned')!.value = String(owned);
  card.classList.toggle('done', owned >= needed);
}

export function renderTotals() {
  const perSection: Record<string, { owned: number; needed: number }> = {};
  let piecesOwned = 0;
  let piecesNeeded = 0;
  let lotsDone = 0;
  for (const card of cards) {
    const slug = card.dataset.key!.split(':')[0];
    const owned = ownedOf(card);
    const needed = Number(card.dataset.needed);
    const s = (perSection[slug] ??= { owned: 0, needed: 0 });
    s.owned += owned;
    s.needed += needed;
    piecesOwned += owned;
    piecesNeeded += needed;
    if (owned >= needed) lotsDone++;
  }
  document.getElementById('pieces-owned')!.textContent = String(piecesOwned);
  document.getElementById('parts-done')!.textContent = String(lotsDone);

  const studBar = document.getElementById('stud-bar')!;
  const studs = studBar.querySelectorAll('.stud');
  const filled = Math.round((piecesOwned / piecesNeeded) * studs.length);
  studs.forEach((stud, i) => stud.classList.toggle('filled', i < filled));
  studBar.classList.toggle('complete', piecesNeeded > 0 && piecesOwned >= piecesNeeded);

  for (const [slug, s] of Object.entries(perSection)) {
    const pct = s.needed ? (s.owned / s.needed) * 100 : 0;
    document.querySelector<HTMLElement>(`[data-bar-for="${slug}"]`)!.style.width = `${pct}%`;
    document.querySelector(`[data-count-for="${slug}"]`)!.textContent = `${s.owned} / ${s.needed}`;

    const sectionEl = document.querySelector<HTMLElement>(`section[data-section="${slug}"]`)!;
    const complete = s.needed > 0 && s.owned >= s.needed;
    sectionEl.classList.toggle('section-complete', complete);
    // celebrate only when a section is newly finished during use, not on page load
    if (complete && sectionsSeeded && !completedSections.has(slug)) {
      onNewComplete(sectionEl.querySelector<HTMLElement>('.section-head')!);
    }
    if (complete) completedSections.add(slug);
    else completedSections.delete(slug);
  }
  sectionsSeeded = true;
}
