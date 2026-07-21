/**
 * Entry point: wires state, rendering, filters, sections, and effects
 * together. This is the only module index.astro loads.
 */

import { load, scheduleSave, ownedOf, updateOwned } from './state';
import { initTotals, renderCard, renderTotals } from './totals';
import { initFilters, applyFilter } from './filters';
import { initScan } from './scan';
import { initCollapse } from './collapse';
import { initLights } from './lights';
import { burstConfetti } from './confetti';
import { initBackup } from './backup';

const cards = [...document.querySelectorAll<HTMLElement>('.card')];

function setOwned(card: HTMLElement, value: number) {
  const needed = Number(card.dataset.needed);
  updateOwned(card.dataset.key!, Math.max(0, Math.min(needed, value)));
  renderCard(card);
  renderTotals();
  applyFilter();
  scheduleSave();
}

function renderAll() {
  cards.forEach(renderCard);
  renderTotals();
  applyFilter();
}

// per-card steppers, direct input, and the ✓ all-toggle
for (const card of cards) {
  const input = card.querySelector<HTMLInputElement>('.owned')!;
  input.addEventListener('change', () => setOwned(card, Number(input.value) || 0));
  for (const btn of card.querySelectorAll<HTMLButtonElement>('.step')) {
    btn.addEventListener('click', () => setOwned(card, ownedOf(card) + Number(btn.dataset.step)));
  }
  card.querySelector('.all')!.addEventListener('click', () => {
    const needed = Number(card.dataset.needed);
    setOwned(card, ownedOf(card) >= needed ? 0 : needed);
  });
}

initTotals(cards, burstConfetti);
initFilters(cards);
initScan(cards);
initBackup(cards, renderAll);
initCollapse();
initLights();

load().then(renderAll);
