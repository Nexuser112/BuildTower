/*
 * 09. settings.js — шестерёнка и экран «Настройки» (громкость музыки и эффектов, призрак рекорда, вибрация,
 * тряска экрана, подсказки, сброс прогресса) и экран «Как играть».
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

let setPrev = 'menu';   // экран, на который вернёмся из настроек
let helpPg = 0;

// Уровни громкости 0…1. По умолчанию 0,7 — это прежняя громкость; на максимуме тише/громче в 0…1,43 раза.
const mLevel = () => P.vm === undefined ? 0.7 : P.vm;
const sLevel = () => P.vs === undefined ? 0.7 : P.vs;
const mVol = () => mLevel() / 0.7;
const sVol = () => sLevel() / 0.7;

// Общий регулятор громкости музыки: все треки подключаются к нему
function musicOut() {
  const a = AC;
  if (!MU.mg || MU.mgA !== a) {
    MU.mg = a.createGain();
    MU.mg.connect(a.destination);
    MU.mgA = a;
  }
  MU.mg.gain.value = mVol();
  return MU.mg;
}
function setMusicVol() {
  if (MU.mg)
    MU.mg.gain.value = mVol();
}

function toggleSfx() {
  muted = !muted;
  P.sfxOff = muted;
  saveP();
}
function openSettings() {
  if (state !== 'settings')
    setPrev = state;
  state = 'settings';
}

// Шестерёнка в правом верхнем углу (на экранах, где нет кнопки паузы или «Сдаться»)
function gearBtn() {
  if (['play', 'battle', 'over', 'settings', 'confirm'].includes(state))
    return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  hot.push({x: W - 56, y: 12, w: 44, h: 44, fn: openSettings});
  pill(W - 56, 12, 44, 44, false);
  icon('⚙️', W - 34, 34, 24);
}

function switchBtn(x, y, on) {
  ctx.fillStyle = on ? '#ffbe82' : 'rgba(255,255,255,.2)';
  ctx.beginPath();
  ctx.roundRect(x, y, 56, 28, 14);
  ctx.fill();
  ctx.fillStyle = on ? '#fff6e2' : 'rgba(255,255,255,.7)';
  ctx.beginPath();
  ctx.arc(on ? x + 42 : x + 14, y + 14, 11, 0, 7);
  ctx.fill();
}

// Ползунок 0…1: тянется пальцем/мышью (см. input.js — поле drag у кнопки)
function slider(y, v, setV, done) {
  const x0 = 64, x1 = 416;
  hot.push({x: 40, y: y - 16, w: 400, h: 44, drag: px => setV(Math.max(0, Math.min(1, (px - x0) / (x1 - x0)))), done});
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath();
  ctx.roundRect(x0, y, x1 - x0, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffbe82';
  ctx.beginPath();
  ctx.roundRect(x0, y, Math.max(8, (x1 - x0) * v), 8, 4);
  ctx.fill();
  ctx.fillStyle = '#fff6e2';
  ctx.beginPath();
  ctx.arc(x0 + (x1 - x0) * v, y + 4, 12, 0, 7);
  ctx.fill();
}

function drawSettings() {
  dim();
  text('Настройки', W / 2, 56, 34, '#fff6e2');
  // громкость музыки и эффектов
  [
    ['Музыка', mLevel(), P.music !== false, toggleMusic, v => { P.vm = v; setMusicVol(); }, saveP],
    ['Звуковые эффекты', sLevel(), !muted, toggleSfx, v => { P.vs = v; }, () => { saveP(); snd(660, 0.12, 'sine', 0.2); }]
  ].forEach(([name, v, on, tgl, setV, done], i) => {
    const y = 84 + i * 94;
    card(40, y, 400, 84, false);
    text(name + ' · ' + Math.round(v * 100) + '%', 58, y + 30, 17, '#fff', 'bold', 'left');
    hot.push({x: 366, y: y + 12, w: 66, h: 34, fn: tgl});
    switchBtn(371, y + 15, on);
    slider(y + 62, v, setV, done);
  });
  // переключатели
  [
    ['Призрак рекорда', 'ghost'],
    ['Вибрация', 'vib'],
    ['Тряска экрана', 'shk'],
    ['Подсказки и обучение', 'hints']
  ].forEach(([name, k], i) => {
    const y = 278 + i * 52, on = P[k] !== false;
    card(40, y, 400, 44, false);
    text(name, 58, y + 28, 16, '#fff', 'normal', 'left');
    hot.push({x: 40, y, w: 400, h: 44, fn: () => { P[k] = P[k] === false; saveP(); }});
    switchBtn(371, y + 8, on);
  });
  // сброс прогресса (подтверждение — на следующем экране)
  hot.push({x: 130, y: 496, w: 220, h: 40, fn: () => state = 'confirm'});
  ctx.fillStyle = 'rgba(255,110,100,.16)';
  ctx.beginPath();
  ctx.roundRect(130, 496, 220, 40, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,140,125,.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text('Сбросить прогресс', W / 2, 521, 14, '#ffb3a8');
  text('Игра сохраняется автоматически на этом устройстве.', W / 2, 560, 12, 'rgba(255,241,214,.6)', 'normal');
  btn(H - 110, 'Назад', () => { state = setPrev === 'settings' ? 'menu' : setPrev; });
}

// Экран «Как играть»: короткие страницы с правилами
const HELP = [
  {t: 'Башня', p: ['Кликай (или жми пробел), когда блок окажется над башней. Всё, что выступает за край, отрезается.', 'Идеальное попадание не уменьшает блок. После трёх идеальных подряд блок даже растёт.', 'Промах мимо башни — конец партии. Навык «Страховка» даёт ещё одну попытку.']},
  {t: 'Монеты и герой', p: ['За блоки, задания, достижения и бои ты получаешь монеты и опыт.', 'Опыт повышает уровень Строителя; каждый уровень даёт очко навыка. Вкладывай очки в навыки: точность, удачу, здоровье и другие.', 'В магазине покупай фоны, цвета, эффекты, снаряжение и припасы.']},
  {t: 'Режимы и бонусы', p: ['В «Режимах» — ветер, качающаяся башня и гонка со временем. Монет в них в 1,25 раза больше.', 'За каждые 4 идеальных подряд даётся бонус: замедление, широкий блок, магнит или монеты.', 'Бледный контур — «призрак» твоего рекорда. Его можно выключить в настройках (⚙).']},
  {t: 'Арена и подземелье', p: ['На арене бей монстров: нажми, когда блок совпадёт с основанием. Идеально — критический удар, подряд — комбо.', 'Умения героя открываются по уровню: замах, щит, починка. Значок ⚠ предупреждает о мощном ударе врага.', 'В подземелье 6 боёв подряд, после каждого выбираешь усиление. Награда — в конце, даже если проиграл.']},
  {t: 'Советы', p: ['Заходи каждый день: задания, дневные испытания и серия заходов дают больше монет.', 'Музыка и громкость настраиваются в шестерёнке ⚙. Прогресс сохраняется на этом устройстве.', 'Вложил очки навыка и купил снаряжение — вернись на арену и в подземелье: враги станут легче.']}
];

function drawHelp() {
  dim();
  const pg = HELP[helpPg];
  text('Как играть', W / 2, 56, 34, '#fff6e2');
  text(pg.t, W / 2, 100, 22, '#ffd9a8');
  let y = 140;
  pg.p.forEach(par => {
    const n = wrap(par, 58, y, 364, 15, 'rgba(255,255,255,.92)', 21, 'normal', 'left');
    y += n * 21 + 20;
  });
  pager(helpPg, HELP.length, v => helpPg = v, 540);
  btn(H - 110, 'Назад', () => state = 'menu');
}
