(() => {
  const DESTINO = 'https://shine-link-tree.vercel.app';
  const $ = (id) => document.getElementById(id);
  const body = document.body;

  /* 1. Mostrar la página solo cuando todo cargó (load + fuentes) */
  let shown = false;
  const show = () => {
    if (shown) return; shown = true;
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('ready')));
    boot();
  };
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((r) => addEventListener('load', r, { once: true }));
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([loaded, fonts]).then(show).catch(show);
  setTimeout(show, 4000); // red de seguridad: nunca quedarse en negro

  /* 2. Service worker (para que sea instalable) */
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  /* 3. Fondo de estrellas */
  function stars() {
    const cv = $('stars'), cx = cv.getContext('2d');
    let w, h, s = [];
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * d; h = cv.height = innerHeight * d;
      s = Array.from({ length: Math.round(innerWidth * innerHeight / 9000) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.2 + .3) * d,
        p: Math.random() * 6.28, v: Math.random() * .02 + .005 }));
    };
    size(); addEventListener('resize', size);
    (function tick() {
      cx.clearRect(0, 0, w, h);
      cx.fillStyle = '#fff';
      for (const o of s) {
        o.p += o.v;
        cx.globalAlpha = .25 + .6 * Math.abs(Math.sin(o.p));
        cx.beginPath(); cx.arc(o.x, o.y, o.r, 0, 6.283); cx.fill();
      }
      requestAnimationFrame(tick);
    })();
  }

  /* 4. Pantalla completa (Android/Chrome; en iPhone no existe y se ignora) */
  async function pantallaCompleta() {
    try {
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) await fn.call(el, { navigationUI: 'hide' });
    } catch (_) { /* si falla, continuamos igual */ }
  }

  /* 5. Precarga del link tree, animación y entrada al iframe */
  const SALIDA = 'https://www.google.com';
  let listo;
  function precargar() {
    const f = $('frame');
    listo = new Promise((r) => { f.addEventListener('load', r, { once: true }); setTimeout(r, 8000); });
    f.src = DESTINO;
  }

  async function animar() {
    $('start').hidden = true;
    const sc = $('scan'); sc.hidden = false;
    sc.classList.add('go');
    const fill = $('fill'), t0 = performance.now(), DUR = 2800;
    await new Promise((res) => (function paso(t) {
      const p = Math.min((t - t0) / DUR, 1);
      fill.style.width = (p * 100) + '%';
      p < 1 ? requestAnimationFrame(paso) : res();
    })(t0));
    await listo;                       // espera al link tree ya cargado
    $('app').hidden = false; $('exit').hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $('app').classList.add('show'); sc.classList.add('out');
    }));
    setTimeout(() => { sc.hidden = true; }, 800);
  }

  // Salir: cierra pantalla completa y va a Google (reemplaza el historial)
  async function salir() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement)
        await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } catch (_) {}
    location.replace(SALIDA);
  }

  function boot() {
    stars();
    precargar();
    $('exit').addEventListener('click', salir);
    const instalada = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches
      || navigator.standalone === true;
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Aviso "Añadir a pantalla de inicio": solo iPhone/iPad dentro de Safari
    if (iOS && !instalada) {
      $('ios').hidden = false;
      $('ios-x').addEventListener('click', (e) => { e.stopPropagation(); $('ios').hidden = true; });
    }

    let iniciado = false;
    const iniciar = async () => {
      if (iniciado) return; iniciado = true;
      await pantallaCompleta();   // dentro del gesto del usuario
      animar();
    };
    const st = $('start');
    st.addEventListener('pointerdown', iniciar, { once: true });
    st.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') iniciar(); });

    // App instalada: ya está sin barras, arranca sola
    if (instalada) setTimeout(iniciar, 600);
  }
})();
