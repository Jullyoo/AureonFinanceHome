(function (Aureon) {
  'use strict';

  const DURATION_MS = 650;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countTo(element, to, format) {
    const from = Number(element.dataset.value || 0);
    element.dataset.value = to;
    cancelAnimationFrame(element._frame);

    if (reduceMotion || from === to) {
      element.textContent = format(to);
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = format(from + (to - from) * eased);
      if (progress < 1) element._frame = requestAnimationFrame(step);
    };
    element._frame = requestAnimationFrame(step);
  }

  Aureon.motion = Object.freeze({ countTo, reduceMotion });
})(window.Aureon);
