/*
 * 17. hud.js — Элементы поверх игры (монеты, уведомления, счёт) и главная функция отрисовки draw().
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

function chip() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = 'rgba(12,9,30,.4)';
  ctx.beginPath();
  ctx.roundRect(12, 14, 110, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#ffd08a';
  ctx.beginPath();
  ctx.arc(31, 31, 9, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#e8a45c';
  ctx.beginPath();
  ctx.arc(31, 31, 5, 0, 7);
  ctx.fill();
  text(String(P.coins), 48, 37, 17, '#fff6e2', 'bold', 'left');
}

function drawToast() {
  const t = toasts[0];
  if (!t)
    return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, (2.6 - t.life) * 4, t.life * 3));
  ctx.fillStyle = 'rgba(12,9,30,.62)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 190, 142, 380, 32, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,160,.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(t.t, W / 2, 163, 15, '#fff6e2', 'normal');
  ctx.restore();
}

function drawScore() {
  const bw = 176, bh = 96, x = W / 2 - bw / 2, y = 34, k = 1 + pulse * 0.12;
  ctx.save();
  ctx.translate(W / 2, y + bh / 2);
  ctx.scale(k, k);
  ctx.translate(-W / 2, -(y + bh / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, 28);
  ctx.fillStyle = 'rgba(12,9,30,.4)';
  ctx.fill();
  const g = ctx.createLinearGradient(x, y, x, y + bh);
  g.addColorStop(0, 'rgba(255,241,214,.85)');
  g.addColorStop(1, 'rgba(255,190,130,.35)');
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = g;
  ctx.stroke();
  fancy(String(score), W / 2, y + 60, 56);
  text('Рекорд ' + best(), W / 2, y + 84, 15, 'rgba(255,241,214,.85)', 'normal');
  ctx.restore();
}

function draw() {
  hot = [];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (shake > 0 && P.shk !== false)
    ctx.translate((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 10 * shake);
  const p = Math.min(1, blocks.length / 60), g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mx(T.top, T.topH, p));
  g.addColorStop(1, mx(T.bot, T.botH, p));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(255,255,255,${ 0.15 + p * 0.75 })`;
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, (s.y + cam * 0.15) % H, s.r, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = T.ground;
  ctx.fillRect(0, BASE_Y + BH + cam, W, H);
  drawGhost();
  const so = swayOff();
  blocks.forEach((b, i) => drawBlock(b.x + so, BASE_Y - i * BH + cam, b.w, hueOf(i)));
  if (flash > 0 && blocks.length > 1) {
    const b = blocks[blocks.length - 1];
    ctx.fillStyle = `rgba(255,255,255,${ flash * 0.7 })`;
    ctx.fillRect(b.x + so, BASE_Y - (blocks.length - 1) * BH + cam, b.w, BH - 1);
  }
  if (cur)
    drawBlock(cur.x, BASE_Y - cur.n * BH + cam, cur.w, hueOf(cur.n));
  for (const q of pieces)
    drawBlock(q.x, q.y + cam, q.w, q.h);
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, p.l);
    ctx.fillStyle = p.k === 1 ? 'hsl(35,100%,70%)' : p.k === 2 ? `hsl(${ p.h },80%,65%)` : '#fff1d6';
    if (p.k === 3) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + cam - 5);
      ctx.lineTo(p.x + 3, p.y + cam);
      ctx.lineTo(p.x, p.y + cam + 5);
      ctx.lineTo(p.x - 3, p.y + cam);
      ctx.fill();
    } else if (p.k === 4) {
      ctx.strokeStyle = '#bfe3ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y + cam, 4, 0, 7);
      ctx.stroke();
    } else if (p.k === 5) {
      ctx.fillStyle = `hsl(${ p.h },90%,65%)`;
      ctx.fillRect(p.x - 2, p.y + cam - 2, 4, 4);
    } else
      ctx.fillRect(p.x - 3, p.y + cam - 2, p.k === 2 ? 7 : 5, p.k === 2 ? 4 : 5);
    ctx.globalAlpha = 1;
  }
  for (const m of msgs)
    text(m.t, W / 2, m.y + cam - 14 - (1 - m.life) * 30, 22, `rgba(255,255,255,${ m.life })`);
  if (state === 'play' || state === 'pause' || state === 'over') {
    drawScore();
    if (ch && state !== 'over')
      text(ch.n + ' · ' + (blocks.length - 1) + '/' + ch.goal, W / 2, 156, 15, '#ffd9a8', 'normal');
  }
  drawModeHud();
  if (state === 'play') {
    hot.push({
      x: W - 56,
      y: 12,
      w: 44,
      h: 44,
      fn: pause
    });
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillRect(W - 44, 24, 7, 20);
    ctx.fillRect(W - 30, 24, 7, 20);
  }
  if (state === 'menu') {
    dim();
    title();
    text(menuHint(), W / 2, 246, 16, 'rgba(255,255,255,.85)', 'normal');
    hot.push({x: 40, y: 262, w: 400, h: 64, fn: start});
    const g = ctx.createLinearGradient(40, 0, 440, 0);
    g.addColorStop(0, '#fff1d6');
    g.addColorStop(1, '#ffbe82');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(40, 262, 400, 64, 20);
    ctx.fill();
    text('Играть', W / 2, 303, 28, '#1a2036');
    const T2 = [
      ['Испытания', () => state = 'chal'],
      ['Арена', () => state = 'arena'],
      ['Подземелье', () => state = 'dungeon'],
      ['Режимы', () => state = 'modes'],
      ['Строитель', () => state = 'hero', P.hero.sp > 0],
      ['Магазин', () => state = 'shop'],
      ['Задания', () => state = 'quests'],
      ['Достижения', () => state = 'ach'],
      ['Статистика', () => state = 'stats'],
      ['Как играть', () => state = 'help']
    ];
    T2.forEach((t, i) => {
      const x = 40 + i % 2 * 210, y = 338 + Math.floor(i / 2) * 56;
      hot.push({x, y, w: 190, h: 48, fn: t[1]});
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.beginPath();
      ctx.roundRect(x, y, 190, 48, 16);
      ctx.fill();
      text(t[0], x + 95, y + 30, 18, '#1a2036');
      if (t[2]) {
        ctx.fillStyle = '#ff9f6e';
        ctx.beginPath();
        ctx.arc(x + 176, y + 14, 6, 0, 7);
        ctx.fill();
      }
    });
  }
  if (state === 'pause') {
    dim();
    text('Пауза', W / 2, 270, 46, '#fff');
    btn(320, 'Продолжить', resume);
    btn(384, 'В меню', toMenu);
  }
  if (state === 'over')
    drawOver();
  if (state === 'shop')
    drawShop();
  if (state === 'quests')
    drawQuests();
  if (state === 'hero')
    drawHero();
  if (state === 'chal')
    drawChal();
  if (state === 'arena')
    drawArena();
  if (state === 'zone')
    drawZone();
  if (state === 'confirm')
    drawConfirm();
  if (state === 'battle')
    drawBattle();
  if (state === 'ach')
    drawAch();
  if (state === 'modes')
    drawModes();
  if (state === 'dungeon')
    drawDungeon();
  if (state === 'dgpick')
    drawDgPick();
  if (state === 'settings')
    drawSettings();
  if (state === 'stats')
    drawStats();
  if (state === 'help')
    drawHelp();
  if (state === 'scores') {
    dim();
    text('Рекорды', W / 2, 120, 44, '#fff');
    if (!scores.length)
      text('Пока пусто — сыграйте!', W / 2, 200, 18, 'rgba(255,255,255,.8)', 'normal');
    scores.forEach((r, i) => {
      const y = 175 + i * 38;
      text(i + 1 + '.', 120, y, 20, 'rgba(255,255,255,.6)', 'normal', 'right');
      text(String(r.s), W / 2, y, 24, '#fff');
      text(r.d, 360, y, 15, 'rgba(255,255,255,.6)', 'normal', 'left');
    });
    btn(H - 110, 'Назад', () => state = 'menu');
  }
}
