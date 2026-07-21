/** Collapsible sections, remembered per device in localStorage. */

const COLLAPSED_KEY = 'octopussy-collapsed';

export function initCollapse() {
  const collapsed = new Set<string>(JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]'));
  for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-collapse]')) {
    const slug = d.dataset.collapse!;
    d.open = !collapsed.has(slug);
    d.addEventListener('toggle', () => {
      if (d.open) collapsed.delete(slug);
      else collapsed.add(slug);
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed]));
    });
  }
}
