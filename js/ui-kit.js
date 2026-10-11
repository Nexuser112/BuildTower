/*
 * 12. ui-kit.js — Базовые элементы интерфейса на canvas: текст, кнопки, карточки, полосы, заголовок с градиентом.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

// ---- отрисовка ----
function drawBlock(x, y, w, h) {
  ctx.fillStyle = `hsl(${ h },62%,58%)`;
  ctx.fillRect(x, y, w, BH - 1);
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(x, y + BH - 6, w, 5);
}

const fontOf = (size, weight) => `${ weight || 'bold' } ${ size }px "Trebuchet MS",system-ui,sans-serif`;

function text(s, x, y, size, color, weight, align) {
  ctx.font = fontOf(size, weight);
  if (!align || align === 'center') {
    // длинный центрированный текст сжимаем, чтобы он не вылезал за края экрана (важно на телефонах)
    const mw = 2 * Math.min(x, W - x) - 8, w = ctx.measureText(String(s)).width;
    if (w > mw && mw > 0)
      ctx.font = fontOf(Math.max(8, size * mw / w), weight);
  }
  ctx.textAlign = align || 'center';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// Текст с переносом по словам внутри ширины maxW; возвращает число строк
function wrap(s, x, y, maxW, size, color, lineH, weight, align) {
  ctx.font = fontOf(size, weight || 'normal');
  const lines = [];
  let cur = '';
  for (const w of String(s).split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else
      cur = t;
  }
  lines.push(cur);
  lines.forEach((l, i) => text(l, x, y + i * lineH, size, color, weight || 'normal', align));
  return lines.length;
}

function btn(y, label, fn) {
  const x = W / 2 - 110, w = 220, h = 48;
  hot.push({
    x,
    y,
    w,
    h,
    fn
  });
  ctx.fillStyle = 'rgba(255,255,255,.93)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  text(label, W / 2, y + 31, 20, '#1a2036');
}

const dim = () => {
  ctx.fillStyle = 'rgba(8,6,20,.62)';
  ctx.fillRect(0, 0, W, H);
};

// ---- заголовок и значок счёта: один мягкий тёплый градиент, чтобы всё держалось в одной гамме ----
const TF = '"Lilita One","Trebuchet MS",system-ui,sans-serif';

function fancy(s, x, y, size, c0, c1) {
  ctx.save();
  ctx.font = `${ size }px ${ TF }`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.14;
  ctx.strokeStyle = 'rgba(28,14,48,.55)';
  ctx.strokeText(s, x, y);
  const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y);
  g.addColorStop(0, c0 || '#fff6e2');
  g.addColorStop(1, c1 || '#ffc58c');
  ctx.shadowColor = 'rgba(255,196,140,.45)';
  ctx.shadowBlur = size * 0.3;
  ctx.fillStyle = g;
  ctx.fillText(s, x, y);
  ctx.restore();
}

function title() {
  fancy('BuildTower', W / 2, 150, 68);
  fancy('Game', W / 2, 198, 42, '#ffe9d2', '#f5a6a0');
}

const icon = (e, x, y, sz) => text(e, x, y + sz * 0.35, sz, '#fff', 'normal');

function pager(cur, n, set, y) {
  hot.push({
    x: 130,
    y,
    w: 50,
    h: 36,
    fn: () => set((cur + n - 1) % n)
  }, {
    x: 300,
    y,
    w: 50,
    h: 36,
    fn: () => set((cur + 1) % n)
  });
  pill(130, y, 50, 36, false);
  pill(300, y, 50, 36, false);
  text('‹', 155, y + 26, 24, '#fff');
  text('›', 325, y + 26, 24, '#fff');
  text(cur + 1 + ' / ' + n, W / 2, y + 24, 16, '#fff6e2', 'normal');
}

function bar(x, y, w, f, c, h) {
  h = h || 9;
  ctx.fillStyle = 'rgba(255,255,255,.15)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  if (f > 0) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(h, w * Math.min(1, f)), h, h / 2);
    ctx.fill();
  }
}

function card(x, y, w, h, on) {
  ctx.fillStyle = on ? 'rgba(255,214,160,.22)' : 'rgba(255,255,255,.1)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
}

function pill(x, y, w, h, on) {
  ctx.fillStyle = on ? 'rgba(255,241,214,.92)' : 'rgba(255,255,255,.14)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
}
