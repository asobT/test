// === Волшебные Пони — игра для детей 4-8 лет ===

// ---------- Звук (Web Audio synth) ----------
const Sound = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('ponyMute') === '1'; } catch (e) {}

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Один тон с ADSR-конвертом
  function tone({ freq = 440, dur = 0.15, type = 'sine', vol = 0.2, attack = 0.01, release = 0.05 }) {
    const c = getCtx(); if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.linearRampToValueAtTime(0, t0 + dur + release);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + release + 0.05);
  }

  // Свип частоты
  function sweep(fromF, toF, dur = 0.2, type = 'sine', vol = 0.2) {
    const c = getCtx(); if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromF, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, toF), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  // Арпеджио
  function arp(freqs, step = 0.07, vol = 0.25, type = 'triangle') {
    const c = getCtx(); if (!c) return;
    freqs.forEach((f, i) => {
      setTimeout(() => tone({ freq: f, dur: step * 1.2, type, vol }), i * step * 1000);
    });
  }

  // Шумовой "пуф" — для воды/облаков
  function noise(dur = 0.3, vol = 0.15) {
    const c = getCtx(); if (!c) return;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    const gain = c.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }

  const sounds = {
    click:    () => tone({ freq: 660, dur: 0.04, type: 'square', vol: 0.12 }),
    back:     () => sweep(660, 330, 0.1, 'square', 0.12),
    feed:     () => arp([523, 659], 0.07, 0.25),
    wash:     () => { noise(0.4, 0.12); sweep(900, 300, 0.4, 'sine', 0.1); },
    brush:    () => arp([784, 880, 988], 0.05, 0.18, 'sine'),
    play:     () => arp([523, 784, 1047], 0.08, 0.25),
    sleep:    () => sweep(330, 165, 0.6, 'sine', 0.18),
    hug:      () => arp([392, 523, 659, 784], 0.09, 0.28),
    star:     () => arp([784, 988, 1175], 0.05, 0.22),
    apple:    () => tone({ freq: 523, dur: 0.1, type: 'triangle', vol: 0.25 }),
    cloud:    () => tone({ freq: 220, dur: 0.18, type: 'sine', vol: 0.15 }),
    jump:     () => sweep(330, 880, 0.18, 'square', 0.18),
    hit:      () => { tone({ freq: 110, dur: 0.18, type: 'sawtooth', vol: 0.25 }); noise(0.15, 0.1); },
    flip:     () => tone({ freq: 880, dur: 0.04, type: 'square', vol: 0.12 }),
    match:    () => arp([523, 659, 784, 1047], 0.06, 0.3),
    noMatch:  () => sweep(300, 200, 0.2, 'square', 0.18),
    win:      () => arp([523, 659, 784, 1047, 1319, 1568], 0.08, 0.32),
    lose:     () => arp([440, 392, 330, 262], 0.12, 0.25, 'sawtooth'),
    correct:  () => arp([659, 784, 988], 0.07, 0.3),
    wrong:    () => sweep(440, 200, 0.3, 'square', 0.18)
  };

  return {
    play(name) {
      if (muted) return;
      const fn = sounds[name];
      if (fn) try { fn(); } catch (e) {}
    },
    isMuted() { return muted; },
    setMuted(v) {
      muted = !!v;
      try { localStorage.setItem('ponyMute', muted ? '1' : '0'); } catch (e) {}
    }
  };
})();

// ---------- Утилиты ----------
const $ = (id) => document.getElementById(id);
const rand = (a, b) => Math.random() * (b - a) + a;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const TWEMOJI = (hex) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${hex}.svg`;

// ---------- Каталог пони ----------
// Каждая пони — оригинальный персонаж (не использует бренд Hasbro/MLP).
// Параметры конфигурации: цвет тела, гривы, хвоста, глаз, акцент, метка на боку.
const PONIES = [
  {
    id: 'sparkle',
    name: 'Іскорка',
    trait: 'чарівниця',
    body: '#e9d6ff',
    bodyStroke: '#7a4dc7',
    mane: '#6b3a8a',
    maneAccent: '#ff6ec7',
    tail: '#6b3a8a',
    eye: '#7a4dc7',
    horn: true, wings: false,
    cutie: 'star'
  },
  {
    id: 'rainbow',
    name: 'Веселка',
    trait: 'швидка',
    body: '#cfeaff',
    bodyStroke: '#3b8fd1',
    mane: '#ff6e6e',
    maneAccent: '#ffce4d',
    tail: '#6ed47a',
    eye: '#3b8fd1',
    horn: false, wings: true,
    cutie: 'lightning'
  },
  {
    id: 'flower',
    name: 'Квіточка',
    trait: 'добра',
    body: '#ffe7b3',
    bodyStroke: '#c08a2e',
    mane: '#ff9ad6',
    maneAccent: '#ffce4d',
    tail: '#ff9ad6',
    eye: '#5a8a2a',
    horn: false, wings: true,
    cutie: 'flower'
  },
  {
    id: 'pearl',
    name: 'Перлинка',
    trait: 'модниця',
    body: '#ffffff',
    bodyStroke: '#7c5fbf',
    mane: '#7c5fbf',
    maneAccent: '#d9a7ff',
    tail: '#7c5fbf',
    eye: '#3b8fd1',
    horn: true, wings: false,
    cutie: 'gem'
  },
  {
    id: 'sunny',
    name: 'Промінчик',
    trait: 'весела',
    body: '#ffd9a8',
    bodyStroke: '#c47628',
    mane: '#ff8a40',
    maneAccent: '#ffe066',
    tail: '#ff8a40',
    eye: '#9a5a00',
    horn: false, wings: false,
    cutie: 'sun'
  },
  {
    id: 'midnight',
    name: 'Опівніч',
    trait: 'мрійниця',
    body: '#cdb8ff',
    bodyStroke: '#3a2570',
    mane: '#3a2570',
    maneAccent: '#9ad9ff',
    tail: '#3a2570',
    eye: '#5d3fb3',
    horn: true, wings: true,
    cutie: 'moon'
  },
  {
    id: 'pinkie',
    name: 'Пінкі',
    trait: 'святкова',
    kind: 'image',
    poses: [
      'assets/pinkie/pinkie%20(1).svg',
      'assets/pinkie/pinkie%20(2).svg',
      'assets/pinkie/pinkie%20(3).svg',
      'assets/pinkie/pinkie%20(4).svg',
      'assets/pinkie/pinkie%20(5).svg',
      'assets/pinkie/pinkie%20(6).svg',
      'assets/pinkie/pinkie%20(7).svg',
      'assets/pinkie/pinkie%20(8).svg',
      'assets/pinkie/pinkie%20(9).svg',
      'assets/pinkie/pinkie%20(10).svg'
    ],
    // Цвета используются в canvas-аркадах и для рамок мемори
    body: '#ffd6f5',
    bodyStroke: '#ff6ec7',
    mane: '#ff6ec7',
    maneAccent: '#ff9ad6',
    tail: '#ff6ec7',
    eye: '#3b8fd1',
    horn: false, wings: false,
    cutie: 'flower'
  }
];
const ponyById = (id) => PONIES.find(p => p.id === id) || PONIES[0];

// Метки на боку (cutie marks) — простые SVG-рисунки
const CUTIE_MARKS = {
  star: (x, y) => `
    <g transform="translate(${x},${y})">
      <path d="M0 -12 l3 -10 l3 10 l11 0 l-9 7 l3 11 l-8 -7 l-8 7 l3 -11 l-9 -7 z"
            fill="#ffce4d" stroke="#c89b00" stroke-width="1.5"/>
      <circle cx="-12" cy="-4" r="2.5" fill="#ff9ad6"/>
      <circle cx="12" cy="-4" r="2" fill="#9ad9ff"/>
    </g>`,
  lightning: (x, y) => `
    <g transform="translate(${x},${y})">
      <path d="M-2 -14 l8 0 l-3 10 l6 0 l-12 18 l3 -12 l-7 0 z"
            fill="#ffce4d" stroke="#c89b00" stroke-width="1.5"/>
    </g>`,
  flower: (x, y) => `
    <g transform="translate(${x},${y})">
      <circle cx="0" cy="-8" r="5" fill="#ff6ec7"/>
      <circle cx="-7" cy="0" r="5" fill="#ff6ec7"/>
      <circle cx="7" cy="0" r="5" fill="#ff6ec7"/>
      <circle cx="0" cy="7" r="5" fill="#ff6ec7"/>
      <circle cx="0" cy="0" r="3.5" fill="#ffce4d"/>
    </g>`,
  gem: (x, y) => `
    <g transform="translate(${x},${y})">
      <path d="M-10 -4 l5 -8 l10 0 l5 8 l-10 14 z"
            fill="#9ad9ff" stroke="#3b8fd1" stroke-width="1.5"/>
      <path d="M-10 -4 l10 14 l-5 -22 z" fill="#cfeaff"/>
      <path d="M10 -4 l-10 14 l5 -22 z" fill="#fff" opacity=".5"/>
    </g>`,
  sun: (x, y) => `
    <g transform="translate(${x},${y})">
      <circle cx="0" cy="0" r="7" fill="#ffce4d" stroke="#c89b00" stroke-width="1.5"/>
      <g stroke="#c89b00" stroke-width="2" stroke-linecap="round">
        <line x1="0" y1="-12" x2="0" y2="-16"/>
        <line x1="0" y1="12" x2="0" y2="16"/>
        <line x1="-12" y1="0" x2="-16" y2="0"/>
        <line x1="12" y1="0" x2="16" y2="0"/>
        <line x1="-9" y1="-9" x2="-12" y2="-12"/>
        <line x1="9" y1="-9" x2="12" y2="-12"/>
        <line x1="-9" y1="9" x2="-12" y2="12"/>
        <line x1="9" y1="9" x2="12" y2="12"/>
      </g>
    </g>`,
  moon: (x, y) => `
    <g transform="translate(${x},${y})">
      <path d="M-2 -10 a 12 12 0 1 0 0 20 a 9 9 0 1 1 0 -20 z"
            fill="#cfeaff" stroke="#3a2570" stroke-width="1.5"/>
      <circle cx="8" cy="-10" r="1.5" fill="#fff"/>
      <circle cx="12" cy="-2" r="1.5" fill="#fff"/>
      <circle cx="9" cy="8" r="1.5" fill="#fff"/>
    </g>`
};

// ---------- Сохранение прогресса ----------
const SAVE_KEY = 'ponyGameSave_v2';
const defaultSave = {
  selectedPonyId: 'sparkle',
  pony: { food: 70, clean: 70, sleep: 70, happy: 70, lastVisit: Date.now() },
  coloring: {},
  best: { catch: 0, run: 0, memory: null },
  manners: { correct: 0, total: 0 },
  visits: 0
};
let save = loadSave();

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultSave));
    const data = JSON.parse(raw);
    return Object.assign(JSON.parse(JSON.stringify(defaultSave)), data, {
      pony: Object.assign({}, defaultSave.pony, data.pony || {}),
      best: Object.assign({}, defaultSave.best, data.best || {}),
      manners: Object.assign({}, defaultSave.manners, data.manners || {}),
      coloring: data.coloring || {}
    });
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultSave));
  }
}
function saveAll() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
}

// При старте: время прошло — пони чуть проголодалась
(function applyTimeDecay() {
  const now = Date.now();
  const last = save.pony.lastVisit || now;
  const minutes = Math.max(0, (now - last) / 60000);
  // 1 балл за 5 минут (но не больше 60)
  const decay = Math.min(60, minutes / 5);
  save.pony.food = clamp(save.pony.food - decay, 0, 100);
  save.pony.clean = clamp(save.pony.clean - decay * 0.7, 0, 100);
  save.pony.sleep = clamp(save.pony.sleep - decay * 0.6, 0, 100);
  save.pony.happy = clamp(save.pony.happy - decay * 0.4, 0, 100);
  save.pony.lastVisit = now;
  save.visits = (save.visits || 0) + 1;
  saveAll();
})();

// ---------- Навигация ----------
function showScreen(name) {
  // Остановить любую речь при переходе со страницы уроков
  if (typeof Speech !== 'undefined') Speech.cancel();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(name);
  if (el) el.classList.add('active');
  if (name === 'menu') updateMenuBadges();
  if (name === 'care') renderPony();
  if (name === 'choose') renderPonyPicker();
  if (name === 'color') initColoring();
  if (name === 'manners') nextManners();
  if (name === 'arcade') refreshArcadeBest();
  if (name === 'arcCatch') resetCatchOverlay();
  if (name === 'arcRun') resetRunOverlay();
  if (name === 'arcMemory') resetMemoryOverlay();
}
document.querySelectorAll('[data-go]').forEach(b => {
  b.addEventListener('click', () => {
    Sound.play(b.classList.contains('back-btn') ? 'back' : 'click');
    showScreen(b.dataset.go);
  });
});

// Кнопка отключения звука
(function initMuteBtn() {
  const btn = $('muteBtn');
  if (!btn) return;
  const sync = () => {
    btn.textContent = Sound.isMuted() ? '🔇' : '🔊';
    btn.classList.toggle('muted', Sound.isMuted());
  };
  sync();
  btn.addEventListener('click', () => {
    Sound.setMuted(!Sound.isMuted());
    sync();
    if (Sound.isMuted()) {
      if (typeof Speech !== 'undefined') Speech.cancel();
    } else {
      Sound.play('click');
    }
  });
})();

// ---------- Бейджи на меню ----------
function updateMenuBadges() {
  const box = $('menuBadges');
  box.innerHTML = '';
  const items = [];
  if (save.best.catch > 0) items.push({ icon: '2b50', text: `Зірки: ${save.best.catch}` });
  if (save.best.run > 0) items.push({ icon: '1f308', text: `Веселка: ${save.best.run}` });
  if (save.best.memory != null) items.push({ icon: '1f9e0', text: `Пам'ять: ${save.best.memory} ходів` });
  if (save.manners.correct > 0) items.push({ icon: '1f496', text: `Доброта: ${save.manners.correct}` });
  if (save.visits > 1) items.push({ icon: '1f984', text: `Відвідин: ${save.visits}` });
  items.forEach(it => {
    const b = document.createElement('div');
    b.className = 'badge';
    b.innerHTML = `<img src="${TWEMOJI(it.icon)}" alt=""> ${it.text}`;
    box.appendChild(b);
  });
}

// ---------- SVG пони ----------
// Большой SVG-маркап пони: используется на экране ухода и при выборе пони.
// state может содержать happy/clean/sleep/food (для эмоций) и флаги washing/sleeping/animated.
function ponySVGMarkup(p, state = {}) {
  const happy = (state.happy ?? 80) > 60;
  const dirty = (state.clean ?? 80) < 40;
  const tired = (state.sleep ?? 80) < 30 || state.sleeping;
  const sad = (state.happy ?? 80) < 30 || (state.food ?? 80) < 30;
  const anim = state.animated !== false;
  // Анимации — SMIL <animate>. Если выключено или пони спит — не вешаем.
  const blink = (anim && !tired)
    ? '<animate attributeName="ry" values="11;11;1;11" keyTimes="0;0.92;0.96;1" dur="4s" repeatCount="indefinite"/>'
    : '';
  const tailSway = anim
    ? '<animateTransform attributeName="transform" type="rotate" from="-6 90 220" to="6 90 220" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.5 0 0.5 1" values="-6 90 220;6 90 220;-6 90 220" keyTimes="0;0.5;1"/>'
    : '';
  const maneSway = anim
    ? '<animateTransform attributeName="transform" type="rotate" from="-2 290 110" to="2 290 110" dur="3s" repeatCount="indefinite" values="-2 290 110;2 290 110;-2 290 110" keyTimes="0;0.5;1"/>'
    : '';
  const wingFlap = (anim && p.wings)
    ? '<animateTransform attributeName="transform" type="scale" values="1 1; 1 0.85; 1 1" dur="0.7s" repeatCount="indefinite" additive="sum"/>'
    : '';

  const eyeY = 150;
  const eyes = tired
    ? `<path d="M285 ${eyeY} q8 0 16 0" stroke="#2a1845" stroke-width="3.5" fill="none" stroke-linecap="round"/>
       <path d="M315 ${eyeY} q8 0 16 0" stroke="#2a1845" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `
      <ellipse cx="293" cy="${eyeY}" rx="7" ry="11" fill="#fff" stroke="#2a1845" stroke-width="2">${blink}</ellipse>
      <ellipse cx="323" cy="${eyeY}" rx="7" ry="11" fill="#fff" stroke="#2a1845" stroke-width="2">${blink}</ellipse>
      <ellipse cx="293" cy="${eyeY + 2}" rx="5" ry="8" fill="${p.eye}">${blink}</ellipse>
      <ellipse cx="323" cy="${eyeY + 2}" rx="5" ry="8" fill="${p.eye}">${blink}</ellipse>
      <ellipse cx="294" cy="${eyeY - 3}" rx="2" ry="3" fill="#fff"/>
      <ellipse cx="324" cy="${eyeY - 3}" rx="2" ry="3" fill="#fff"/>
      <!-- Ресницы -->
      <path d="M286 ${eyeY - 8} l-4 -3 M293 ${eyeY - 11} l0 -4 M300 ${eyeY - 8} l4 -3"
            stroke="#2a1845" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M316 ${eyeY - 8} l-4 -3 M323 ${eyeY - 11} l0 -4 M330 ${eyeY - 8} l4 -3"
            stroke="#2a1845" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
  const mouth = happy
    ? '<path d="M300 178 q10 8 20 0" stroke="#a32f7a" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : '<path d="M300 184 q10 -6 20 0" stroke="#a32f7a" stroke-width="3" fill="none" stroke-linecap="round"/>';

  const dirtSpots = dirty
    ? `<circle cx="150" cy="220" r="8" fill="#7a5a3a" opacity=".55"/>
       <circle cx="260" cy="245" r="10" fill="#7a5a3a" opacity=".55"/>
       <circle cx="200" cy="270" r="7" fill="#7a5a3a" opacity=".5"/>`
    : '';
  const tear = sad
    ? '<path d="M289 165 q-2 10 0 18 q4 -8 0 -18" fill="#6ec3ff"/>'
    : '';

  // Грива — двухцветные пряди (с лёгким покачиванием)
  const mane = `
    <g>
      ${maneSway}
      <path d="M255 110 q0 -30 25 -45 q-5 25 5 35 q15 -25 35 -25 q-5 25 10 30 q15 -10 30 -5 q-10 25 -25 30 z"
            fill="${p.mane}" stroke="${p.bodyStroke}" stroke-width="2"/>
      <path d="M270 100 q5 -15 18 -22 q-2 15 5 22 z" fill="${p.maneAccent}" opacity=".85"/>
      <path d="M310 80 q5 -10 18 -10 q-3 12 0 20 z" fill="${p.maneAccent}" opacity=".85"/>
    </g>
    <!-- Чёлка -->
    <path d="M260 130 q15 -15 35 -10 q-10 12 -8 25 z" fill="${p.mane}" stroke="${p.bodyStroke}" stroke-width="1.5"/>
  `;
  // Хвост — два слоя, покачивается
  const tailMarkup = `
    <g>
      ${tailSway}
      <path d="M85 230 q-30 -20 -25 -65 q15 35 40 55 z" fill="${p.tail}" stroke="${p.bodyStroke}" stroke-width="2"/>
      <path d="M85 245 q-35 5 -30 35 q22 -10 38 -22 z" fill="${p.maneAccent}" stroke="${p.bodyStroke}" stroke-width="2"/>
    </g>
  `;
  // Рог
  const horn = p.horn ? `
    <path d="M278 80 l6 -38 l6 38 z" fill="${p.maneAccent}" stroke="${p.bodyStroke}" stroke-width="2"/>
    <path d="M281 65 l3 0 M281 55 l3 0" stroke="${p.bodyStroke}" stroke-width="1.5"/>
  ` : '';
  // Крыло (хлопает у пегасов)
  const wing = p.wings ? `
    <g transform="translate(155 250)">
      ${wingFlap}
      <path d="M25 -15 q-30 -10 -55 0 q-5 25 15 35 q20 -8 40 -8 z"
            fill="${p.maneAccent}" stroke="${p.bodyStroke}" stroke-width="2"
            transform="translate(0 0)"/>
      <path d="M-5 -2 l30 0 M-5 6 l25 0" stroke="${p.bodyStroke}" stroke-width="1.5" fill="none"/>
    </g>
  ` : '';

  const cutieMark = (CUTIE_MARKS[p.cutie] || (() => ''))(195, 250);

  return `
    <!-- тень -->
    <ellipse cx="200" cy="295" rx="160" ry="12" fill="#000" opacity=".12"/>
    ${tailMarkup}
    <!-- Тело -->
    <ellipse cx="200" cy="240" rx="105" ry="52" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="3"/>
    <!-- Ноги -->
    <rect x="130" y="270" width="22" height="40" rx="8" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="3"/>
    <rect x="170" y="275" width="22" height="35" rx="8" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="3"/>
    <rect x="220" y="275" width="22" height="35" rx="8" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="3"/>
    <rect x="258" y="270" width="22" height="40" rx="8" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="3"/>
    <!-- Копыта -->
    <ellipse cx="141" cy="312" rx="13" ry="4" fill="${p.bodyStroke}" opacity=".6"/>
    <ellipse cx="181" cy="312" rx="13" ry="4" fill="${p.bodyStroke}" opacity=".6"/>
    <ellipse cx="231" cy="312" rx="13" ry="4" fill="${p.bodyStroke}" opacity=".6"/>
    <ellipse cx="269" cy="312" rx="13" ry="4" fill="${p.bodyStroke}" opacity=".6"/>
    ${dirtSpots}
    ${wing}
    ${cutieMark}
    <!-- Шея + Голова -->
    <path d="M255 200 q30 -15 45 -55 q15 -2 18 22 q2 35 -25 65 z" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="3"/>
    <ellipse cx="310" cy="155" rx="50" ry="46" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="3"/>
    <!-- Морда -->
    <ellipse cx="335" cy="170" rx="22" ry="18" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="2"/>
    <!-- Ноздря -->
    <ellipse cx="345" cy="170" rx="2" ry="3" fill="${p.bodyStroke}" opacity=".7"/>
    ${horn}
    <!-- Уши -->
    <path d="M270 100 l8 -22 l14 10 z" fill="${p.body}" stroke="${p.bodyStroke}" stroke-width="2"/>
    <path d="M275 105 l4 -10 l6 4 z" fill="${p.mane}"/>
    ${mane}
    ${eyes}
    ${mouth}
    <!-- Щёчки -->
    <circle cx="288" cy="178" r="7" fill="#ff9ad6" opacity=".55"/>
    <circle cx="332" cy="180" r="7" fill="#ff9ad6" opacity=".55"/>
    ${tear}
    ${state.washing ? `
      <circle cx="170" cy="220" r="14" fill="#fff" opacity=".8"/>
      <circle cx="260" cy="210" r="18" fill="#fff" opacity=".8"/>
      <circle cx="220" cy="200" r="12" fill="#fff" opacity=".8"/>
      <circle cx="305" cy="125" r="14" fill="#fff" opacity=".8"/>
      <circle cx="120" cy="240" r="10" fill="#fff" opacity=".7"/>
    ` : ''}
    ${state.sleeping ? `
      <text x="350" y="105" font-size="24" fill="${p.bodyStroke}" font-family="Comic Sans MS">Z</text>
      <text x="365" y="85" font-size="20" fill="${p.bodyStroke}" font-family="Comic Sans MS">z</text>
      <text x="378" y="68" font-size="16" fill="${p.bodyStroke}" font-family="Comic Sans MS">z</text>
    ` : ''}
    <!-- Искорки если happy -->
    ${happy ? `
      <text x="80" y="120" font-size="16">✨</text>
      <text x="350" y="60" font-size="14">✨</text>
    ` : ''}
  `;
}

const ponyTransient = { washing: false, sleeping: false };

// Для image-пони — мапим действие в индекс позы (0..N-1)
const PINKIE_POSE_BY_ACTION = {
  idle: 0, feed: 1, wash: 2, brush: 3, play: 4,
  sleep: 5, hug: 6, happy: 7, sad: 8, dance: 9
};

function pickPoseIndex(p, state, override) {
  const N = (p.poses || []).length || 1;
  if (override != null) return override % N;
  if (state.sleeping) return PINKIE_POSE_BY_ACTION.sleep % N;
  if (state.washing) return PINKIE_POSE_BY_ACTION.wash % N;
  if ((state.happy ?? 80) < 30) return PINKIE_POSE_BY_ACTION.sad % N;
  if ((state.happy ?? 80) > 70) return PINKIE_POSE_BY_ACTION.happy % N;
  return 0;
}

function ponyImageMarkup(p, state, override) {
  const idx = pickPoseIndex(p, state, override);
  const src = p.poses[idx];
  return `
    <image href="${src}" xlink:href="${src}" x="40" y="-10" width="320" height="340"
           preserveAspectRatio="xMidYMax meet"/>
  `;
}

function renderPony(actionOverride) {
  const p = ponyById(save.selectedPonyId);
  const state = Object.assign({}, save.pony, ponyTransient);
  if (p.kind === 'image') {
    $('ponySVG').innerHTML = ponyImageMarkup(p, state, actionOverride);
  } else {
    $('ponySVG').innerHTML = ponySVGMarkup(p, state);
  }
  $('ponyName').textContent = p.name;
  $('meterFood').style.width = save.pony.food + '%';
  $('meterClean').style.width = save.pony.clean + '%';
  $('meterSleep').style.width = save.pony.sleep + '%';
  $('meterHappy').style.width = save.pony.happy + '%';
  renderSparkles(save.pony.happy > 70);
}

function renderSparkles(on) {
  const layer = $('sparkles');
  if (!layer) return;
  layer.innerHTML = '';
  if (!on) return;
  const positions = [
    { x: 12, y: 30 }, { x: 86, y: 22 }, { x: 18, y: 70 },
    { x: 90, y: 60 }, { x: 50, y: 18 }
  ];
  positions.forEach((pos, i) => {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.textContent = i % 2 ? '✨' : '⭐';
    s.style.left = pos.x + '%';
    s.style.top = pos.y + '%';
    s.style.animationDelay = (i * 0.4) + 's';
    layer.appendChild(s);
  });
}

// ---------- Экран выбора пони ----------
function renderPonyPicker() {
  const grid = $('ponyPicker');
  grid.innerHTML = '';
  PONIES.forEach(p => {
    const card = document.createElement('button');
    card.className = 'pony-card';
    if (p.id === save.selectedPonyId) card.classList.add('selected');
    // Маленький превью SVG — здоровая пони
    const previewMarkup = p.kind === 'image'
      ? ponyImageMarkup(p, { happy: 80, food: 80, clean: 80, sleep: 80 }, 0)
      : ponySVGMarkup(p, { happy: 80, food: 80, clean: 80, sleep: 80 });
    card.innerHTML = `
      <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
        ${previewMarkup}
      </svg>
      <div class="pony-name">${p.name}</div>
      <div class="pony-trait">${p.trait}</div>
    `;
    card.addEventListener('click', () => {
      save.selectedPonyId = p.id;
      saveAll();
      renderPonyPicker();
      // Чуть подождать и перейти на уход
      setTimeout(() => showScreen('care'), 300);
    });
    grid.appendChild(card);
  });
}

function spawnHearts(emoji = '💖', count = 5) {
  const layer = $('hearts');
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = emoji;
    h.style.left = rand(15, 85) + '%';
    h.style.animationDelay = (i * 0.12) + 's';
    layer.appendChild(h);
    setTimeout(() => h.remove(), 1800);
  }
}
function showEmote(text) {
  const e = $('emote');
  e.textContent = text;
  e.classList.add('show');
  clearTimeout(showEmote._t);
  showEmote._t = setTimeout(() => e.classList.remove('show'), 1200);
}
function ponyAnim(cls) {
  const stage = $('ponySVG');
  stage.classList.remove('pony-bounce', 'pony-shake');
  void stage.offsetWidth;
  stage.classList.add(cls);
}

const careActions = {
  feed: () => {
    Sound.play('feed');
    save.pony.food = clamp(save.pony.food + 25, 0, 100);
    save.pony.happy = clamp(save.pony.happy + 5, 0, 100);
    spawnHearts('🍎', 4);
    showEmote('😋');
    ponyAnim('pony-bounce');
  },
  wash: () => {
    Sound.play('wash');
    save.pony.clean = clamp(save.pony.clean + 30, 0, 100);
    save.pony.happy = clamp(save.pony.happy + 5, 0, 100);
    ponyTransient.washing = true;
    renderPony();
    spawnHearts('💧', 6);
    showEmote('🛁');
    setTimeout(() => { ponyTransient.washing = false; renderPony(); }, 1500);
  },
  brush: () => {
    Sound.play('brush');
    save.pony.clean = clamp(save.pony.clean + 10, 0, 100);
    save.pony.happy = clamp(save.pony.happy + 15, 0, 100);
    spawnHearts('✨', 5);
    showEmote('💁');
    ponyAnim('pony-bounce');
  },
  play: () => {
    Sound.play('play');
    save.pony.happy = clamp(save.pony.happy + 25, 0, 100);
    save.pony.sleep = clamp(save.pony.sleep - 8, 0, 100);
    save.pony.food = clamp(save.pony.food - 5, 0, 100);
    spawnHearts('🎈', 5);
    showEmote('😄');
    ponyAnim('pony-bounce');
  },
  sleep: () => {
    Sound.play('sleep');
    save.pony.sleep = clamp(save.pony.sleep + 35, 0, 100);
    save.pony.happy = clamp(save.pony.happy + 5, 0, 100);
    ponyTransient.sleeping = true;
    renderPony();
    spawnHearts('💤', 4);
    showEmote('😴');
    setTimeout(() => { ponyTransient.sleeping = false; renderPony(); }, 2000);
  },
  hug: () => {
    Sound.play('hug');
    save.pony.happy = clamp(save.pony.happy + 30, 0, 100);
    spawnHearts('💖', 8);
    showEmote('🥰');
    ponyAnim('pony-bounce');
  }
};

document.querySelectorAll('.action-btn').forEach(b => {
  b.addEventListener('click', () => {
    const a = b.dataset.action;
    careActions[a]();
    // Для image-пони показываем соответствующую позу на 1.5 секунды
    const overrideIdx = PINKIE_POSE_BY_ACTION[a];
    renderPony(overrideIdx);
    saveAll();
    if (overrideIdx != null) {
      clearTimeout(renderPony._poseT);
      renderPony._poseT = setTimeout(() => renderPony(), 1800);
    }
  });
});

// Постепенное снижение характеристик
setInterval(() => {
  if (!document.getElementById('care').classList.contains('active')) return;
  save.pony.food = clamp(save.pony.food - 1, 0, 100);
  save.pony.clean = clamp(save.pony.clean - 0.7, 0, 100);
  save.pony.sleep = clamp(save.pony.sleep - 0.8, 0, 100);
  save.pony.happy = clamp(save.pony.happy - 0.5, 0, 100);
  if (save.pony.food < 20 || save.pony.clean < 20 || save.pony.sleep < 20) {
    save.pony.happy = clamp(save.pony.happy - 1, 0, 100);
  }
  renderPony();
  saveAll();
}, 2000);

// Сохраняем при уходе со страницы
window.addEventListener('beforeunload', () => {
  save.pony.lastVisit = Date.now();
  saveAll();
});
setInterval(() => { save.pony.lastVisit = Date.now(); saveAll(); }, 10000);

// ---------- РАСКРАСКА ----------
const palette = [
  '#ff6ec7', '#ff9ad6', '#ffce4d', '#ffb347',
  '#6ed47a', '#9ad9ff', '#6ec3ff', '#b07cff',
  '#d9a7ff', '#ffe28a', '#ff8a80', '#fff', '#2a1845'
];
let currentColor = palette[0];

const colorRegions = [
  { id: 'ground', el: 'ellipse', attrs: { cx: 200, cy: 330, rx: 170, ry: 14 } },
  { id: 'tail1', el: 'path', attrs: { d: 'M85 230 q-30 -20 -20 -60 q15 30 35 50 z' } },
  { id: 'tail2', el: 'path', attrs: { d: 'M85 240 q-30 0 -25 30 q20 -10 35 -20 z' } },
  { id: 'body', el: 'ellipse', attrs: { cx: 200, cy: 240, rx: 105, ry: 55 } },
  { id: 'leg1', el: 'rect', attrs: { x: 130, y: 270, width: 22, height: 40, rx: 8 } },
  { id: 'leg2', el: 'rect', attrs: { x: 170, y: 275, width: 22, height: 35, rx: 8 } },
  { id: 'leg3', el: 'rect', attrs: { x: 220, y: 275, width: 22, height: 35, rx: 8 } },
  { id: 'leg4', el: 'rect', attrs: { x: 258, y: 270, width: 22, height: 40, rx: 8 } },
  { id: 'neck', el: 'path', attrs: { d: 'M250 200 q40 -20 50 -60 q20 0 20 30 q0 50 -50 70 z' } },
  { id: 'head', el: 'ellipse', attrs: { cx: 305, cy: 150, rx: 55, ry: 48 } },
  { id: 'mane', el: 'path', attrs: { d: 'M255 110 q0 -30 25 -45 q-5 25 5 35 q15 -25 35 -25 q-5 25 10 30 q15 -10 30 -5 q-10 25 -25 30 z' } },
  { id: 'horn', el: 'path', attrs: { d: 'M280 80 l8 -38 l8 38 z' } },
  { id: 'ear', el: 'path', attrs: { d: 'M270 95 l8 -20 l14 8 z' } },
  { id: 'cutie', el: 'path', attrs: { d: 'M198 245 l3 -10 l3 10 l10 0 l-8 6 l3 10 l-8 -6 l-8 6 l3 -10 l-8 -6 z' } }
];

function initColoring() {
  const pal = $('palette');
  pal.innerHTML = '';
  palette.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch';
    sw.style.background = c;
    if (c === currentColor) sw.classList.add('active');
    sw.addEventListener('click', () => {
      currentColor = c;
      pal.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
      sw.classList.add('active');
    });
    pal.appendChild(sw);
  });

  const svg = $('colorSVG');
  // Строим SVG из объявления, заполняя из save.coloring
  const ns = 'http://www.w3.org/2000/svg';
  svg.innerHTML = '';
  colorRegions.forEach(r => {
    const node = document.createElementNS(ns, r.el);
    Object.entries(r.attrs).forEach(([k, v]) => node.setAttribute(k, v));
    node.setAttribute('class', 'region');
    node.setAttribute('data-region', r.id);
    node.setAttribute('fill', save.coloring[r.id] || '#fff');
    node.addEventListener('click', () => {
      node.setAttribute('fill', currentColor);
      save.coloring[r.id] = currentColor;
      saveAll();
    });
    svg.appendChild(node);
  });

  // Контурный слой
  const outline = document.createElementNS(ns, 'g');
  outline.setAttribute('class', 'outline');
  outline.innerHTML = `
    <path d="M85 230 q-30 -20 -20 -60 q15 30 35 50 z"/>
    <path d="M85 240 q-30 0 -25 30 q20 -10 35 -20 z"/>
    <ellipse cx="200" cy="240" rx="105" ry="55"/>
    <rect x="130" y="270" width="22" height="40" rx="8"/>
    <rect x="170" y="275" width="22" height="35" rx="8"/>
    <rect x="220" y="275" width="22" height="35" rx="8"/>
    <rect x="258" y="270" width="22" height="40" rx="8"/>
    <path d="M250 200 q40 -20 50 -60 q20 0 20 30 q0 50 -50 70 z"/>
    <ellipse cx="305" cy="150" rx="55" ry="48"/>
    <path d="M255 110 q0 -30 25 -45 q-5 25 5 35 q15 -25 35 -25 q-5 25 10 30 q15 -10 30 -5 q-10 25 -25 30 z"/>
    <path d="M280 80 l8 -38 l8 38 z"/>
    <path d="M270 95 l8 -20 l14 8 z"/>
    <ellipse cx="295" cy="150" rx="4" ry="6" fill="#2a1845" stroke="none"/>
    <ellipse cx="320" cy="150" rx="4" ry="6" fill="#2a1845" stroke="none"/>
    <path d="M290 175 q15 8 28 0" fill="none"/>
  `;
  svg.appendChild(outline);
}

$('resetColor').addEventListener('click', () => {
  document.querySelectorAll('#colorSVG .region').forEach(r => {
    r.setAttribute('fill', '#fff');
    save.coloring[r.dataset.region] = '#fff';
  });
  saveAll();
});
$('randomColor').addEventListener('click', () => {
  document.querySelectorAll('#colorSVG .region').forEach(r => {
    const c = palette[Math.floor(Math.random() * (palette.length - 1))];
    r.setAttribute('fill', c);
    save.coloring[r.dataset.region] = c;
  });
  saveAll();
});

// ---------- АРКАДЫ ----------
function refreshArcadeBest() {
  $('bestCatch').textContent = save.best.catch || 0;
  $('bestRun').textContent = save.best.run || 0;
  $('bestMemory').textContent = save.best.memory != null ? save.best.memory : '∞';
}

// === Аркада 1: Лови звёздочки ===
const canvas = $('arcadeCanvas');
const ctx = canvas.getContext('2d');
const arcade = {
  running: false,
  pony: { x: 200, y: 480, w: 70, h: 60 },
  items: [],
  floats: [],
  score: 0,
  lives: 3,
  spawnTimer: 0,
  leftPressed: false,
  rightPressed: false
};

function resetCatchOverlay() {
  arcade.running = false;
  arcade.score = 0;
  arcade.lives = 3;
  arcade.items = [];
  arcade.floats = [];
  $('arcScore').textContent = 0;
  $('arcLives').textContent = 3;
  $('arcBest').textContent = save.best.catch || 0;
  $('overlayTitle').textContent = 'Лови зірочки!';
  $('overlayText').textContent = 'Рухай поні й збирай зірочки та яблучка. Хмаринок не бійся — вони лоскочуть!';
  $('arcadeOverlay').classList.remove('hidden');
}

function startArcade() {
  arcade.running = true;
  arcade.score = 0;
  arcade.lives = 3;
  arcade.items = [];
  arcade.floats = [];
  arcade.pony.x = canvas.width / 2 - arcade.pony.w / 2;
  arcade.pony.y = canvas.height - 80;
  $('arcScore').textContent = 0;
  $('arcLives').textContent = 3;
  $('arcadeOverlay').classList.add('hidden');
  requestAnimationFrame(arcadeLoop);
}
$('startArcade').addEventListener('click', startArcade);

function spawnItem() {
  const r = Math.random();
  let type;
  if (r < 0.5) type = 'star';
  else if (r < 0.8) type = 'apple';
  else type = 'cloud';
  arcade.items.push({
    type,
    x: rand(20, canvas.width - 40),
    y: -30,
    vy: rand(2, 3.5) + arcade.score * 0.005,
    r: type === 'cloud' ? 26 : 18,
    rot: 0
  });
}

function drawPonyArcade(c, x, y) {
  const p = ponyById(save.selectedPonyId);
  c.save();
  c.translate(x, y);
  c.fillStyle = p.body;
  c.strokeStyle = p.bodyStroke;
  c.lineWidth = 3;
  // Хвост
  c.fillStyle = p.tail;
  c.beginPath();
  c.arc(5, 35, 10, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = p.maneAccent;
  c.beginPath();
  c.arc(2, 42, 6, 0, Math.PI * 2); c.fill();
  // Тело
  c.fillStyle = p.body;
  c.beginPath();
  c.ellipse(35, 35, 32, 22, 0, 0, Math.PI * 2);
  c.fill(); c.stroke();
  // Голова
  c.beginPath();
  c.ellipse(60, 22, 16, 14, 0, 0, Math.PI * 2);
  c.fill(); c.stroke();
  // Грива
  c.fillStyle = p.mane;
  c.beginPath();
  c.arc(50, 16, 8, 0, Math.PI * 2);
  c.arc(45, 22, 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = p.maneAccent;
  c.beginPath();
  c.arc(48, 12, 4, 0, Math.PI * 2); c.fill();
  // Рог / крыло
  if (p.horn) {
    c.fillStyle = p.maneAccent;
    c.strokeStyle = p.bodyStroke;
    c.beginPath();
    c.moveTo(58, 8); c.lineTo(62, -3); c.lineTo(66, 8);
    c.closePath(); c.fill(); c.stroke();
  }
  if (p.wings) {
    c.fillStyle = p.maneAccent;
    c.strokeStyle = p.bodyStroke;
    c.beginPath();
    c.ellipse(28, 30, 14, 7, -0.3, 0, Math.PI * 2);
    c.fill(); c.stroke();
  }
  // Ноги
  c.fillStyle = p.body;
  c.strokeStyle = p.bodyStroke;
  c.fillRect(15, 50, 8, 12);
  c.fillRect(28, 52, 8, 10);
  c.fillRect(45, 52, 8, 10);
  c.strokeRect(15, 50, 8, 12);
  c.strokeRect(28, 52, 8, 10);
  c.strokeRect(45, 52, 8, 10);
  // Глаз
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(64, 22, 3.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = p.eye;
  c.beginPath();
  c.arc(64, 22, 2.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a1845';
  c.beginPath();
  c.arc(64, 22, 1.2, 0, Math.PI * 2); c.fill();
  // Щёчка
  c.fillStyle = '#ff9ad6';
  c.globalAlpha = 0.6;
  c.beginPath();
  c.arc(56, 26, 2.5, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  c.restore();
}

function drawStar(c, x, y, r, color, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = color;
  c.strokeStyle = '#c89b00';
  c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    const a2 = a + Math.PI / 5;
    c.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
  }
  c.closePath();
  c.fill(); c.stroke();
  c.restore();
}

function drawApple(c, x, y, r) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#ff6e6e';
  c.strokeStyle = '#a83030';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill(); c.stroke();
  c.fillStyle = '#6ed47a';
  c.beginPath();
  c.ellipse(4, -r - 2, 5, 3, -0.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff';
  c.globalAlpha = 0.4;
  c.beginPath();
  c.ellipse(-r * 0.4, -r * 0.4, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawCloud(c, x, y, r) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#e0e0e0';
  c.strokeStyle = '#a8a8a8';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(-r * 0.6, 0, r * 0.7, 0, Math.PI * 2);
  c.arc(0, -r * 0.3, r * 0.8, 0, Math.PI * 2);
  c.arc(r * 0.6, 0, r * 0.7, 0, Math.PI * 2);
  c.arc(0, r * 0.2, r * 0.7, 0, Math.PI * 2);
  c.fill(); c.stroke();
  c.restore();
}

function arcadeLoop() {
  if (!arcade.running) return;

  if (arcade.leftPressed) arcade.pony.x -= 6;
  if (arcade.rightPressed) arcade.pony.x += 6;
  arcade.pony.x = clamp(arcade.pony.x, 0, canvas.width - arcade.pony.w);

  arcade.spawnTimer--;
  if (arcade.spawnTimer <= 0) {
    spawnItem();
    arcade.spawnTimer = Math.max(20, 50 - Math.floor(arcade.score / 5));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#b3e5ff');
  grad.addColorStop(0.6, '#ffd6f5');
  grad.addColorStop(1, '#ffe28a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.4;
  drawCloud(ctx, 60, 80, 25);
  drawCloud(ctx, 320, 140, 30);
  drawCloud(ctx, 150, 200, 22);
  ctx.globalAlpha = 1;

  for (let i = arcade.items.length - 1; i >= 0; i--) {
    const it = arcade.items[i];
    it.y += it.vy;
    it.rot += 0.05;
    if (it.type === 'star') drawStar(ctx, it.x, it.y, it.r, '#ffce4d', it.rot);
    else if (it.type === 'apple') drawApple(ctx, it.x, it.y, it.r);
    else drawCloud(ctx, it.x, it.y, it.r);

    const px = arcade.pony.x + arcade.pony.w / 2;
    const py = arcade.pony.y + arcade.pony.h / 2;
    const dx = px - it.x, dy = py - it.y;
    if (Math.sqrt(dx * dx + dy * dy) < arcade.pony.w / 2 + it.r - 8) {
      if (it.type === 'star') {
        Sound.play('star');
        arcade.score += 2;
        arcade.floats.push({ x: it.x, y: it.y, text: '+2', color: '#ffce4d', life: 60 });
      } else if (it.type === 'apple') {
        Sound.play('apple');
        arcade.score += 1;
        arcade.floats.push({ x: it.x, y: it.y, text: '+1', color: '#ff6e6e', life: 60 });
      } else {
        Sound.play('cloud');
        arcade.score = Math.max(0, arcade.score - 1);
        arcade.floats.push({ x: it.x, y: it.y, text: 'хи!', color: '#a8a8a8', life: 60 });
      }
      $('arcScore').textContent = arcade.score;
      arcade.items.splice(i, 1);
      continue;
    }
    if (it.y > canvas.height + 30) {
      if (it.type !== 'cloud') {
        arcade.lives--;
        $('arcLives').textContent = Math.max(0, arcade.lives);
        if (arcade.lives <= 0) { endArcade(); return; }
      }
      arcade.items.splice(i, 1);
    }
  }

  for (let i = arcade.floats.length - 1; i >= 0; i--) {
    const f = arcade.floats[i];
    f.y -= 1; f.life--;
    ctx.save();
    ctx.globalAlpha = Math.max(0, f.life / 60);
    ctx.fillStyle = f.color;
    ctx.font = 'bold 22px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
    if (f.life <= 0) arcade.floats.splice(i, 1);
  }

  drawPonyArcade(ctx, arcade.pony.x, arcade.pony.y);
  requestAnimationFrame(arcadeLoop);
}

function endArcade() {
  arcade.running = false;
  const best = save.best.catch || 0;
  if (arcade.score > best) {
    Sound.play('win');
    save.best.catch = arcade.score;
    save.pony.happy = clamp(save.pony.happy + 10, 0, 100);
    saveAll();
    $('overlayTitle').textContent = 'Новий рекорд! 🌟';
  } else {
    Sound.play(arcade.score > 0 ? 'correct' : 'lose');
    $('overlayTitle').textContent = 'Молодець! 🌟';
  }
  $('overlayText').textContent = `Ти зібрав ${arcade.score} очок. Найкращий: ${save.best.catch}.`;
  $('arcBest').textContent = save.best.catch;
  $('arcadeOverlay').classList.remove('hidden');
}

function bindHold(btnId, target, prop) {
  const b = $(btnId);
  const set = v => target[prop] = v;
  b.addEventListener('mousedown', () => set(true));
  b.addEventListener('mouseup', () => set(false));
  b.addEventListener('mouseleave', () => set(false));
  b.addEventListener('touchstart', e => { e.preventDefault(); set(true); }, { passive: false });
  b.addEventListener('touchend', e => { e.preventDefault(); set(false); }, { passive: false });
  b.addEventListener('touchcancel', () => set(false));
}
bindHold('leftBtn', arcade, 'leftPressed');
bindHold('rightBtn', arcade, 'rightPressed');

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') arcade.leftPressed = true;
  if (e.key === 'ArrowRight') arcade.rightPressed = true;
  if (e.key === ' ' || e.key === 'ArrowUp') runner.jumpRequest = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') arcade.leftPressed = false;
  if (e.key === 'ArrowRight') arcade.rightPressed = false;
});

canvas.addEventListener('touchmove', e => {
  if (!arcade.running) return;
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = (t.clientX - rect.left) * (canvas.width / rect.width);
  arcade.pony.x = clamp(x - arcade.pony.w / 2, 0, canvas.width - arcade.pony.w);
}, { passive: true });

// === Аркада 2: Скачи по радуге (раннер) ===
const runCanvas = $('runCanvas');
const rctx = runCanvas.getContext('2d');
const runner = {
  running: false,
  pony: { x: 60, y: 220, vy: 0, w: 70, h: 60, onGround: true },
  obstacles: [],
  stars: [],
  ground: 240,
  score: 0,
  lives: 3,
  speed: 4,
  spawn: 0,
  starSpawn: 60,
  bgX: 0,
  jumpRequest: false
};

function resetRunOverlay() {
  runner.running = false;
  runner.score = 0;
  runner.lives = 3;
  runner.obstacles = [];
  runner.stars = [];
  runner.speed = 4;
  $('runScore').textContent = 0;
  $('runLives').textContent = 3;
  $('runBest').textContent = save.best.run || 0;
  $('runTitle').textContent = 'Стрибай по веселці!';
  $('runText').textContent = 'Натискай «Стриб!», щоб перестрибувати камінці. Лови зірочки в повітрі!';
  $('runOverlay').classList.remove('hidden');
}

function startRun() {
  runner.running = true;
  runner.score = 0;
  runner.lives = 3;
  runner.obstacles = [];
  runner.stars = [];
  runner.speed = 4;
  runner.pony.y = runner.ground - runner.pony.h;
  runner.pony.vy = 0;
  runner.pony.onGround = true;
  $('runScore').textContent = 0;
  $('runLives').textContent = 3;
  $('runOverlay').classList.add('hidden');
  requestAnimationFrame(runLoop);
}
$('startRun').addEventListener('click', startRun);
$('jumpBtn').addEventListener('click', () => { runner.jumpRequest = true; });
$('jumpBtn').addEventListener('touchstart', e => { e.preventDefault(); runner.jumpRequest = true; }, { passive: false });

function drawRock(c, x, y) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#8a7a5e';
  c.strokeStyle = '#5a4a30';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(15, -25, 30, -10);
  c.quadraticCurveTo(40, 0, 30, 8);
  c.lineTo(0, 8);
  c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = '#a89878';
  c.beginPath();
  c.ellipse(12, -10, 6, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawRainbowGround(c, w, h, gy, scroll) {
  // Радужный пол
  const colors = ['#ff6e6e', '#ffce4d', '#ffe28a', '#6ed47a', '#6ec3ff', '#b07cff'];
  const stripeH = (h - gy) / colors.length;
  colors.forEach((col, i) => {
    c.fillStyle = col;
    c.fillRect(0, gy + i * stripeH, w, stripeH + 1);
  });
  // Линия земли
  c.strokeStyle = 'rgba(255,255,255,.6)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, gy);
  c.lineTo(w, gy);
  c.stroke();
  // Звёздочки на полу для динамики
  c.save();
  c.globalAlpha = 0.4;
  for (let i = 0; i < 6; i++) {
    const x = (i * 90 - (scroll % 90));
    drawStar(c, x, gy + 30 + (i % 2) * 40, 6, '#fff', 0);
  }
  c.restore();
}

function runLoop() {
  if (!runner.running) return;
  rctx.clearRect(0, 0, runCanvas.width, runCanvas.height);
  // Фон
  const grad = rctx.createLinearGradient(0, 0, 0, runCanvas.height);
  grad.addColorStop(0, '#b3e5ff');
  grad.addColorStop(1, '#ffd6f5');
  rctx.fillStyle = grad;
  rctx.fillRect(0, 0, runCanvas.width, runCanvas.height);
  // Облачка
  rctx.globalAlpha = 0.6;
  drawCloud(rctx, ((-runner.bgX * 0.3) % 600 + 600) % 600 - 60, 50, 22);
  drawCloud(rctx, ((-runner.bgX * 0.3 + 250) % 600 + 600) % 600 - 60, 90, 28);
  drawCloud(rctx, ((-runner.bgX * 0.3 + 450) % 600 + 600) % 600 - 60, 60, 18);
  rctx.globalAlpha = 1;

  drawRainbowGround(rctx, runCanvas.width, runCanvas.height, runner.ground, runner.bgX);
  runner.bgX += runner.speed;

  // Прыжок
  if (runner.jumpRequest && runner.pony.onGround) {
    Sound.play('jump');
    runner.pony.vy = -12;
    runner.pony.onGround = false;
  }
  runner.jumpRequest = false;
  runner.pony.vy += 0.6;
  runner.pony.y += runner.pony.vy;
  if (runner.pony.y >= runner.ground - runner.pony.h) {
    runner.pony.y = runner.ground - runner.pony.h;
    runner.pony.vy = 0;
    runner.pony.onGround = true;
  }

  // Спавн препятствий
  runner.spawn--;
  if (runner.spawn <= 0) {
    runner.obstacles.push({ x: runCanvas.width + 20, y: runner.ground - 24, w: 30, h: 24 });
    runner.spawn = Math.floor(rand(70, 130));
  }
  runner.starSpawn--;
  if (runner.starSpawn <= 0) {
    runner.stars.push({ x: runCanvas.width + 20, y: rand(80, runner.ground - 80), r: 14, rot: 0 });
    runner.starSpawn = Math.floor(rand(60, 130));
  }

  // Препятствия
  for (let i = runner.obstacles.length - 1; i >= 0; i--) {
    const o = runner.obstacles[i];
    o.x -= runner.speed;
    drawRock(rctx, o.x, o.y + o.h);
    // Столкновение
    if (
      runner.pony.x + 10 < o.x + o.w &&
      runner.pony.x + runner.pony.w - 10 > o.x &&
      runner.pony.y + runner.pony.h - 6 > o.y
    ) {
      Sound.play('hit');
      runner.lives--;
      $('runLives').textContent = Math.max(0, runner.lives);
      runner.obstacles.splice(i, 1);
      // Подскок
      runner.pony.vy = -8;
      runner.pony.onGround = false;
      if (runner.lives <= 0) { endRun(); return; }
      continue;
    }
    if (o.x + o.w < -10) runner.obstacles.splice(i, 1);
  }

  // Звёзды
  for (let i = runner.stars.length - 1; i >= 0; i--) {
    const s = runner.stars[i];
    s.x -= runner.speed;
    s.rot += 0.07;
    drawStar(rctx, s.x, s.y, s.r, '#ffce4d', s.rot);
    const px = runner.pony.x + runner.pony.w / 2;
    const py = runner.pony.y + runner.pony.h / 2;
    if (Math.hypot(px - s.x, py - s.y) < runner.pony.w / 2 + s.r - 6) {
      Sound.play('star');
      runner.stars.splice(i, 1);
      runner.score += 2;
      $('runScore').textContent = runner.score;
      continue;
    }
    if (s.x < -20) runner.stars.splice(i, 1);
  }

  // +1 за дистанцию каждые 30 кадров
  if (Math.floor(runner.bgX) % 30 === 0) {
    runner.score += 0; // дистанция бонусная — оставляем чистой
  }

  drawPonyArcade(rctx, runner.pony.x, runner.pony.y);

  // Постепенно ускоряемся
  runner.speed = Math.min(8, 4 + runner.score * 0.02);

  requestAnimationFrame(runLoop);
}

function endRun() {
  runner.running = false;
  if (runner.score > (save.best.run || 0)) {
    Sound.play('win');
    save.best.run = runner.score;
    save.pony.happy = clamp(save.pony.happy + 10, 0, 100);
    saveAll();
    $('runTitle').textContent = 'Новий рекорд! 🌈';
  } else {
    Sound.play(runner.score > 0 ? 'correct' : 'lose');
    $('runTitle').textContent = 'Молодець! 🌈';
  }
  $('runText').textContent = `Ти зібрав ${runner.score} очок. Найкращий: ${save.best.run}.`;
  $('runBest').textContent = save.best.run;
  $('runOverlay').classList.remove('hidden');
}

// === Аркада 3: Найди пару ===
const allMemoryItems = [
  ...PONIES.map(p => ({ name: p.id, kind: 'pony', pony: p })),
  { name: 'rainbow', kind: 'emoji', emoji: '1f308' },
  { name: 'star', kind: 'emoji', emoji: '2b50' },
  { name: 'apple', kind: 'emoji', emoji: '1f34e' },
  { name: 'heart', kind: 'emoji', emoji: '1f496' }
];
const MEMORY_PAIRS = 8;
const memory = {
  cards: [],
  flipped: [],
  matched: 0,
  moves: 0,
  busy: false,
  running: false
};

function resetMemoryOverlay() {
  memory.running = false;
  $('memMoves').textContent = 0;
  $('memFound').textContent = 0;
  $('memBest').textContent = save.best.memory != null ? save.best.memory : '∞';
  $('memTitle').textContent = 'Знайди пару!';
  $('memText').textContent = 'Відкривай картки й знаходь однакових поні. Намагайся зробити менше ходів!';
  $('memoryOverlay').classList.remove('hidden');
  $('memoryGrid').innerHTML = '';
}

function startMemory() {
  memory.running = true;
  memory.flipped = [];
  memory.matched = 0;
  memory.moves = 0;
  memory.busy = false;
  $('memMoves').textContent = 0;
  $('memFound').textContent = 0;
  $('memoryOverlay').classList.add('hidden');

  // 8 пар = 16 карт = 4х4 (выбираем случайные 8 из всех)
  const pool = [...allMemoryItems].sort(() => Math.random() - 0.5).slice(0, MEMORY_PAIRS);
  const deck = [];
  pool.forEach(p => { deck.push(p); deck.push(p); });
  // Перемешиваем
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  memory.cards = deck;

  const grid = $('memoryGrid');
  grid.innerHTML = '';
  deck.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'mem-card';
    card.dataset.idx = idx;
    card.dataset.name = item.name;
    let backInner;
    if (item.kind === 'pony') {
      const inner = item.pony.kind === 'image'
        ? ponyImageMarkup(item.pony, { happy: 80, food: 80, clean: 80, sleep: 80 }, 0)
        : ponySVGMarkup(item.pony, { happy: 80, food: 80, clean: 80, sleep: 80 });
      backInner = `<svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
    } else {
      backInner = `<img src="${TWEMOJI(item.emoji)}" alt="">`;
    }
    card.innerHTML = `
      <div class="card-face front">?</div>
      <div class="card-face back">${backInner}</div>
    `;
    card.addEventListener('click', () => onMemoryClick(card));
    grid.appendChild(card);
  });
}
$('startMemory').addEventListener('click', startMemory);

function onMemoryClick(card) {
  if (memory.busy) return;
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;
  Sound.play('flip');
  card.classList.add('flipped');
  memory.flipped.push(card);
  if (memory.flipped.length === 2) {
    memory.moves++;
    $('memMoves').textContent = memory.moves;
    const [a, b] = memory.flipped;
    if (a.dataset.name === b.dataset.name) {
      memory.busy = true;
      setTimeout(() => {
        Sound.play('match');
        a.classList.add('matched');
        b.classList.add('matched');
        memory.flipped = [];
        memory.matched++;
        $('memFound').textContent = memory.matched;
        memory.busy = false;
        if (memory.matched === MEMORY_PAIRS) endMemory();
      }, 500);
    } else {
      memory.busy = true;
      setTimeout(() => {
        Sound.play('noMatch');
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        memory.flipped = [];
        memory.busy = false;
      }, 900);
    }
  }
}

function endMemory() {
  memory.running = false;
  const isBest = save.best.memory == null || memory.moves < save.best.memory;
  if (isBest) {
    Sound.play('win');
    save.best.memory = memory.moves;
    save.pony.happy = clamp(save.pony.happy + 10, 0, 100);
    saveAll();
    $('memTitle').textContent = 'Новий рекорд! 🧠';
  } else {
    Sound.play('correct');
    $('memTitle').textContent = 'Молодець! 🧠';
  }
  $('memText').textContent = `Ти знайшов усі пари за ${memory.moves} ходів. Найкращий: ${save.best.memory}.`;
  $('memBest').textContent = save.best.memory;
  $('memoryOverlay').classList.remove('hidden');
}

// ---------- Озвучка (TTS) ----------
const Speech = (() => {
  const supported = 'speechSynthesis' in window;
  let voice = null;

  function pickVoice() {
    if (!supported) return null;
    const voices = speechSynthesis.getVoices();
    // Шукаємо український голос; пріоритет — жіночий, далі російський, далі будь-який
    const uk = voices.filter(v => /^uk/i.test(v.lang));
    const ru = voices.filter(v => /^ru/i.test(v.lang));
    voice = uk.find(v => /female|жін|polina|natalia|svetlana|olena/i.test(v.name))
         || uk[0]
         || ru.find(v => /female|жен|alyona|milena|katya|tatyana/i.test(v.name))
         || ru[0]
         || voices[0]
         || null;
  }
  if (supported) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  function speak(text, opts = {}) {
    return new Promise((resolve) => {
      if (!supported || Sound.isMuted() || !text) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (voice && voice.lang) || 'uk-UA';
      u.rate = opts.rate ?? 0.95;
      u.pitch = opts.pitch ?? 1.15;
      u.volume = opts.volume ?? 1;
      if (voice) u.voice = voice;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }

  function cancel() {
    if (supported) speechSynthesis.cancel();
  }

  return { speak, cancel, supported };
})();

// ---------- УРОКИ ДОБРОТИ ----------
const situations = [
  {
    emoji: '🎁',
    text: 'Подружка-поні подарувала тобі квіточку. Що ти скажеш?',
    choices: [
      { text: 'Дуже дякую!', correct: true, reply: 'Молодець! Дякувати — це ввічливо! 💖' },
      { text: 'Дай ще!', correct: false, reply: 'Краще сказати «дякую» — це так приємно чути.' },
      { text: 'Нічого не скажу', correct: false, reply: 'Коли дарують подарунок, обов\'язково дякують! 🌸' }
    ]
  },
  {
    emoji: '🍎',
    text: 'У поні лише одне яблучко, а навколо друзі. Що робити?',
    choices: [
      { text: 'Поділитися з друзями', correct: true, reply: 'Ділитися — це чудово! Друзі тебе обіймуть! 🤗' },
      { text: 'З\'їсти все самій', correct: false, reply: 'З друзями все смачніше, якщо поділитися!' },
      { text: 'Сховати яблучко', correct: false, reply: 'Друзі засмутяться. Краще поділитися!' }
    ]
  },
  {
    emoji: '😢',
    text: 'Маленька поні впала й плаче. Як вчинить добра поні?',
    choices: [
      { text: 'Допомогти встати й обійняти', correct: true, reply: 'Ти — справжній друг! 💖' },
      { text: 'Пройти повз', correct: false, reply: 'Друзів не можна залишати в біді!' },
      { text: 'Засміятися', correct: false, reply: 'З чужої біди не сміються. Допоможи!' }
    ]
  },
  {
    emoji: '🌙',
    text: 'Вже пізно, час спати. Що робить вихована поні?',
    choices: [
      { text: 'Чистить зубки й іде в ліжечко', correct: true, reply: 'Молодець! Здоровий сон — це важливо! 😴' },
      { text: 'Стрибає по ліжку', correct: false, reply: 'У ліжку треба спати, а не стрибати!' },
      { text: 'Голосно кричить', correct: false, reply: 'Вночі всі сплять — треба поводитися тихо.' }
    ]
  },
  {
    emoji: '🧸',
    text: 'Погралася з іграшками — що треба зробити?',
    choices: [
      { text: 'Прибрати на місце', correct: true, reply: 'Чудово! Порядок — це гарно! ✨' },
      { text: 'Залишити як є', correct: false, reply: 'Іграшки треба прибирати — інакше на них наступлять!' },
      { text: 'Розкидати по всій хаті', correct: false, reply: 'Так не можна. Порядок — це повага до дому.' }
    ]
  },
  {
    emoji: '🦄',
    text: 'Нова поні прийшла гратися — вона соромиться. Що зробити?',
    choices: [
      { text: 'Привітатися й посміхнутися', correct: true, reply: 'Ти подарував(ла) теплу посмішку! 💖' },
      { text: 'Не помічати', correct: false, reply: 'Новим друзям потрібно трохи уваги!' },
      { text: 'Відвернутися', correct: false, reply: 'Краще посміхнутися — друзів багато не буває!' }
    ]
  },
  {
    emoji: '🥕',
    text: 'Мама-поні приготувала обід. Що кажуть перед їжею?',
    choices: [
      { text: 'Дякую за смачне!', correct: true, reply: 'Яка вихована поні! 🌟' },
      { text: 'Не хочу!', correct: false, reply: 'Мама старалася — варто сказати «дякую».' },
      { text: 'Фу!', correct: false, reply: 'Так казати образливо. Скажи краще «дякую»!' }
    ]
  },
  {
    emoji: '🪥',
    text: 'Ранок у поні-королівстві. Що робить вихована поні після сну?',
    choices: [
      { text: 'Вмивається й чистить зубки', correct: true, reply: 'Чиста поні — здорова поні! ✨' },
      { text: 'Одразу біжить гратися', correct: false, reply: 'Спершу треба вмитися!' },
      { text: 'Нічого не робить', correct: false, reply: 'Поні має дбати про себе щоранку.' }
    ]
  }
];

let mannersIndex = -1;
let mannersAnswered = false;

async function readSituation(text, buttons) {
  // Читаем текст ситуации с подсветкой
  Speech.cancel();
  const textEl = $('situationText');
  textEl.classList.add('speaking');
  await Speech.speak(text, { rate: 0.95 });
  textEl.classList.remove('speaking');
  if (mannersAnswered) return;
  // По очереди читаем варианты с подсветкой каждого
  for (const btn of buttons) {
    if (mannersAnswered) break;
    btn.classList.add('speaking');
    await Speech.speak(btn.dataset.read || btn.textContent, { rate: 0.95 });
    btn.classList.remove('speaking');
    await new Promise(r => setTimeout(r, 150));
  }
}

function nextManners() {
  Speech.cancel();
  mannersAnswered = false;
  $('mannersFeedback').textContent = '';
  $('mannersFeedback').classList.remove('speaking');
  let next;
  do { next = Math.floor(Math.random() * situations.length); } while (next === mannersIndex && situations.length > 1);
  mannersIndex = next;
  const s = situations[mannersIndex];
  $('situationEmoji').textContent = s.emoji;
  $('situationText').textContent = s.text;
  const box = $('situationChoices');
  box.innerHTML = '';
  const shuffled = [...s.choices].sort(() => Math.random() - 0.5);
  const buttons = shuffled.map((ch, idx) => {
    const b = document.createElement('button');
    b.className = 'choice-btn';
    b.textContent = ch.text;
    b.dataset.read = `Варіант ${idx + 1}: ${ch.text}`;
    b.addEventListener('click', async () => {
      mannersAnswered = true;
      Speech.cancel();
      Sound.play(ch.correct ? 'correct' : 'wrong');
      box.querySelectorAll('button').forEach(x => {
        x.disabled = true;
        x.classList.remove('speaking');
      });
      b.classList.add(ch.correct ? 'correct' : 'wrong');
      $('mannersFeedback').textContent = ch.reply;
      save.manners.total++;
      if (ch.correct) {
        save.manners.correct++;
        save.pony.happy = clamp(save.pony.happy + 5, 0, 100);
      }
      saveAll();
      // Озвучиваем ответ
      const fb = $('mannersFeedback');
      fb.classList.add('speaking');
      await Speech.speak(ch.reply, { rate: 0.95 });
      fb.classList.remove('speaking');
      setTimeout(nextManners, 1200);
    });
    box.appendChild(b);
    return b;
  });
  // Читаем после короткой паузы, чтобы DOM успел отрендериться
  setTimeout(() => readSituation(s.text, buttons), 200);
}

// ---------- Старт ----------
showScreen('menu');
