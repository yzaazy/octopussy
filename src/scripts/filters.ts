/**
 * Search + kleur + nog-nodig filtering, and the sort dropdown.
 * Sorting reorders cards on dropdown change only, so cards don't jump
 * around while stepping quantities.
 */

import { ownedOf } from './state';

let cards: HTMLElement[] = [];

const searchInput = document.getElementById('search') as HTMLInputElement;
const colorFilter = document.getElementById('color-filter') as HTMLSelectElement;
const missingOnly = document.getElementById('missing-only') as HTMLInputElement;
const sortBy = document.getElementById('sort-by') as HTMLSelectElement;

export function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  const color = colorFilter.value;
  for (const card of cards) {
    const matchesText =
      !q || card.dataset.part!.toLowerCase().includes(q) || (card.dataset.name ?? '').includes(q);
    const matchesColor = !color || card.dataset.color === color;
    const missing = !missingOnly.checked || !card.classList.contains('done');
    card.hidden = !(matchesText && matchesColor && missing);
  }
  for (const section of document.querySelectorAll<HTMLElement>('section')) {
    section.hidden = ![...section.querySelectorAll<HTMLElement>('.card')].some((c) => !c.hidden);
  }
}

const byPart = (a: HTMLElement, b: HTMLElement) =>
  a.dataset.part!.localeCompare(b.dataset.part!, undefined, { numeric: true });
const byColor = (a: HTMLElement, b: HTMLElement) => Number(a.dataset.color) - Number(b.dataset.color);
const missingOf = (c: HTMLElement) => Number(c.dataset.needed) - ownedOf(c);

const compare: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
  color: (a, b) => byColor(a, b) || byPart(a, b),
  part: (a, b) => byPart(a, b) || byColor(a, b),
  missing: (a, b) => missingOf(b) - missingOf(a) || byPart(a, b),
};

function applySort() {
  const cmp = compare[sortBy.value];
  for (const grid of document.querySelectorAll('.grid')) {
    [...grid.querySelectorAll<HTMLElement>('.card')].sort(cmp).forEach((c) => grid.appendChild(c));
  }
}

export function initFilters(allCards: HTMLElement[]) {
  cards = allCards;
  searchInput.addEventListener('input', applyFilter);
  colorFilter.addEventListener('change', applyFilter);
  missingOnly.addEventListener('change', applyFilter);
  sortBy.addEventListener('change', applySort);
}
