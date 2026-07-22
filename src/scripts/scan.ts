/**
 * Steen scannen met de telefooncamera. De foto gaat naar Brickognize
 * (gratis publieke herkennings-API, BrickLink-nummering) en de
 * kandidaten worden gematcht tegen de lijst. Kleur wordt niet herkend:
 * een treffer filtert de lijst op het onderdeelnummer, zodat alle
 * kleurvarianten zichtbaar zijn.
 */

import { searchFor } from './filters';

const API_URL = 'https://api.brickognize.com/predict/';

interface Candidate {
  id: string;
  name: string;
  img_url: string;
  score: number;
}

let cards: HTMLElement[] = [];

const scanBtn = document.getElementById('scan-btn')!;
const scanInput = document.getElementById('scan-input') as HTMLInputElement;
const panel = document.getElementById('scan-panel')!;
const body = panel.querySelector<HTMLElement>('.scan-body')!;

// print- en gietvormvarianten gelijkstellen: 98138pb007 ≙ 98138, 3070b ≙ 3070
const normalize = (id: string) => id.replace(/p[bxr].*$/, '').replace(/[ab]$/, '');

function matchesFor(id: string): HTMLElement[] {
  const exact = cards.filter((c) => c.dataset.part === id);
  if (exact.length) return exact;
  return cards.filter((c) => normalize(c.dataset.part!) === normalize(id));
}

function openPanel() {
  panel.hidden = false;
}

function closePanel() {
  panel.hidden = true;
}

function setStatus(text: string) {
  body.textContent = '';
  const p = document.createElement('p');
  p.className = 'scan-status';
  p.textContent = text;
  body.append(p);
}

/** Verklein de foto vóór het uploaden; een telefoonfoto van 4+ MB is
 * onnodig groot voor herkenning. */
async function toUpload(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (blob) return blob;
  } catch {
    // niet te decoderen (exotisch formaat) — stuur dan het origineel
  }
  return file;
}

function showOnList(hits: HTMLElement[]) {
  closePanel();
  searchFor(normalize(hits[0].dataset.part!));
  for (const hit of hits) {
    hit.closest('details')?.setAttribute('open', '');
    hit.classList.add('scan-flash');
    setTimeout(() => hit.classList.remove('scan-flash'), 2400);
  }
  hits[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function renderResults(items: unknown[]) {
  // het antwoord komt van een externe API: alleen items met de verwachte
  // veldtypes gebruiken, de rest overslaan
  const safe = items.filter(
    (it): it is Candidate =>
      typeof (it as Candidate)?.id === 'string' &&
      typeof (it as Candidate)?.name === 'string' &&
      typeof (it as Candidate)?.score === 'number',
  );
  const top = safe.slice(0, 6);
  if (!top.length) {
    setStatus('Geen onderdeel herkend. Leg één steen op een egale achtergrond en probeer het opnieuw.');
    return;
  }
  body.textContent = '';
  for (const item of top) {
    const hits = matchesFor(item.id);
    const colors = new Set(hits.map((c) => c.dataset.color));

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'scan-hit';
    el.disabled = !hits.length;

    const img = document.createElement('img');
    // alleen https-plaatjes van de API accepteren
    if (typeof item.img_url === 'string' && item.img_url.startsWith('https://')) img.src = item.img_url;
    img.alt = '';
    img.loading = 'lazy';

    const meta = document.createElement('span');
    meta.className = 'scan-hit-meta';
    const id = document.createElement('strong');
    id.textContent = item.id;
    const name = document.createElement('span');
    name.className = 'scan-hit-name';
    name.textContent = item.name;
    const onList = document.createElement('span');
    onList.className = hits.length ? 'scan-hit-list' : 'scan-hit-miss';
    onList.textContent = hits.length
      ? `Op de lijst · ${colors.size} ${colors.size === 1 ? 'kleur' : 'kleuren'}`
      : 'Niet op de lijst';
    meta.append(id, name, onList);

    const score = document.createElement('span');
    score.className = 'scan-score';
    score.textContent = `${Math.round(Math.min(1, Math.max(0, item.score)) * 100)}%`;

    el.append(img, meta, score);
    if (hits.length) el.addEventListener('click', () => showOnList(hits));
    body.append(el);
  }
}

async function recognize(file: File) {
  openPanel();
  setStatus('Herkennen…');
  try {
    const form = new FormData();
    form.append('query_image', await toUpload(file), 'scan.jpg');
    const res = await fetch(API_URL, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    renderResults(Array.isArray(data?.items) ? data.items : []);
  } catch {
    setStatus('Herkennen is niet gelukt. Controleer je internetverbinding en probeer het opnieuw.');
  }
}

export function initScan(allCards: HTMLElement[]) {
  cards = allCards;
  scanBtn.addEventListener('click', () => scanInput.click());
  scanInput.addEventListener('change', () => {
    const file = scanInput.files?.[0];
    if (file) recognize(file);
    scanInput.value = '';
  });
  panel.addEventListener('click', (e) => {
    if (e.target === panel) closePanel();
  });
  panel.querySelector('.scan-close')!.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });
}
