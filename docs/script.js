// En-tête génératif : pavage hexagonal de Truchet, reproductible à partir d'une seed.
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Années d'expérience calculées à partir de la date de début (AAAA-MM).
  const since = document.querySelector('[data-since]');
  if (since) {
    const [year, month] = since.dataset.since.split('-').map(Number);
    const now = new Date();
    since.textContent = now.getFullYear() - year - (now.getMonth() + 1 < month ? 1 : 0);
  }

  const svg = document.querySelector('.hero__art');
  const button = document.querySelector('.art-seed');
  if (!svg || !button) return;

  // Générateur pseudo-aléatoire déterministe (mulberry32).
  function random(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const newSeed = () => 1000 + Math.floor(Math.random() * 9000);
  const fromHash = location.hash.match(/seed=(\d+)/);
  let seed = fromHash ? Number(fromHash[1]) : newSeed();
  let drawn = { width: 0, height: 0 };

  const point = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

  function path(className, d) {
    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('class', className);
    el.setAttribute('d', d);
    return el;
  }

  function draw(animate) {
    const { width, height } = svg.getBoundingClientRect();
    if (!width || !height) return;

    const rand = random(seed);
    const size = width < 500 ? 18 : 22; // rayon (= côté) d'un hexagone
    const colStep = Math.sqrt(3) * size;
    const rowStep = 1.5 * size;
    const radius = size / 2;
    const accentRate = 0.05 + rand() * 0.07;
    let lines = '';
    let accents = '';
    let cells = '';

    for (let row = -1; row * rowStep < height + size; row++) {
      for (let col = -1; col * colStep < width + colStep; col++) {
        const cx = col * colStep + (row % 2 ? colStep / 2 : 0);
        const cy = row * rowStep;
        const corners = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          corners.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
        }

        const accent = rand() < accentRate;
        if (accent) cells += `M${corners.map(point).join('L')}Z`;

        // Trois arcs centrés sur un sommet sur deux : deux orientations possibles par tuile.
        // Chaque arc relie les milieux de deux côtés, les courbes se prolongent d'une tuile à l'autre.
        for (let k = rand() < 0.5 ? 0 : 1; k < 6; k += 2) {
          const center = corners[k];
          const prev = corners[(k + 5) % 6];
          const next = corners[(k + 1) % 6];
          const from = [(prev[0] + center[0]) / 2, (prev[1] + center[1]) / 2];
          const to = [(next[0] + center[0]) / 2, (next[1] + center[1]) / 2];
          let turn = Math.atan2(to[1] - center[1], to[0] - center[0]) - Math.atan2(from[1] - center[1], from[0] - center[0]);
          if (turn > Math.PI) turn -= 2 * Math.PI;
          if (turn < -Math.PI) turn += 2 * Math.PI;
          const arc = `M${point(from)}A${radius} ${radius} 0 0 ${turn > 0 ? 1 : 0} ${point(to)}`;
          if (accent) accents += arc;
          else lines += arc;
        }
      }
    }

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); // couvre la zone même si elle change de taille (impression)
    svg.replaceChildren(path('art__cell', cells), path('art__line', lines), path('art__accent', accents));
    drawn = { width, height };

    if (animate) {
      svg.classList.remove('is-drawn');
      void svg.getBoundingClientRect(); // relance l'animation d'apparition
      svg.classList.add('is-drawn');
    }

    button.querySelector('span').textContent = seed;
    button.setAttribute('aria-label', `Générer un nouveau motif (seed actuelle : ${seed})`);
  }

  let timer;
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (Math.round(width) === Math.round(drawn.width) && Math.round(height) === Math.round(drawn.height)) return;
    clearTimeout(timer);
    timer = setTimeout(() => draw(false), 120);
  }).observe(svg);

  button.hidden = false;
  button.addEventListener('click', () => {
    seed = newSeed();
    history.replaceState(null, '', `#seed=${seed}`);
    draw(true);
  });

  draw(true);
})();
