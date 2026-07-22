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
  // de ✓ zit naast de +1 en zet in één klap alles op vol (of terug naar
  // 0), dus een misklik is snel gemaakt: eerste tik wapent de knop,
  // pas een tweede tik binnen 3s voert hem echt uit
  const allBtn = card.querySelector<HTMLButtonElement>('.all')!;
  allBtn.dataset.label = allBtn.getAttribute('aria-label')!;
  let confirmTimer = 0;
  const disarm = () => {
    clearTimeout(confirmTimer);
    allBtn.classList.remove('confirm');
    allBtn.textContent = '✓';
    allBtn.setAttribute('aria-label', allBtn.dataset.label!);
  };
  allBtn.addEventListener('click', () => {
    if (!allBtn.classList.contains('confirm')) {
      allBtn.classList.add('confirm');
      allBtn.textContent = '?';
      allBtn.setAttribute('aria-label', 'Tik nog eens om te bevestigen');
      confirmTimer = window.setTimeout(disarm, 3000);
      return;
    }
    disarm();
    const needed = Number(card.dataset.needed);
    setOwned(card, ownedOf(card) >= needed ? 0 : needed);
  });
}

// een tik ergens anders ontwapent een wachtende ✓ meteen
document.addEventListener('click', (e) => {
  for (const b of document.querySelectorAll<HTMLButtonElement>('.all.confirm')) {
    if (b === e.target) continue;
    b.classList.remove('confirm');
    b.textContent = '✓';
    b.setAttribute('aria-label', b.dataset.label!);
  }
});

initTotals(cards, burstConfetti);
initFilters(cards);
initScan(cards);
initBackup(cards, renderAll);
initCollapse();
initLights();

load().then(renderAll);
