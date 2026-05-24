/* ═══════════════════════════════════════════════════════════════════════════
   CosmosEdu — script.js
   Premium Space Education Website
═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── UTILITY ──────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));
const TWO_PI = Math.PI * 2;

/* ─── LOADING SCREEN ────────────────────────────────────────────────────── */
(function initLoading() {
  const screen   = $('#loadingScreen');
  const bar      = $('#loadingBar');
  const text     = $('#loadingText');
  const percent  = $('#loadingPercent');
  const canvas   = $('#loadingCanvas');
  const ctx      = canvas.getContext('2d');

  const msgs = [
    'Menginisialisasi galaksi...',
    'Memuat bintang-bintang...',
    'Menyiapkan tata surya...',
    'Menghitung lintasan orbit...',
    'Membuka event horizon...',
    'Merakit nebula...',
    'Siap untuk menjelajah!',
  ];

  let W, H, stars = [];
  function resizeLoadingCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resizeLoadingCanvas();
  window.addEventListener('resize', resizeLoadingCanvas);

  // Generate stars for loading screen
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      r: rand(0.3, 2),
      speed: rand(0.1, 0.6),
      opacity: rand(0.2, 1),
      twinkle: rand(0, TWO_PI),
    });
  }

  let animId;
  function animateLoading() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, W, H);

    stars.forEach(s => {
      s.twinkle += 0.02;
      const op = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
      ctx.fillStyle = `rgba(200,220,255,${op})`;
      ctx.fill();
      s.y += s.speed;
      if (s.y > H) { s.y = 0; s.x = rand(0, W); }
    });

    animId = requestAnimationFrame(animateLoading);
  }
  animateLoading();

  // Progress simulation
  let prog = 0;
  let msgIdx = 0;
  const interval = setInterval(() => {
    prog += rand(1, 4);
    if (prog > 100) prog = 100;

    bar.style.width = prog + '%';
    percent.textContent = Math.floor(prog) + '%';

    const newIdx = Math.floor((prog / 100) * msgs.length);
    if (newIdx !== msgIdx && newIdx < msgs.length) {
      msgIdx = newIdx;
      text.textContent = msgs[msgIdx];
    }

    if (prog >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        cancelAnimationFrame(animId);
        screen.style.opacity = '0';
        screen.style.transform = 'scale(1.05)';
        screen.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        setTimeout(() => {
          screen.style.display = 'none';
          document.body.style.overflow = '';
          // Trigger AOS after loading
          AOS.refresh();
        }, 800);
      }, 600);
    }
  }, 60);

  document.body.style.overflow = 'hidden';
})();

/* ─── CUSTOM CURSOR ─────────────────────────────────────────────────────── */
(function initCursor() {
  const glow = $('#cursorGlow');
  const dot  = $('#cursorDot');
  if (!glow || !dot) return;
  if (window.innerWidth < 768) return;

  let mx = 0, my = 0, gx = 0, gy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  function animateCursor() {
    gx = lerp(gx, mx, 0.1);
    gy = lerp(gy, my, 0.1);
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Active state on interactive elements
  const interactive = 'a, button, .btn, .planet-card, .fact-card, .glass-card, input, textarea';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactive)) glow.classList.add('active');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactive)) glow.classList.remove('active');
  });
})();

/* ─── AUDIO ─────────────────────────────────────────────────────────────── */
(function initAudio() {
  const btn  = $('#audioBtn');
  const icon = $('#audioIcon');
  if (!btn) return;

  // Generate ambient space sound with Web Audio API
  let audioCtx = null;
  let masterGain = null;
  let nodes = [];
  let playing = false;

  function createSpaceAmbience() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 3);
    masterGain.connect(audioCtx.destination);

    // Deep drone oscillators
    const frequencies = [40, 60, 80, 110, 160];
    frequencies.forEach((freq, i) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // Slow frequency modulation
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.05 + i * 0.02, audioCtx.currentTime);
      lfo.type = 'sine';
      lfoGain.gain.setValueAtTime(freq * 0.02, audioCtx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, audioCtx.currentTime);
      filter.Q.setValueAtTime(1, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.06 - i * 0.008, audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    });

    // Cosmic noise layer
    const bufferSize = audioCtx.sampleRate * 4;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(80, audioCtx.currentTime);
    noiseFilter.Q.setValueAtTime(0.5, audioCtx.currentTime);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();
    nodes.push(noiseSource);
  }

  btn.addEventListener('click', () => {
    if (!playing) {
      if (!audioCtx) createSpaceAmbience();
      else { masterGain.gain.cancelScheduledValues(audioCtx.currentTime); masterGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1); }
      icon.className = 'fas fa-volume-up';
      playing = true;
    } else {
      if (masterGain) { masterGain.gain.cancelScheduledValues(audioCtx.currentTime); masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); }
      icon.className = 'fas fa-volume-mute';
      playing = false;
    }
  });
})();

/* ─── HOVER SOUND ───────────────────────────────────────────────────────── */
(function initHoverSound() {
  let audioCtx = null;
  function playHoverTick() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; } }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  document.querySelectorAll('.btn, .nav-link, .planet-card, .facts-btn').forEach(el => {
    el.addEventListener('mouseenter', playHoverTick);
  });
})();

/* ─── NAVBAR ─────────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = $('#navbar');
  const toggle = $('#navToggle');
  const menu   = $('#navMenu');
  const links  = $$('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  toggle && toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle && toggle.classList.remove('active');
      menu && menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active nav on scroll
  const sections = $$('section[id]');
  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
        links.forEach(l => l.classList.remove('active'));
        const active = $(`a[href="#${sec.id}"]`, navbar);
        if (active) active.classList.add('active');
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
})();

/* ─── BACK TO TOP ───────────────────────────────────────────────────────── */
(function initBackTop() {
  const btn = $('#backTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ─── AOS INIT ──────────────────────────────────────────────────────────── */
AOS.init({
  duration: 900,
  easing: 'ease-out-cubic',
  once: true,
  offset: 80,
  delay: 0,
});

/* ─── GSAP REGISTER ─────────────────────────────────────────────────────── */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── COUNTER ANIMATION ─────────────────────────────────────────────────── */
(function initCounters() {
  const counters = $$('[data-count]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      const duration = 2000;
      const start = performance.now();
      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
})();

/* ─── HERO CANVAS ───────────────────────────────────────────────────────── */
(function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], meteors = [], nebulaClouds = [], planet;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    initObjects();
  }

  function initObjects() {
    // Stars
    stars = [];
    const count = Math.floor((W * H) / 3000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rand(0, W), y: rand(0, H),
        r: rand(0.2, 1.8),
        op: rand(0.3, 1),
        twinkle: rand(0, TWO_PI),
        speed: rand(0.005, 0.02),
        color: Math.random() < 0.1 ? `hsl(${randInt(180,260)},80%,90%)` : 'white',
      });
    }

    // Nebula clouds (background color blobs)
    nebulaClouds = [
      { x: W * 0.15, y: H * 0.3,  r: W * 0.3,  color: 'rgba(107,33,168,0.06)', speed: 0.0003 },
      { x: W * 0.75, y: H * 0.6,  r: W * 0.25, color: 'rgba(26,95,200,0.07)',  speed: -0.0004 },
      { x: W * 0.5,  y: H * 0.2,  r: W * 0.2,  color: 'rgba(236,72,153,0.04)', speed: 0.0002 },
      { x: W * 0.3,  y: H * 0.75, r: W * 0.22, color: 'rgba(0,212,255,0.04)',  speed: -0.0003 },
    ];

    // Planet
    planet = { x: W * 0.82, y: H * 0.28, r: Math.min(W, H) * 0.12, angle: 0 };

    meteors = [];
  }

  // Mouse parallax
  let mouseX = W / 2, mouseY = H / 2;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  function spawnMeteor() {
    if (Math.random() > 0.003) return;
    meteors.push({
      x: rand(-100, W * 0.8),
      y: rand(-50, H * 0.3),
      len: rand(80, 200),
      speed: rand(6, 14),
      op: 1,
      angle: Math.PI / 4 + rand(-0.2, 0.2),
    });
  }

  let frame = 0;
  function draw() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    // Nebula clouds
    nebulaClouds.forEach(c => {
      c.x += Math.sin(frame * c.speed) * 0.3;
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      grad.addColorStop(0, c.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, TWO_PI);
      ctx.fill();
    });

    // Stars with parallax
    const px = (mouseX / W - 0.5) * 20;
    const py = (mouseY / H - 0.5) * 20;
    stars.forEach(s => {
      s.twinkle += s.speed;
      const op = s.op * (0.5 + 0.5 * Math.sin(s.twinkle));
      const depth = s.r / 1.8;
      ctx.beginPath();
      ctx.arc(s.x + px * depth, s.y + py * depth, s.r, 0, TWO_PI);
      ctx.fillStyle = s.color === 'white' ? `rgba(220,230,255,${op})` : s.color.replace(')', `,${op})`).replace('rgb', 'rgba');
      ctx.fill();

      // Cross sparkle for bigger stars
      if (s.r > 1.4) {
        ctx.strokeStyle = `rgba(220,230,255,${op * 0.4})`;
        ctx.lineWidth = 0.5;
        const cr = s.r * 3;
        ctx.beginPath();
        ctx.moveTo(s.x + px * depth - cr, s.y + py * depth);
        ctx.lineTo(s.x + px * depth + cr, s.y + py * depth);
        ctx.moveTo(s.x + px * depth, s.y + py * depth - cr);
        ctx.lineTo(s.x + px * depth, s.y + py * depth + cr);
        ctx.stroke();
      }
    });

    // Planet (Jupiter-like)
    if (planet) {
      planet.angle += 0.002;
      const px2 = planet.x + px * 0.5, py2 = planet.y + py * 0.5;
      ctx.save();
      ctx.translate(px2, py2);

      // Planet glow
      const gGlow = ctx.createRadialGradient(0, 0, planet.r * 0.8, 0, 0, planet.r * 2);
      gGlow.addColorStop(0, 'rgba(26,95,200,0.15)');
      gGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = gGlow;
      ctx.beginPath();
      ctx.arc(0, 0, planet.r * 2, 0, TWO_PI);
      ctx.fill();

      // Planet body
      const gPlanet = ctx.createRadialGradient(-planet.r * 0.3, -planet.r * 0.3, 0, 0, 0, planet.r);
      gPlanet.addColorStop(0, '#4a6fa8');
      gPlanet.addColorStop(0.4, '#1a3060');
      gPlanet.addColorStop(0.7, '#0d2040');
      gPlanet.addColorStop(1, '#050e20');
      ctx.fillStyle = gPlanet;
      ctx.beginPath();
      ctx.arc(0, 0, planet.r, 0, TWO_PI);
      ctx.fill();

      // Atmosphere glow rim
      ctx.strokeStyle = 'rgba(77,166,255,0.3)';
      ctx.lineWidth = planet.r * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, planet.r, 0, TWO_PI);
      ctx.stroke();

      // Cloud bands
      for (let b = 0; b < 5; b++) {
        const by = -planet.r * 0.6 + b * planet.r * 0.3;
        const bh = planet.r * 0.08;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, planet.r, 0, TWO_PI);
        ctx.clip();
        ctx.fillStyle = `rgba(${b % 2 === 0 ? '100,140,200' : '30,70,130'},0.25)`;
        const shift = Math.sin(frame * 0.005 + b) * planet.r * 0.1;
        ctx.fillRect(-planet.r + shift, by, planet.r * 2, bh);
        ctx.restore();
      }

      // Ring
      ctx.save();
      ctx.scale(1, 0.25);
      ctx.strokeStyle = 'rgba(100,150,220,0.35)';
      ctx.lineWidth = planet.r * 0.22;
      ctx.beginPath();
      ctx.arc(0, 0, planet.r * 1.55, 0, TWO_PI);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(80,120,200,0.2)';
      ctx.lineWidth = planet.r * 0.1;
      ctx.beginPath();
      ctx.arc(0, 0, planet.r * 1.78, 0, TWO_PI);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    // Meteors
    spawnMeteor();
    meteors.forEach((m, i) => {
      const ex = m.x + Math.cos(m.angle) * m.len;
      const ey = m.y + Math.sin(m.angle) * m.len;
      const grad = ctx.createLinearGradient(m.x, m.y, ex, ey);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(0.7, `rgba(255,255,255,${m.op * 0.7})`);
      grad.addColorStop(1, `rgba(200,240,255,${m.op})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.op -= 0.025;
      if (m.op <= 0 || m.x > W + 200 || m.y > H + 200) meteors.splice(i, 1);
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

/* ─── ORBIT CANVAS ──────────────────────────────────────────────────────── */
(function initOrbitCanvas() {
  const canvas = $('#orbitCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  const planetData = [
    { name: 'Merkurius', color: '#b0b0b0', r: 5,  orbitR: 0.12, speed: 4.15,  angle: rand(0, TWO_PI) },
    { name: 'Venus',     color: '#e8c85a', r: 8,  orbitR: 0.20, speed: 1.62,  angle: rand(0, TWO_PI) },
    { name: 'Bumi',      color: '#4da6ff', r: 9,  orbitR: 0.28, speed: 1.00,  angle: rand(0, TWO_PI) },
    { name: 'Mars',      color: '#e05a3a', r: 7,  orbitR: 0.37, speed: 0.53,  angle: rand(0, TWO_PI) },
    { name: 'Jupiter',   color: '#c8a870', r: 16, orbitR: 0.50, speed: 0.084, angle: rand(0, TWO_PI) },
    { name: 'Saturnus',  color: '#d4b060', r: 14, orbitR: 0.62, speed: 0.034, angle: rand(0, TWO_PI) },
    { name: 'Uranus',    color: '#7af0f0', r: 11, orbitR: 0.76, speed: 0.012, angle: rand(0, TWO_PI) },
    { name: 'Neptunus',  color: '#4070ff', r: 10, orbitR: 0.90, speed: 0.006, angle: rand(0, TWO_PI) },
  ];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) / 2 * 0.92;

    // Background gradient
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    bg.addColorStop(0, 'rgba(10,20,40,0.8)');
    bg.addColorStop(1, 'rgba(2,4,8,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Orbits
    planetData.forEach(p => {
      const or = maxR * p.orbitR;
      ctx.beginPath();
      ctx.arc(cx, cy, or, 0, TWO_PI);
      ctx.strokeStyle = 'rgba(100,150,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Sun
    const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    sunGrad.addColorStop(0, '#fffbe0');
    sunGrad.addColorStop(0.5, '#ffd700');
    sunGrad.addColorStop(1, '#ff8c00');
    ctx.fillStyle = sunGrad;
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, TWO_PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Planets
    planetData.forEach(p => {
      p.angle += (p.speed * 0.008);
      const or = maxR * p.orbitR;
      const px = cx + Math.cos(p.angle) * or;
      const py = cy + Math.sin(p.angle) * or;

      // Glow
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;

      // Planet body
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, TWO_PI);
      ctx.fillStyle = p.color;
      ctx.fill();

      // Saturn rings
      if (p.name === 'Saturnus') {
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, 0.3);
        ctx.strokeStyle = 'rgba(212,176,96,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.8, 0, TWO_PI);
        ctx.stroke();
        ctx.restore();
      }

      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

/* ─── BLACK HOLE CANVAS ─────────────────────────────────────────────────── */
(function initBlackhole() {
  const canvas = $('#blackholeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], frame = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    initParticles();
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < 180; i++) {
      const angle = rand(0, TWO_PI);
      const dist  = rand(0.35, 0.49) * Math.min(W, H);
      particles.push({
        angle,
        dist,
        speed: rand(0.005, 0.025),
        r: rand(0.5, 2.5),
        op: rand(0.4, 1),
        color: `hsl(${randInt(200, 300)}, 80%, 70%)`,
        infall: rand(0.0002, 0.001),
      });
    }
  }

  function draw() {
    frame++;
    ctx.fillStyle = 'rgba(2,4,8,0.18)';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const minDim = Math.min(W, H);
    const bhR = minDim * 0.18;

    // Accretion disk glow layers
    for (let i = 5; i > 0; i--) {
      const diskR = bhR * (1.3 + i * 0.35);
      const diskH = diskR * 0.12;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.3);
      const g = ctx.createRadialGradient(0, 0, bhR * 0.9, 0, 0, diskR);
      g.addColorStop(0,   `rgba(255,150,50,${0.25 - i * 0.04})`);
      g.addColorStop(0.4, `rgba(255,80,20,${0.15 - i * 0.02})`);
      g.addColorStop(0.7, `rgba(180,50,150,${0.1 - i * 0.015})`);
      g.addColorStop(1,   'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, diskR, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }

    // Gravitational lensing ring
    const lensGrad = ctx.createRadialGradient(cx, cy, bhR * 1.05, cx, cy, bhR * 1.35);
    lensGrad.addColorStop(0,   'rgba(255,200,100,0.6)');
    lensGrad.addColorStop(0.3, 'rgba(255,120,50,0.4)');
    lensGrad.addColorStop(0.7, 'rgba(200,80,200,0.2)');
    lensGrad.addColorStop(1,   'transparent');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, bhR * 1.35, 0, TWO_PI);
    ctx.fill();

    // Event horizon glow
    const ehGrad = ctx.createRadialGradient(cx, cy, bhR * 0.8, cx, cy, bhR * 1.08);
    ehGrad.addColorStop(0, 'transparent');
    ehGrad.addColorStop(0.7, 'rgba(255,140,60,0.5)');
    ehGrad.addColorStop(1,   'rgba(255,200,100,0.0)');
    ctx.fillStyle = ehGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, bhR * 1.08, 0, TWO_PI);
    ctx.fill();

    // Particles spiraling inward
    particles.forEach((p, i) => {
      p.angle += p.speed;
      p.dist  -= p.dist * p.infall;
      p.op    -= 0.001;

      if (p.dist < bhR * 1.05 || p.op < 0) {
        const angle = rand(0, TWO_PI);
        const dist  = rand(0.35, 0.49) * minDim;
        particles[i] = { angle, dist, speed: rand(0.005, 0.025), r: rand(0.5, 2.5), op: rand(0.5, 1), color: `hsl(${randInt(200,300)},80%,70%)`, infall: rand(0.0002, 0.001) };
        return;
      }

      const px = cx + Math.cos(p.angle) * p.dist;
      const py = cy + Math.sin(p.angle) * p.dist * 0.4;

      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, TWO_PI);
      ctx.fillStyle = p.color.replace(')', `,${p.op})`).replace('hsl', 'hsla');
      ctx.fill();
    });

    // Black hole core
    const coreGrad = ctx.createRadialGradient(cx - bhR * 0.2, cy - bhR * 0.2, 0, cx, cy, bhR);
    coreGrad.addColorStop(0,   '#100810');
    coreGrad.addColorStop(0.7, '#000000');
    coreGrad.addColorStop(1,   '#000000');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, bhR, 0, TWO_PI);
    ctx.fill();

    // Photon sphere
    ctx.strokeStyle = 'rgba(255,220,100,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, bhR * 1.5, 0, TWO_PI);
    ctx.stroke();
    ctx.setLineDash([]);

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

/* ─── GALAXY CANVAS ─────────────────────────────────────────────────────── */
(function initGalaxyCanvas() {
  const canvas = $('#galaxyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: rand(0, W), y: rand(0, H),
        r: rand(0.2, 1.5),
        op: rand(0.1, 0.6),
        speed: rand(0.01, 0.04),
        twinkle: rand(0, TWO_PI),
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.twinkle += s.speed;
      const op = s.op * (0.5 + 0.5 * Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
      ctx.fillStyle = `rgba(200,210,255,${op})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

/* ─── FACTS SLIDER ──────────────────────────────────────────────────────── */
(function initFactsSlider() {
  const slider  = $('#factsSlider');
  const prevBtn = $('#factsPrev');
  const nextBtn = $('#factsNext');
  const dotsWrap = $('#factsDots');
  if (!slider) return;

  const cards = $$('.fact-card', slider);
  let current  = 0;
  let perView  = getPerView();
  let total    = Math.ceil(cards.length / perView);
  let autoplay = null;

  function getPerView() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    total = Math.ceil(cards.length / perView);
    for (let i = 0; i < total; i++) {
      const d = document.createElement('span');
      d.className = 'fact-dot' + (i === current ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function updateDots() {

    $$('.fact-dot', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(idx) {
    if (idx < 0) idx = total - 1;
    if (idx >= total) idx = 0;
    current = idx;
    const offset = -(current * 100 / perView) * perView;
    slider.style.transform = `translateX(${offset}%)`;
    updateDots();
  }

  function startAutoplay() {
    autoplay = setInterval(() => goTo(current + 1), 5000);
  }
  function stopAutoplay() {
    clearInterval(autoplay);
  }

  prevBtn && prevBtn.addEventListener('click', () => { stopAutoplay(); goTo(current - 1); startAutoplay(); });
  nextBtn && nextBtn.addEventListener('click', () => { stopAutoplay(); goTo(current + 1); startAutoplay(); });

  // Swipe
  let touchStart = 0;
  slider.addEventListener('touchstart', e => { touchStart = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend',   e => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { stopAutoplay(); goTo(current + (diff > 0 ? 1 : -1)); startAutoplay(); }
  }, { passive: true });

  window.addEventListener('resize', () => {
    const newPV = getPerView();
    if (newPV !== perView) {
      perView = newPV;
      current = 0;
      buildDots();
      goTo(0);
    }
  });

  buildDots();
  startAutoplay();
})();

/* ─── CONTACT FORM ──────────────────────────────────────────────────────── */
(function initContactForm() {
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    setTimeout(() => {
      success && success.classList.add('show');
      btn.innerHTML = '<i class="fas fa-check"></i> Terkirim!';
      form.reset();
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pesan';
        success && success.classList.remove('show');
      }, 4000);
    }, 1500);
  });
})();

/* ─── SMOOTH SCROLL ─────────────────────────────────────────────────────── */
(function initSmoothScroll() {

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const offset = target.offsetTop - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });
})();

/* ─── GSAP ANIMATIONS ───────────────────────────────────────────────────── */
(function initGsap() {
  if (!window.gsap || !window.ScrollTrigger) return;

  // Section title glow on scroll

  $$('.section-title').forEach(el => {
    gsap.fromTo(el,
      { textShadow: '0 0 0px transparent' },
      {
        textShadow: '0 0 40px rgba(77,166,255,0.4)',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 20%', scrub: true }
      }
    );
  });

  // Timeline line draw animation
  const tlLine = $('.timeline-line');
  if (tlLine) {
    gsap.fromTo(tlLine,
      { scaleY: 0, transformOrigin: 'top center' },
      { scaleY: 1, duration: 2, ease: 'none',
        scrollTrigger: { trigger: '.timeline-wrap', start: 'top 80%', end: 'bottom 20%', scrub: true }
      }
    );
  }

  // Planet cards stagger
  gsap.utils.toArray('.planet-card').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: i * 0.07,
        scrollTrigger: { trigger: card, start: 'top 90%', once: true }
      }
    );
  });

  // Hero content entrance
  gsap.fromTo('.hero-title',
    { y: 80, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.5 }
  );
  gsap.fromTo('.hero-subtitle',
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.9 }
  );
})();

/* ─── PERFORMANCE: PAUSE CANVAS ON TAB HIDDEN ───────────────────────────── */
(function initVisibilityPause() {
  document.addEventListener('visibilitychange', () => {
    // Canvases naturally pause since requestAnimationFrame pauses in hidden tabs
  });
})();

/* ─── LAZY LOAD IMAGES ──────────────────────────────────────────────────── */
(function initLazyLoad() {
  const lazyImgs = $$('img[data-src]');
  if (!lazyImgs.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.src = e.target.dataset.src;
        io.unobserve(e.target);
      }
    });
  });
  lazyImgs.forEach(img => io.observe(img));
})();

/* ─── SECTION HIGHLIGHT on SCROLL ──────────────────────────────────────── */
(function initSectionHighlight() {
  const sections = $$('section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1 });
  sections.forEach(s => observer.observe(s));
})();

/* ─── PLANET CARD TILT EFFECT ───────────────────────────────────────────── */
(function initCardTilt() {
  if (window.innerWidth < 768) return;

  $$('.planet-card, .glass-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      const tiltX = dy * -6;
      const tiltY = dx * 6;
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ─── INIT COMPLETE MESSAGE ─────────────────────────────────────────────── */
console.log(
  '%c🚀 CosmosEdu Loaded Successfully!',
  'color:#00d4ff;font-family:monospace;font-size:16px;font-weight:bold;text-shadow:0 0 10px #00d4ff;'
);
console.log(
  '%c✨ Explore the universe through code.',
  'color:#c084fc;font-family:monospace;font-size:12px;'
);

