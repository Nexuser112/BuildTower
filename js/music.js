/*
 * 03. music.js — Музыка: движок и все мелодии. Ноты генерируются кодом — без аудиофайлов и авторских прав.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

// ---- музыка: оригинальные мелодии, генерируются кодом (никаких файлов и авторских прав) ----
function actx() {
  // создаём аудио-контекст при первом действии игрока (браузеры не разрешают звук раньше)
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended')
      AC.resume();
  } catch (e) {
    return null;   // звука нет (старый браузер) — игра работает без него
  }
  return AC;
}

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const MU = {
  kind: null,
  step: 0,
  next: 0,
  tg: null,
  timer: null,
  tr: null,
  ti: -1,
  loops: 0
};

let noiseBuf = null;

function mnote(t, m, d, type, v, att, lp) {
  const a = AC, o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.value = mtof(m);
  let out = o;
  if (lp) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    o.connect(f);
    out = f;
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  out.connect(g);
  g.connect(MU.tg);
  o.start(t);
  o.stop(t + d + 0.05);
}

function mnoise(t, d, v, hp) {
  const a = AC;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, Math.floor(a.sampleRate * 0.5), a.sampleRate);
    const c = noiseBuf.getChannelData(0);
    for (let i = 0; i < c.length; i++)
      c[i] = Math.random() * 2 - 1;
  }
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noiseBuf;
  f.type = 'highpass';
  f.frequency.value = hp;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f);
  f.connect(g);
  g.connect(MU.tg);
  src.start(t);
  src.stop(t + d + 0.02);
}

function mkick(t) {
  const a = AC, o = a.createOscillator(), g = a.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g);
  g.connect(MU.tg);
  o.start(t);
  o.stop(t + 0.2);
}

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function genMel(seed, scale) {
  // мелодия из гаммы: случайное блуждание по нотам, 8 тактов
  const r = rng(seed), R = [
      [
        [0, 6],
        [8, 4],
        [12, 4]
      ],
      [
        [0, 4],
        [4, 4],
        [8, 4],
        [12, 4]
      ],
      [
        [0, 8],
        [8, 8]
      ],
      [
        [0, 6],
        [6, 2],
        [8, 4],
        [12, 4]
      ],
      [
        [0, 3],
        [4, 3],
        [8, 6],
        [14, 2]
      ]
    ];
  let i = 2 + Math.floor(r() * 2);
  return Array.from({ length: 8 }, () => R[Math.floor(r() * R.length)].map(([st, l]) => {
    i = Math.max(0, Math.min(scale.length - 1, i + Math.floor(r() * 5) - 2));
    return [
      st,
      scale[i],
      l
    ];
  }));
}

function genHook(seed, ch) {
  const r = rng(seed);
  return ch.map(([, tri]) => [0, 3, 6, 10, 12].map(st => [
    st,
    tri[Math.floor(r() * 3)] + 12 + (r() < 0.3 ? 12 : 0)
  ]));
}

const MC = [
  [
    45,
    [57, 60, 64]
  ],
  [
    41,
    [53, 57, 60]
  ],
  [
    48,
    [55, 60, 64]
  ],
  [
    43,
    [55, 59, 62]
  ]
];

const ML = [
  [
    [0, 76, 6],
    [8, 72, 4],
    [12, 74, 4]
  ],
  [
    [0, 72, 6],
    [8, 69, 4],
    [12, 72, 4]
  ],
  [
    [0, 67, 6],
    [8, 72, 4],
    [12, 76, 4]
  ],
  [
    [0, 74, 8],
    [8, 71, 4],
    [12, 67, 4]
  ],
  [
    [0, 79, 4],
    [4, 76, 4],
    [8, 74, 4],
    [12, 72, 4]
  ],
  [
    [0, 77, 4],
    [4, 76, 4],
    [8, 72, 8]
  ],
  [
    [0, 76, 4],
    [4, 79, 4],
    [8, 76, 4],
    [12, 72, 4]
  ],
  [
    [0, 74, 6],
    [8, 71, 4],
    [12, 74, 4]
  ]
];

const BC = [
  [
    45,
    [57, 60, 64]
  ],
  [
    43,
    [55, 59, 62]
  ],
  [
    41,
    [53, 57, 60]
  ],
  [
    40,
    [52, 56, 59]
  ]
];

const HK = [
  [
    [0, 81],
    [3, 79],
    [6, 76],
    [10, 79],
    [12, 81]
  ],
  [
    [0, 79],
    [3, 76],
    [6, 74],
    [10, 76],
    [12, 79]
  ],
  [
    [0, 77],
    [3, 76],
    [6, 72],
    [10, 76],
    [12, 77]
  ],
  [
    [0, 76],
    [3, 80],
    [6, 83],
    [10, 80],
    [12, 76]
  ]
];

const bt = (bpm, ch, seed) => ({
  bpm,
  ch,
  hk: genHook(seed, ch),
  loops: 3
});
// 5 спокойных мелодий для меню (ля минор, до мажор, ре минор, соль мажор, ми минор)
const MENUS = [
  {
    bpm: 84,
    ch: MC,
    ml: ML,
    lead: 'sine',
    arp: [0, 1, 2, 1],
    bell: 1,
    loops: 2
  },
  {
    bpm: 92,
    ch: [
      [
        48,
        [60, 64, 67]
      ],
      [
        43,
        [55, 59, 62]
      ],
      [
        45,
        [57, 60, 64]
      ],
      [
        41,
        [53, 57, 60]
      ]
    ],
    ml: genMel(11, [72, 74, 76, 79, 81, 84, 86]),
    lead: 'triangle',
    arp: [0, 2, 1, 2],
    loops: 2
  },
  {
    bpm: 78,
    ch: [
      [
        38,
        [53, 57, 62]
      ],
      [
        34,
        [58, 62, 65]
      ],
      [
        41,
        [53, 57, 60]
      ],
      [
        36,
        [55, 60, 64]
      ]
    ],
    ml: genMel(23, [74, 77, 79, 81, 84, 86]),
    lead: 'sine',
    arp: [2, 1, 0, 1],
    bell: 1,
    loops: 2
  },
  {
    bpm: 88,
    ch: [
      [
        43,
        [55, 59, 62]
      ],
      [
        40,
        [55, 59, 64]
      ],
      [
        48,
        [55, 60, 64]
      ],
      [
        38,
        [57, 62, 66]
      ]
    ],
    ml: genMel(37, [74, 76, 79, 81, 83, 86]),
    lead: 'triangle',
    arp: [0, 1, 2, 1],
    bell: 1,
    loops: 2
  },
  {
    bpm: 72,
    ch: [
      [
        40,
        [55, 59, 64]
      ],
      [
        48,
        [55, 60, 64]
      ],
      [
        43,
        [55, 59, 62]
      ],
      [
        38,
        [57, 62, 66]
      ]
    ],
    ml: genMel(41, [76, 79, 81, 83, 86, 88]),
    lead: 'sine',
    arp: [0, 2, 1, 0],
    loops: 2
  }
];
// 4 боевых темы (боссам — те же темы, но быстрее и с тарелками)
const BATS = [
  {
    bpm: 150,
    ch: BC,
    hk: HK,
    loops: 3
  },
  bt(156, [
    [
      38,
      [57, 62, 65]
    ],
    [
      34,
      [58, 62, 65]
    ],
    [
      36,
      [55, 60, 64]
    ],
    [
      33,
      [57, 61, 64]
    ]
  ], 7),
  bt(144, [
    [
      40,
      [55, 59, 64]
    ],
    [
      36,
      [55, 60, 64]
    ],
    [
      38,
      [57, 62, 66]
    ],
    [
      35,
      [59, 63, 66]
    ]
  ], 13),
  bt(160, [
    [
      43,
      [58, 62, 67]
    ],
    [
      39,
      [58, 63, 67]
    ],
    [
      41,
      [57, 60, 65]
    ],
    [
      38,
      [57, 62, 66]
    ]
  ], 19)
];

function menuStep(t, s, sd, tr) {
  const bar = Math.floor(s / 16) % tr.ml.length, st = s % 16, [root, tri] = tr.ch[bar % 4];
  if (st === 0)
    tri.forEach(n => mnote(t, n, sd * 17, 'triangle', 0.05, 0.6, 1200));
  if (st === 0 || st === 8)
    mnote(t, root, sd * 7, 'sine', 0.17, 0.03);
  if (st % 2 === 0)
    mnote(t, tri[tr.arp[st / 2 % 4]] + 12, sd * 5, 'triangle', 0.085, 0.01, 2600);
  tr.ml[bar].forEach(([ms, m, len]) => {
    if (ms === st) {
      mnote(t, m, sd * len * 1.7, tr.lead, 0.11, 0.03);
      if (tr.bell)
        mnote(t, m + 12, sd * len, 'sine', 0.025, 0.02);
    }
  });
}

function battleStep(t, s, sd, boss, tr) {
  const bar = Math.floor(s / 16) % 4, st = s % 16, [root, tri] = tr.ch[bar];
  if (st % 4 === 0)
    mkick(t);
  if (st === 4 || st === 12) {
    mnoise(t, 0.14, 0.35, 1500);
    mnote(t, 54, 0.1, 'triangle', 0.18, 0.002);
  }
  if (st % 4 === 2)
    mnoise(t, 0.05, 0.18, 6500);
  else if (boss && st % 2 === 1)
    mnoise(t, 0.03, 0.07, 7500);
  if (st % 2 === 0)
    mnote(t, st % 4 === 2 ? root + 12 : root, sd * 1.8, 'sawtooth', 0.15, 0.005, 520);
  mnote(t, tri[[0, 1, 2, 1, 2, 1, 0, 1][st % 8]] + 12, sd * 1.2, 'square', 0.04, 0.003, 1800);
  tr.hk[bar].forEach(([hs, m]) => {
    if (hs === st)
      mnote(t, m, sd * 2.2, 'sawtooth', 0.075, 0.004, 2800);
  });
}

function pickTrack() {
  const L = MU.kind === 'menu' ? MENUS : BATS;
  let i;
  do {
    i = Math.floor(Math.random() * L.length);
  } while (L.length > 1 && i === MU.ti);
  MU.ti = i;
  MU.tr = L[i];
  MU.step = 0;
  MU.loops = 0;
}

function musicSet(kind) {
  const a = AC;
  if (!a || MU.kind === kind)
    return;
  if (MU.tg) {
    const old = MU.tg;
    old.gain.cancelScheduledValues(a.currentTime);
    old.gain.setValueAtTime(old.gain.value, a.currentTime);
    old.gain.linearRampToValueAtTime(0, a.currentTime + 0.4);
    setTimeout(() => {
      try {
        old.disconnect();
      } catch (e) {
      }
    }, 600);
  }
  MU.kind = kind;
  MU.tg = null;
  clearInterval(MU.timer);
  if (!kind)
    return;
  const g = a.createGain();
  g.gain.setValueAtTime(0, a.currentTime);
  g.gain.linearRampToValueAtTime(0.5, a.currentTime + 0.6);
  g.connect(musicOut());
  MU.tg = g;
  MU.ti = -1;
  pickTrack();
  MU.next = a.currentTime + 0.08;
  MU.timer = setInterval(musicTick, 40);
}

function musicTick() {
  const a = AC;
  if (!a || !MU.kind || !MU.tr)
    return;
  while (MU.next < a.currentTime + 0.25) {
    const boss = MU.kind === 'boss', tr0 = MU.tr;
    if (MU.step > 0 && MU.step % ((tr0.ml ? tr0.ml.length : 4) * 16) === 0 && ++MU.loops >= tr0.loops)
      pickTrack();
    // смена мелодии после нескольких кругов
    const T = MU.tr, sd = 60 / (T.bpm * (boss ? 1.1 : 1)) / 4;
    if (MU.kind === 'menu')
      menuStep(MU.next, MU.step, sd, T);
    else
      battleStep(MU.next, MU.step, sd, boss, T);
    MU.next += sd;
    MU.step++;
  }
}

function fanfare() {
  // победный сигнал: восходящее арпеджио и мажорный аккорд
  const a = actx();
  if (!a)
    return;
  const old = MU.tg, g = a.createGain();
  g.gain.value = 0.55 * sVol();
  g.connect(a.destination);
  MU.tg = g;
  const t = a.currentTime + 0.05;
  [60, 64, 67, 72].forEach((m, i) => {
    mnote(t + i * 0.13, m, 0.5, 'square', 0.1, 0.005, 2400);
    mnote(t + i * 0.13, m + 12, 0.4, 'triangle', 0.08, 0.005);
  });
  [60, 64, 67, 72, 76].forEach(m => mnote(t + 0.62, m, 1.6, 'triangle', 0.11, 0.02, 3000));
  mnote(t + 0.62, 48, 1.6, 'sawtooth', 0.1, 0.01, 600);
  MU.tg = old;
}

function musicSync() {
  const want = P.music === false ? null : state === 'battle' ? B && B.res !== null ? null : B && B.e && B.e.boss ? 'boss' : 'battle' : state === 'play' || state === 'pause' || state === 'over' ? null : 'menu';
  if (AC && AC.state !== 'closed')
    musicSet(want);
}

const toggleMusic = () => {
  P.music = P.music === false;
  saveP();
};

