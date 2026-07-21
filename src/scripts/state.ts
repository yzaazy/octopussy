/**
 * Progress state and persistence: shared progress.json on the server
 * (written via PUT, see deploy/nginx.conf), mirrored to localStorage as
 * fallback. The sync indicator in the header reflects the active mode.
 */

const LS_KEY = 'octopussy-progress';
const SERVER_FILE = 'progress.json';

type SyncState = 'synced' | 'local' | 'saving' | 'loading';

let state: Record<string, number> = {};

const syncEl = document.getElementById('sync-status')!;
const syncLabel = document.getElementById('sync-label')!;

function setSync(name: SyncState) {
  syncEl.dataset.state = name;
  syncLabel.textContent = {
    synced: 'Gesynchroniseerd',
    local: 'Alleen op dit apparaat opgeslagen',
    saving: 'Opslaan…',
    loading: 'Laden…',
  }[name];
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export function scheduleSave() {
  setSync('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 800);
}

async function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  try {
    const res = await fetch(SERVER_FILE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    setSync(res.ok ? 'synced' : 'local');
  } catch {
    setSync('local');
  }
}

export async function load() {
  let fromServer = false;
  try {
    const res = await fetch(SERVER_FILE, { cache: 'no-store' });
    if (res.ok) {
      state = (await res.json()) ?? {};
      fromServer = true;
    }
  } catch {}
  if (!fromServer) {
    try {
      state = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
    } catch {
      state = {};
    }
  }
  setSync(fromServer ? 'synced' : 'local');
}

/** Owned quantity for a part card, clamped to what the model needs. */
export function ownedOf(card: HTMLElement): number {
  return Math.min(state[card.dataset.key!] ?? 0, Number(card.dataset.needed));
}

export function updateOwned(key: string, value: number) {
  state[key] = value;
}

export function getState() {
  return state;
}

export function replaceState(next: Record<string, number>) {
  state = next;
}
