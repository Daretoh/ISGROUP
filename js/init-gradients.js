document.addEventListener('DOMContentLoaded', () => {
  const gradients = [];

  function initSectionGradient(selector, colors, opts = {}) {
    const el = document.querySelector(selector);
    if (!el) return null;
    const bg = new GradientBg(el, { colors, ...opts });
    gradients.push(bg);
    return bg;
  }

  /* Hero: naranja vibrante + blanco + azul + negro */
  initSectionGradient('#hero', ['#FF6B00', '#FFFFFF', '#0055FF', '#0A0A0A'], {
    amp: 200,
    freqX: 10e-5,
    freqY: 20e-5,
    density: [0.04, 0.10],
  });

  /* ISperformance: negro + naranja + blanco + azul oscuro */
  initSectionGradient('#isperformance', ['#0A0A0A', '#FF6B00', '#FFFFFF', '#0033AA'], {
    amp: 250,
    freqX: 12e-5,
    freqY: 25e-5,
    density: [0.04, 0.10],
  });
});
