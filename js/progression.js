/*
 * 05. progression.js — Персонаж «Строитель» (опыт, навыки), испытания (постоянные и дневные) и масштаб наград.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

// ---- Персонаж «Строитель»: уровень, опыт, очки навыков, испытания ----
P.hero = Object.assign({
  xp: 0,
  lv: 1,
  sp: 0,
  s: [0, 0, 0, 0]
}, P.hero || {});
P.ch = P.ch || {};
P.dch = P.dch && P.dch.day === todayKey() ? P.dch : {
  day: todayKey(),
  done: {}
};
P.eq = Object.assign({
  h: 0,
  b: 0,
  t: 0
}, P.eq || {});
P.own = Object.assign({
  h: [0],
  b: [0],
  t: [0]
}, P.own || {});
P.efx = Object.assign({
  own: [0],
  sel: 0
}, P.efx || {});
P.beat = P.beat || {};
P.items = Object.assign({
  heal: 0,
  ward: 0
}, P.items || {});
while (P.hero.s.length < 8)
  P.hero.s.push(0);
let ch = null, chRes = null, saves = 0, runXp = 0, cf = 0;
const need = l => 100 + 20 * l * l, tol = () => (5 + 1.5 * P.hero.s[0]) * (ch && ch.tm || 1) * (bonus && bonus.t === 'magnet' && state === 'play' ? 2.2 : 1) * (state === 'battle' && B && B.dg && D ? D.tm : 1);

function addXP(n) {
  const h = P.hero;
  h.xp += n;
  runXp += n;
  while (h.xp >= need(h.lv)) {
    h.xp -= need(h.lv);
    h.lv++;
    h.sp++;
    toast('Уровень ' + h.lv + '! +1 очко навыка');
    snd(880, 0.3, 'sine', 0.2, 1320);
  }
}

function addCoinsF(b) {
  cf += b * 0.5 * (1 + 0.06 * P.hero.s[2]) * (md ? 1.25 : 1);
  const n = Math.floor(cf);
  cf -= n;
  addCoins(n);
}

const CHAL = [
  {
    id: 'c1',
    n: 'Узкий старт',
    d: 'Стартовый блок 90 px',
    lv: 1,
    sw: 90,
    goal: 20,
    rc: 120,
    rx: 100
  },
  {
    id: 'c2',
    n: 'Скоростной',
    d: 'Скорость ×1.8',
    lv: 2,
    sp: 1.8,
    goal: 25,
    rc: 160,
    rx: 140
  },
  {
    id: 'c3',
    n: 'Только идеально',
    d: 'Любой промах — конец',
    lv: 3,
    exact: 1,
    goal: 8,
    rc: 120,
    rx: 100
  },
  {
    id: 'c4',
    n: 'Ночной штурм',
    d: 'Блок 120 px, скорость ×1.5',
    lv: 4,
    sw: 120,
    sp: 1.5,
    goal: 30,
    rc: 260,
    rx: 220
  },
  {
    id: 'c5',
    n: 'Марафон',
    d: 'Обычные правила',
    lv: 6,
    goal: 70,
    rc: 320,
    rx: 260
  },
  {
    id: 'c6',
    n: 'Точная работа',
    d: 'Допуск идеала ×0.4',
    lv: 8,
    tm: 0.4,
    goal: 30,
    rc: 380,
    rx: 300
  },
  {
    id: 'c7',
    n: 'Вихрь',
    d: 'Скорость ×2.2',
    lv: 10,
    sp: 2.2,
    goal: 25,
    rc: 450,
    rx: 360
  },
  {
    id: 'c8',
    n: 'Мастер башен',
    d: 'Блок 100 px, ×1.6, допуск ×0.6',
    lv: 12,
    sw: 100,
    sp: 1.6,
    tm: 0.6,
    goal: 45,
    rc: 700,
    rx: 500
  },
  {
    id: 'c9',
    n: 'Ураган',
    d: 'Скорость ×2.6',
    lv: 15,
    sp: 2.6,
    goal: 30,
    rc: 800,
    rx: 600
  },
  {
    id: 'c10',
    n: 'Игла',
    d: 'Блок 70 px, допуск ×0.7',
    lv: 18,
    sw: 70,
    tm: 0.7,
    goal: 25,
    rc: 900,
    rx: 700
  },
  {
    id: 'c11',
    n: 'Бесконечность',
    d: 'Обычные правила',
    lv: 22,
    goal: 100,
    rc: 1100,
    rx: 900
  },
  {
    id: 'c12',
    n: 'Легенда',
    d: 'Блок 80 px, ×2, допуск ×0.5',
    lv: 28,
    sw: 80,
    sp: 2,
    tm: 0.5,
    goal: 60,
    rc: 1600,
    rx: 1300
  }
];

const DPOOL = [
  {
    n: 'Узкий мост',
    d: 'Блок 80 px',
    sw: 80,
    goal: 18,
    rc: 90,
    rx: 90
  },
  {
    n: 'Шквал',
    d: 'Скорость ×2',
    sp: 2,
    goal: 16,
    rc: 100,
    rx: 100
  },
  {
    n: 'Тонкая работа',
    d: 'Допуск идеала ×0.35',
    tm: 0.35,
    goal: 22,
    rc: 110,
    rx: 110
  },
  {
    n: 'Две стихии',
    d: 'Блок 110 px, скорость ×1.6',
    sw: 110,
    sp: 1.6,
    goal: 24,
    rc: 130,
    rx: 130
  },
  {
    n: 'Стальные нервы',
    d: 'Скорость ×1.4, допуск ×0.5',
    sp: 1.4,
    tm: 0.5,
    goal: 30,
    rc: 150,
    rx: 150
  },
  {
    n: 'Высотный рейс',
    d: 'Обычные правила',
    goal: 50,
    rc: 140,
    rx: 140
  },
  {
    n: 'Нитка',
    d: 'Блок 60 px',
    sw: 60,
    goal: 15,
    rc: 140,
    rx: 140
  },
  {
    n: 'Молния',
    d: 'Скорость ×2.4',
    sp: 2.4,
    goal: 20,
    rc: 160,
    rx: 160
  },
  {
    n: 'Ювелир',
    d: 'Допуск идеала ×0.3, блок 140 px',
    sw: 140,
    tm: 0.3,
    goal: 26,
    rc: 170,
    rx: 170
  },
  {
    n: 'Гонка на износ',
    d: 'Блок 100 px, скорость ×1.7',
    sw: 100,
    sp: 1.7,
    goal: 35,
    rc: 200,
    rx: 200
  }
];

const dayCh = () => {
  let h = 0;
  for (const c of todayKey())
    h = (h * 31 + c.charCodeAt(0)) % 997;
  return [0, 3, 7].map(k => {
    const i = (h + k) % DPOOL.length;
    return Object.assign({
      id: 'd' + i,
      lv: 1,
      daily: 1
    }, DPOOL[i]);
  });
};

function startChallenge(c) {
  ch = c;
  md = null;
  chRes = null;
  pickTheme();
  reset();
  state = 'play';
}

function winChallenge() {
  state = 'over';
  cur = null;
  chRes = 'win';
  snd(660, 0.5, 'sine', 0.2, 1320);
  if (ch.daily)
    P.st.dwins = (P.st.dwins || 0) + 1;
  const d = ch.daily ? P.dch.done : P.ch;
  if (!d[ch.id]) {
    d[ch.id] = 1;
    addCoins(ch.rc);
    addXP(ch.rx);
    P.hero.sp++;
    toast('Испытание пройдено! +' + ch.rc + ' монет, +1 очко');
  }
  P.st.games++;
  task('games', 1);
  checkAch();
  saveP();
}

const scaleR = (a, k, f) => a.forEach(x => {
  x[f] = Math.max(1, Math.round(x[f] * k));
});
scaleR(TASKS, 0.5, 'r');
scaleR(ACH, 0.5, 'r');
scaleR(CHAL, 0.5, 'rc');
scaleR(DPOOL, 0.5, 'rc');
