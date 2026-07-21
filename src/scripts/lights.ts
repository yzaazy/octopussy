/**
 * Kermis light programs on the header stud bar. A switcher rotates the
 * program class every ~7s (faster in feest-mode). The "inloop" program is
 * JS-sequenced: bulbs turn on pair-by-pair from both ends toward the
 * middle, then everything strobes together.
 */

const PROGRAMS = ['program-looplicht', 'program-renner', 'program-paparazzi', 'program-inloop'];

export function initLights() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const studBar = document.getElementById('stud-bar')!;
  let inloopTimer: ReturnType<typeof setTimeout> | undefined;

  function startInloop() {
    const lit = [...studBar.querySelectorAll<HTMLElement>('.stud.filled')];
    if (!lit.length) return;
    let l = 0;
    let r = lit.length - 1;
    const step = () => {
      if (l <= r) {
        lit[l++].classList.add('on');
        lit[r--].classList.add('on');
        inloopTimer = setTimeout(step, 220);
      } else {
        lit.forEach((s) => s.classList.add('strobe-all'));
        inloopTimer = setTimeout(() => {
          lit.forEach((s) => s.classList.remove('on', 'strobe-all'));
          l = 0;
          r = lit.length - 1;
          inloopTimer = setTimeout(step, 300);
        }, 1400);
      }
    };
    step();
  }

  function stopInloop() {
    clearTimeout(inloopTimer);
    studBar.querySelectorAll('.stud').forEach((s) => s.classList.remove('on', 'strobe-all'));
  }

  let program = 0;
  studBar.classList.add(PROGRAMS[program]);
  const nextProgram = () => {
    stopInloop();
    studBar.classList.remove(PROGRAMS[program]);
    program = (program + 1) % PROGRAMS.length;
    studBar.classList.add(PROGRAMS[program]);
    if (PROGRAMS[program] === 'program-inloop') startInloop();
    setTimeout(nextProgram, studBar.classList.contains('complete') ? 3000 : 7000);
  };
  setTimeout(nextProgram, 7000);
}
