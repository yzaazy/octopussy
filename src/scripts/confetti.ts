/** One-time confetti burst out of an element (used for finished sections). */

const COLORS = ['#ffd54f', '#ff6259', '#4fc3f7', '#85e08a', '#f48fb1', '#f9a000'];

export function burstConfetti(anchor: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.setProperty('--c', COLORS[i % COLORS.length]);
    c.style.left = `${Math.random() * 100}%`;
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
    c.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);
    c.style.setProperty('--dur', `${1 + Math.random()}s`);
    c.style.animationDelay = `${Math.random() * 0.3}s`;
    anchor.appendChild(c);
    setTimeout(() => c.remove(), 2600);
  }
}
