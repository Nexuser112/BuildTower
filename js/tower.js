/*
 * 07. tower.js — Игра-башня: скорость блока, сброс блока и расчёт срезов, идеальные попадания, частицы, обновление кадра.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

const speed = () => Math.min(190 + blocks.length * 8, 560) * (1 - 0.04 * P.hero.s[1]) * (ch && ch.sp || 1) * windF() * (bonus && bonus.t === 'slow' ? 0.6 : 1);

function reset() {
  run = 0;
  const sw = ch && ch.sw ? ch.sw : BASE_W;
  blocks = [{
      x: (W - sw) / 2,
      w: sw
    }];
  saves = P.hero.s[3];
  timeLeft = md === 'time' ? 45 : 0;
  bonus = null;
  overMsg = '';
  prevH = P.st.h;   // прежний рекорд высоты — чтобы показать «новый рекорд» в конце партии
  runPerf = 0;
  runStreak = 0;
  swayT = 0;
  shake = 0;
  runXp = 0;
  cf = 0;
  pieces = [];
  msgs = [];
  streak = 0;
  score = 0;
  cam = 0;
  flash = 0;
  spawn();
}

function spawn() {
  const n = blocks.length;
  cur = {
    x: 0,
    w: blocks[n - 1].w,
    dir: 1,
    n
  };
}

const start = () => {
  ch = null;
  md = null;
  pickTheme();
  reset();
  state = 'play';
};

const toMenu = () => {
  ch = null;
  md = null;
  reset();
  state = 'menu';
};

const pause = () => {
  if (state === 'play')
    state = 'pause';
};

const resume = () => {
  if (state === 'pause')
    state = 'play';
};

function endGame() {
  state = 'over';
  cur = null;
  chRes = ch ? 'fail' : null;
  if (!ch && !md)
    saveScore(score);
  saveRun();
  shake = 1;
  buzz(80);
  addXP(5);
  P.st.games++;
  task('games', 1);
  checkAch();
  saveP();
  snd(300, 0.6, 'sawtooth', 0.18, 50);
}

function drop() {
  const off = swayOff(), top0 = blocks[blocks.length - 1], top = {x: top0.x + off, w: top0.w}, y = BASE_Y - cur.n * BH;
  const L = Math.max(cur.x, top.x), R = Math.min(cur.x + cur.w, top.x + top.w), ov = R - L;
  if (ov <= 0) {
    pieces.push({
      x: cur.x,
      y,
      w: cur.w,
      vy: 0,
      h: hueOf(cur.n)
    });
    if (saves > 0) {
      saves--;
      streak = 0;
      msgs.push({
        t: 'Страховка!',
        life: 1,
        y
      });
      snd(520, 0.3, 'triangle', 0.2, 260);
      spawn();
      return;
    }
    endGame();
    return;
  }
  let nb;
  if (Math.abs(cur.x - top.x) <= tol()) {
    streak++;
    nb = {
      x: top0.x,
      w: top.w
    };
    if (streak >= 3 && nb.w < BASE_W) {
      const g = Math.min(10, BASE_W - nb.w);
      nb.x -= g / 2;
      nb.w += g;
    }
    score += 1 + Math.min(streak, 5);
    flash = 1;
    pulse = 1;
    burst(top.x + top.w / 2, y, top.w);
    shake = Math.max(shake, 0.25);
    buzz(15);
    if (md === 'time')
      timeLeft = Math.min(60, timeLeft + 2);
    msgs.push({
      t: streak >= 3 ? 'Идеально ×' + streak : 'Идеально!',
      life: 1,
      y
    });
    snd(440 + streak * 55, 0.25, 'sine', 0.2, 880 + streak * 55);
  } else {
    if (ch && ch.exact) {
      pieces.push({
        x: cur.x,
        y,
        w: cur.w,
        vy: 0,
        h: hueOf(cur.n)
      });
      endGame();
      return;
    }
    streak = 0;
    nb = {
      x: L - off,
      w: ov
    };
    shake = Math.max(shake, 0.1);
    pieces.push({
      x: cur.x < top.x ? cur.x : R,
      y,
      w: cur.w - ov,
      vy: 0,
      h: hueOf(cur.n)
    });
    score++;
    pulse = 1;
    snd(200, 0.12, 'triangle', 0.25);
  }
  if (bonus && bonus.t === 'wide') {
    const g = Math.min(24, BASE_W - nb.w);
    nb.x -= g / 2;
    nb.w += g;
    bonus = null;
  }
  blocks.push(nb);
  if (bonus && (bonus.t === 'slow' || bonus.t === 'magnet') && --bonus.n <= 0)
    bonus = null;
  const perfect = streak > 0, hh = blocks.length - 1;
  if (perfect && streak % 4 === 0)
    giveBonus();
  P.st.blocks++;
  P.st.h = Math.max(P.st.h, hh);
  addCoinsF(perfect ? 3 : 1);
  addXP(perfect ? 3 : 1);
  task('blocks', 1);
  task('height', hh, 1);
  if (perfect) {
    runPerf++;
    runStreak = Math.max(runStreak, streak);
    P.st.perfects++;
    P.st.streak = Math.max(P.st.streak, streak);
    task('perfect', 1);
    task('streak', streak, 1);
  }
  checkAch();
  if (ch && hh >= ch.goal) {
    winChallenge();
    return;
  }
  spawn();
}

// ---- обновление ----
function update(dt) {
  if (state !== 'pause' && dt > 0) {   // время в игре (без паузы); сохраняем раз в 20 секунд
    P.st.time = (P.st.time || 0) + dt;
    if (Math.floor(P.st.time / 20) !== Math.floor((P.st.time - dt) / 20))
      saveP();
  }
  if (toasts[0]) {
    toasts[0].life -= dt;
    if (toasts[0].life <= 0)
      toasts.shift();
  }
  if (state === 'battle')
    updBattle(dt);
  if (state === 'pause')
    return;
  if (state === 'play') {
    swayT += dt;
    if (md === 'time') {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        overMsg = 'Время вышло!';
        endGame();
      }
    }
  }
  if (state === 'play' && cur) {
    cur.x += cur.dir * speed() * dt;
    if (cur.x <= 0) {
      cur.x = 0;
      cur.dir = 1;
    } else if (cur.x + cur.w >= W) {
      cur.x = W - cur.w;
      cur.dir = -1;
    }
  }
  for (const p of pieces) {
    p.vy += 1500 * dt;
    p.y += p.vy * dt;
  }
  pieces = pieces.filter(p => p.y + cam < H + 120);
  parts.forEach(p => {
    p.vy += 700 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.l -= dt * 1.3;
  });
  parts = parts.filter(p => p.l > 0);
  for (const m of msgs)
    m.life -= dt * 1.2;
  msgs = msgs.filter(m => m.life > 0);
  flash = Math.max(0, flash - dt * 3);
  pulse = Math.max(0, pulse - dt * 4);
  shake = Math.max(0, shake - dt * 2.5);
  cam += (Math.max(0, (blocks.length - 6) * BH) - cam) * Math.min(1, dt * 6);
}

function burst(x, y, w) {
  const k = P.efx.sel;
  if (!k)
    return;
  const n = k === 5 ? 36 : 18;
  for (let i = 0; i < n; i++)
    parts.push({
      x: x + (Math.random() - 0.5) * w,
      y,
      vx: (Math.random() - 0.5) * (k === 5 ? 380 : 260),
      vy: -Math.random() * 320 - 60,
      l: 1,
      k,
      h: Math.random() * 360
    });
}
