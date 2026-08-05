// InnovaServi — mejoras propias (navbar al scroll, contadores).
// Convive con ../js/main.js (reveal, menú, carrusel).
document.addEventListener('DOMContentLoaded', function () {

  // Navbar: sólida al bajar
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Contadores animados en la banda de estadísticas
  var stats = document.querySelectorAll('.iv-stat-num[data-count]');
  if (stats.length) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !seen) {
          seen = true;
          stats.forEach(function (el) {
            var target = parseInt(el.getAttribute('data-count'), 10) || 0;
            var start = null, dur = 1400;
            function tick(ts) {
              if (!start) start = ts;
              var p = Math.min((ts - start) / dur, 1);
              var val = Math.floor((1 - Math.pow(1 - p, 3)) * target); // easeOutCubic
              el.textContent = val;
              if (p < 1) requestAnimationFrame(tick);
              else el.textContent = target;
            }
            requestAnimationFrame(tick);
          });
        }
      });
    }, { threshold: 0.4 });
    var band = document.querySelector('.iv-stats');
    if (band) io.observe(band);
  }

});
