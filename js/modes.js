/*
 * 08. modes.js — режимы башни (ветер, качающаяся башня, гонка со временем), бонусы, «призрак» рекорда,
 * обучение, подсказки в меню, тряска экрана и вибрация.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

// md — текущий особый режим (null = классика); timeLeft — оставшееся время (режим «Гонка»);
// shake — сила тряски экрана; bonus — активный бонус; swayT — время для ветра и качания башни.
let md = null, timeLeft = 0, shake = 0, bonus = null, swayT = 0, overMsg = '', prevH = 0, runPerf = 0, runStreak = 0;

const MODES = [
  {id: 'wind', n: 'Ветер', ic: '💨', d: 'Порывы ветра меняют скорость блока'},
  {id: 'sway', n: 'Качающаяся башня', ic: '🌀', d: 'Башня раскачивается — цель движется'},
  {id: 'time', n: 'Гонка со временем', ic: '⏱️', d: '45 секунд; идеальное попадание добавляет 2 с'}
];
const BONUS_N = {slow: 'Замедление', wide: 'Широкий блок', magnet: 'Магнит', coin: '+8 монет'};
const BONUS_I = {slow: '🐢', wide: '↔️', magnet: '🧲'};

// Дополнительные поля профиля (создаются, если их нет; вызывается и после сброса прогресса)
function ensureNew() {
  P.mb = P.mb || {};      // лучший счёт в каждом режиме (classic, wind, sway, time)
  P.gh = P.gh || {};      // «призрак»: блоки лучшей башни в каждом режиме
  P.dunZ = P.dunZ || {};  // зоны, где уже пройдено подземелье
  ['bonus', 'combo', 'dun', 'dunBest', 'dunClears', 'dunFloors', 'crits', 'dmg', 'spent', 'dayCount', 'time'].forEach(k => { P.st[k] = P.st[k] || 0; });
  P.st.since = P.st.since || todayKey();   // дата первого запуска
  muted = !!P.sfxOff;   // сохранённая настройка «звуковые эффекты выключены»
}
ensureNew();

const buzz = ms => {   // вибрация на телефоне (если поддерживается)
  try { if (P.vib !== false && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
};

// Ветер: коэффициент скорости колеблется порывами; качание: смещение всей башни по горизонтали (растёт с высотой)
const windF = () => md === 'wind' ? Math.max(0.45, Math.min(1.7, 1 + 0.45 * Math.sin(swayT * 1.3) + 0.2 * Math.sin(swayT * 3.1))) : 1;
const swayOff = () => md === 'sway' ? Math.sin(swayT * 1.1) * Math.min(46, (blocks.length - 1) * 4) : 0;

function startMode(id) {
  md = id;
  ch = null;
  pickTheme();
  reset();
  state = 'play';
}

// Бонус выдаётся за каждые 4 идеальных подряд: замедление, широкий блок, магнит (допуск ×2,2) или монеты
function giveBonus() {
  const t = ['slow', 'wide', 'magnet', 'coin'][Math.floor(Math.random() * 4)];
  P.st.bonus++;
  if (t === 'coin') {
    addCoins(8);
    toast('Бонус: +8 монет');
  } else {
    bonus = {t, n: t === 'wide' ? 1 : t === 'slow' ? 4 : 3};
    toast('Бонус: ' + BONUS_N[t]);
  }
  snd(900, 0.25, 'triangle', 0.18, 1500);
}

// Рекорд режима и «призрак» (контур лучшей башни, на которую можно равняться)
const gkey = () => md || 'classic';
function saveRun() {
  if (ch) return;
  const k = gkey();
  if (score > (P.mb[k] || 0)) {
    P.mb[k] = score;
    P.gh[k] = blocks.map(b => [Math.round(b.x), Math.round(b.w)]).slice(0, 160);
  }
}
function drawGhost() {
  const g = P.gh[gkey()];
  if (!g || ch || P.ghost === false || (state !== 'play' && state !== 'pause')) return;
  ctx.strokeStyle = 'rgba(255,255,255,.3)';
  ctx.lineWidth = 1.5;
  for (let i = Math.max(1, blocks.length - 2); i < g.length; i++)
    ctx.strokeRect(g[i][0], BASE_Y - i * BH + cam, g[i][1], BH - 1);
}

// Обучение: подсказки в первой партии (пока не построено 6 блоков)
function tutHint() {
  if (P.tut === 1 || state !== 'play' || ch || md) return '';
  const n = blocks.length - 1;
  if (n >= 6) {
    P.tut = 1;
    addCoins(10);
    toast('Обучение пройдено: +10 монет');
    saveP();
    return '';
  }
  if (n === 0) return 'Нажми (или пробел), когда блок окажется над башней';
  return streak > 0 ? 'Идеально! Такой блок не уменьшается' : 'Всё, что выступает за край, отрезается — целься точнее';
}

// Подсказки в главном меню: «почти получилось» — меняются каждые 4 секунды
function menuHint() {
  if (P.hints === false) return 'Кликай вовремя — строй выше';
  const h = P.hero, L = ['Кликай вовремя — строй выше', 'До уровня ' + (h.lv + 1) + ': ещё ' + (need(h.lv) - h.xp) + ' опыта'];
  if (best() > 0) L.push('Рекорд: ' + best() + ' — побей его!');
  if (P.days > 1) L.push('Серия заходов: ' + P.days + ' дн.');
  if (dayCh().some(c => !P.dch.done[c.id])) L.push('Ждёт дневное испытание');
  if (h.sp > 0) L.push('Есть очки навыка: ' + h.sp);
  return L[Math.floor(Date.now() / 4000) % L.length];
}

// Элементы поверх башни: серия, таймер, ветер, бонус, подсказка обучения
function drawModeHud() {
  if (state !== 'play' && state !== 'pause') return;
  if (streak >= 2) {
    pill(12, 56, 110, 30, false);
    text('Серия ×' + streak, 67, 76, 14, '#ffd9a8');
  }
  if (md === 'time') {
    text('⏱ ' + Math.ceil(timeLeft) + ' с', W / 2, 156, 16, timeLeft < 10 ? '#ff9f8a' : '#ffd9a8');
    bar(W / 2 - 80, 164, 160, timeLeft / 60, timeLeft < 10 ? '#ff9f8a' : '#ffbe82', 6);
  } else if (md === 'wind') {
    text('💨 Ветер', W / 2, 156, 15, '#ffd9a8');
    bar(W / 2 - 60, 164, 120, (windF() - 0.45) / 1.25, '#bfe3ff', 6);
  } else if (md === 'sway')
    text('🌀 Башня качается', W / 2, 156, 15, '#ffd9a8');
  if (bonus)
    text(BONUS_I[bonus.t] + ' ' + BONUS_N[bonus.t] + (bonus.t === 'wide' ? '' : ' ×' + bonus.n), W / 2, 192, 14, '#fff6e2');
  const hint = P.hints === false ? '' : tutHint();
  if (hint) {
    ctx.fillStyle = 'rgba(12,9,30,.55)';
    ctx.beginPath();
    ctx.roundRect(30, 626, 420, 40, 20);
    ctx.fill();
    text(hint, W / 2, 651, 15, '#fff6e2', 'normal');
  }
}

// Экран «Режимы»
function drawModes() {
  dim();
  text('Режимы башни', W / 2, 70, 34, '#fff6e2');
  wrap('Особые правила · монеты ×1,25 · у каждого режима свой рекорд и «призрак»', W / 2, 100, 400, 12, 'rgba(255,241,214,.8)', 15);
  MODES.forEach((m, i) => {
    const y = 130 + i * 100;
    hot.push({x: 40, y, w: 400, h: 90, fn: () => startMode(m.id)});
    card(40, y, 400, 90, false);
    icon(m.ic, 76, y + 45, 36);
    text(m.n, 112, y + 34, 20, '#fff', 'bold', 'left');
    text(m.d, 112, y + 58, 13, 'rgba(255,241,214,.8)', 'normal', 'left');
    text('Рекорд: ' + (P.mb[m.id] || 0), 428, y + 34, 15, '#ffd9a8', 'bold', 'right');
    text('Играть', 428, y + 62, 14, '#ffd9a8', 'normal', 'right');
  });
  wrap('Бонусы (замедление, широкий блок, магнит, монеты) выпадают за каждые 4 идеальных подряд во всех режимах.', W / 2, 452, 400, 12, 'rgba(255,241,214,.7)', 16);
  btn(H - 110, 'Назад', () => state = 'menu');
}

// Новые достижения (значения наград уже с учётом общего уменьшения)
ACH.push(
  A('dg3', '🕳️', 'Первый спуск', 'Пройти 3 этажа подземелья', 40, () => P.st.dunBest >= 3),
  A('dg6', '🏆', 'Хозяин подземелья', 'Пройти подземелье целиком', 120, () => P.st.dunClears >= 1),
  A('dg5', '🗝️', 'Покоритель глубин', 'Пройти подземелье 5 раз', 300, () => P.st.dunClears >= 5),
  A('mdall', '🎛️', 'Попробовал всё', 'Сыграть во все три режима башни', 60, () => ['wind', 'sway', 'time'].every(k => (P.mb[k] || 0) > 0)),
  A('wind25', '💨', 'Против ветра', '25 очков в режиме «Ветер»', 80, () => (P.mb.wind || 0) >= 25),
  A('sway25', '🌀', 'Морская болезнь', '25 очков в «Качающейся башне»', 80, () => (P.mb.sway || 0) >= 25),
  A('time40', '⏱️', 'Успеть всё', '40 очков в «Гонке со временем»', 100, () => (P.mb.time || 0) >= 40),
  A('pu20', '🧲', 'Охотник за бонусами', 'Получить 20 бонусов', 60, () => P.st.bonus >= 20),
  A('combo5', '🔥', 'Комбо', 'Серия из 5 критов подряд в бою', 80, () => P.st.combo >= 5)
);
