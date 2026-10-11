/*
 * 15. dungeon.js — режим «Подземелье»: 6 боёв подряд (5 монстров и босс зоны по уровню героя),
 * здоровье переходит между боями, после каждой победы выбираешь одно из трёх усилений.
 * Награда за пройденные этажи выдаётся в конце, даже если герой погиб.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

let D = null;   // состояние текущего похода

// Усиления: каждое меняет параметры похода D
const DG_BOOSTS = [
  {n: 'Острые клинки', d: '+15% к урону', f: d => { d.atk += 0.15; }},
  {n: 'Крепкое тело', d: '+20% к максимальному здоровью и лечение 20%', f: d => { d.m = Math.round(d.m * 1.2); d.hp = Math.min(d.m, d.hp + Math.round(d.m * 0.2)); }},
  {n: 'Охранный знак', d: '+1 щит в каждом бою', f: d => { d.sh++; }},
  {n: 'Зоркий глаз', d: 'Окно критического удара шире на 25%', f: d => { d.tm *= 1.25; }},
  {n: 'Привал', d: 'Лечит 40% здоровья', f: d => { d.hp = Math.min(d.m, d.hp + Math.round(d.m * 0.4)); }},
  {n: 'Золотая жила', d: '+25% монет за поход', f: d => { d.coin += 0.25; }},
  {n: 'Холодная голова', d: 'Ползунок медленнее на 10%', f: d => { d.slow += 0.1; }},
  {n: 'Жажда крови', d: 'Возвращает 10% нанесённого урона', f: d => { d.ls += 0.1; }}
];
const dgOpts = () => DG_BOOSTS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
const dgZone = () => Math.min(4, Math.floor((P.hero.lv - 1) / 10));

// Враги подстраиваются под уровень героя: уровень этажа = уровень героя + смещение этажа.
// Чем выше уровень, тем больше у героя умений и усилений, поэтому враги получают надбавку силы DG_HARD
// (растёт от 0 на 5-м уровне до полной величины на 15-м).
const DG_OFF = [-5, -4, -3, -2, -1, 0];
let DG_HARD = 0.7;

function startDungeon() {
  const z = dgZone(), s = hs(), lv = P.hero.lv;
  const mul = 1 + DG_HARD * Math.min(1, Math.max(0, (lv - 5) / 10));
  const list = ENEMIES.filter(e => e.z === z).map((e, k) => {
    const L = Math.max(1, lv + DG_OFF[k]), st = stat(L, e.boss);
    return Object.assign({}, e, {lv: L, hp: Math.round(st.hp * mul), atk: Math.round(st.atk * mul), def: st.def, rc: Math.round((6 + L * 1.4) * (e.boss ? 4 : 1)), rx: Math.round((15 + L * 6) * (e.boss ? 3 : 1))});
  });
  D = {z, list, f: 0, m: s.hp, hp: s.hp, atk: 0, sh: 0, tm: 1, slow: 0, ls: 0, coin: 0, rc: 0, rx: 0, got: [], opts: [], done: false, sum: null};
  P.st.dun++;
  startFloor();
}

function startFloor() {
  ch = null;
  md = null;
  const e = D.list[D.f], s = hs();
  B = {
    i: e.i, e, eh: e.hp, h: D.hp, m: D.m,
    s: {hp: D.m, atk: Math.round(s.atk * (1 + D.atk)), def: s.def},
    ph: 'aim', t: 0, x: 30, dir: 1, pop: [], sh: P.hero.s[3] + D.sh,
    fe: 0, fh: 0, res: null, rw: '', rw2: '', n: 0,
    cd: {smash: 0, guard: 0, mend: 0}, combo: 0, smash: false, dg: true
  };
  state = 'battle';
}

// Конец боя внутри подземелья (вызывается из endBattle)
function endDungeonFloor(w) {
  B.ph = w ? 'win' : 'lose';
  B.res = w;
  const e = B.e;
  if (w) {
    const k = e.boss ? 0.6 : 0.4, rc = Math.max(1, Math.round(e.rc * k)), rx = Math.max(1, Math.round(e.rx * k));
    D.rc += rc;
    D.rx += rx;
    D.f++;
    D.hp = Math.min(D.m, B.h + Math.round(D.m * 0.15));
    P.st.wins = (P.st.wins || 0) + 1;
    P.st.dunFloors++;
    B.rw = 'Этаж пройден: +' + rc + ' монет и +' + rx + ' опыта (выдадим в конце)';
    if (D.f >= D.list.length)
      finishDungeon(true);
    musicSet(null);
    if (!muted)
      fanfare();
  } else {
    finishDungeon(false);
    musicSet(null);
    snd(300, 0.6, 'sawtooth', 0.18, 50);
  }
  checkAch();
  saveP();
}

function finishDungeon(win) {
  const coins = Math.round(D.rc * (1 + D.coin)) + (win ? 30 * (D.z + 1) : 0), xp = D.rx + (win ? 120 * (D.z + 1) : 0);
  D.sum = {win, coins, xp, floors: D.f};
  D.done = true;
  addCoins(coins);
  addXP(xp);
  P.st.dunBest = Math.max(P.st.dunBest, D.f);
  if (win) {
    P.st.dunClears++;
    if (!P.dunZ[D.z]) {
      P.dunZ[D.z] = 1;
      P.hero.sp++;
      D.sum.sp = true;
    }
  }
}

// Окно результата боя в подземелье (рисуется поверх боя)
function dgResult() {
  const win = B.res === true && D.done;
  if (B.res === true && !D.done) {
    text('Этаж пройден!', W / 2, 250, 40, '#fff');
    text(B.rw, W / 2, 296, 14, '#ffd9a8', 'normal');
    text('Здоровье: ' + Math.ceil(D.hp) + ' / ' + D.m, W / 2, 326, 16, '#8fd694', 'normal');
    btn(384, 'Выбрать усиление', () => {
      D.opts = dgOpts();
      state = 'dgpick';
    });
    return;
  }
  text(win ? 'Подземелье пройдено!' : 'Поход окончен', W / 2, 230, 36, '#fff');
  text('Пройдено этажей: ' + D.sum.floors + ' из ' + D.list.length, W / 2, 276, 18, '#fff', 'normal');
  text('Награда: +' + D.sum.coins + ' монет и +' + D.sum.xp + ' опыта', W / 2, 310, 16, '#ffd9a8', 'normal');
  if (D.sum.sp)
    text('Первое прохождение зоны: +1 очко навыка', W / 2, 338, 14, '#ffd9a8', 'normal');
  btn(384, 'Ещё поход', () => { D = null; B = null; startDungeon(); });
  btn(448, 'В меню', () => { D = null; B = null; state = 'menu'; });
}

// Экран выбора усиления
function drawDgPick() {
  dim();
  text('Выбери усиление', W / 2, 70, 32, '#fff6e2');
  text('Этаж ' + (D.f + 1) + ' из ' + D.list.length + ' · здоровье ' + Math.ceil(D.hp) + ' / ' + D.m, W / 2, 102, 14, 'rgba(255,241,214,.8)', 'normal');
  D.opts.forEach((b, i) => {
    const y = 130 + i * 100;
    hot.push({x: 40, y, w: 400, h: 88, fn: () => { b.f(D); D.got.push(b.n); toast('Усиление: ' + b.n); startFloor(); }});
    card(40, y, 400, 88, false);
    text(b.n, 60, y + 36, 20, '#fff', 'bold', 'left');
    text(b.d, 60, y + 62, 13, 'rgba(255,241,214,.8)', 'normal', 'left');
  });
  text('Выбрано усилений: ' + D.got.length + ' · после каждого боя здоровье +15%', W / 2, 452, 12, 'rgba(255,241,214,.65)', 'normal');
}

// Экран-описание «Подземелье»
function drawDungeon() {
  const z = dgZone(), Z = ZONES[z], list = ENEMIES.filter(e => e.z === z);
  dim();
  text('Подземелье', W / 2, 64, 34, '#fff6e2');
  text(Z.n, W / 2, 96, 18, '#ffd9a8');
  ['6 боёв подряд: 5 монстров и босс зоны.', 'Враги подстраиваются под уровень твоего героя.', 'Здоровье почти не восстанавливается между боями.', 'После каждой победы — одно из трёх усилений.', 'Награда выдаётся в конце, даже если проиграешь.'].forEach((t, i) => text(t, W / 2, 132 + i * 22, 14, 'rgba(255,255,255,.9)', 'normal'));
  list.forEach((e, i) => icon(e.ic, 70 + i * 68, 290, 34));
  text('Локация зависит от уровня Строителя (сейчас: зона ' + (z + 1) + ').', W / 2, 340, 12, 'rgba(255,241,214,.7)', 'normal');
  text('Лучший поход: ' + P.st.dunBest + ' из 6 этажей · полных прохождений: ' + P.st.dunClears, W / 2, 372, 14, '#ffd9a8', 'normal');
  btn(412, 'Войти в подземелье', startDungeon);
  btn(H - 110, 'Назад', () => state = 'menu');
}
