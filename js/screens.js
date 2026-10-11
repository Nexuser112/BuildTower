/*
 * 16. screens.js — Экраны игры: «Строитель», испытания, арена и локации, магазин, задания, достижения, сброс прогресса.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

function drawHero() {
  dim();
  text('Строитель', W / 2, 52, 34, '#fff6e2');
  ['Персонаж', 'Навыки'].forEach((t, i) => {
    const x = 90 + i * 160;
    hot.push({
      x,
      y: 66,
      w: 150,
      h: 30,
      fn: () => heroTab = i
    });
    pill(x, 66, 150, 30, heroTab === i);
    text(t, x + 75, 87, 14, heroTab === i ? '#1a2036' : '#fff');
  });
  const h = P.hero, nd = need(h.lv), st = hs();
  if (heroTab === 0) {
    avatar(W / 2 - 14, 170, 1.05);
    text('Уровень ' + h.lv, W / 2, 276, 22, '#ffd9a8');
    bar(110, 286, 260, h.xp / nd, '#ffbe82');
    text(h.xp + ' / ' + nd + ' опыта', W / 2, 312, 13, 'rgba(255,241,214,.8)', 'normal');
    text('ЗДР ' + st.hp + '  ·  АТК ' + st.atk + '  ·  ЗАЩ ' + st.def, W / 2, 336, 15, '#ffd9a8', 'normal');
    SL.forEach((k, i) => {
      const g = GEAR[i][P.eq[k]], y = 352 + i * 54;
      card(40, y, 400, 48);
      icon(g.ic, 68, y + 24, 26);
      text(g.n, 100, y + 20, 16, '#fff', 'normal', 'left');
      text('АТК +' + g.a + ' · ЗАЩ +' + g.d + ' · ЗДР +' + g.h, 100, y + 38, 12, 'rgba(255,241,214,.7)', 'normal', 'left');
      text(['Голова', 'Тело', 'Инструмент'][i], 428, y + 28, 13, 'rgba(255,241,214,.7)', 'normal', 'right');
    });
    text('Очки навыка: ' + h.sp + (h.sp ? ' — вкладка «Навыки»' : ''), W / 2, 540, 14, '#fff6e2', 'normal');
  } else {
    text('Очки навыка: ' + h.sp, W / 2, 124, 18, '#fff6e2');
    HS.forEach((s, i) => {
      const y = 136 + i * 54, lv = h.s[i], can = h.sp > 0 && lv < s.m;
      card(40, y, 400, 48);
      text(s.n, 56, y + 20, 16, '#fff', 'normal', 'left');
      text(s.d, 56, y + 38, 12, 'rgba(255,241,214,.7)', 'normal', 'left');
      for (let k = 0; k < s.m; k++) {
        ctx.fillStyle = k < lv ? '#ffc58c' : 'rgba(255,255,255,.2)';
        ctx.beginPath();
        ctx.arc(282 + k * 14, y + 24, 4.5, 0, 7);
        ctx.fill();
      }
      hot.push({
        x: 372,
        y: y + 7,
        w: 56,
        h: 34,
        fn: () => {
          if (can) {
            h.s[i]++;
            h.sp--;
            saveP();
            snd(700, 0.2, 'sine', 0.2, 1100);
            checkAch();
          } else
            toast(h.sp < 1 ? 'Нет очков навыка' : 'Максимум');
        }
      });
      pill(372, y + 7, 56, 34, can);
      text('+', 400, y + 32, 22, can ? '#1a2036' : 'rgba(255,255,255,.5)');
    });
  }
  btn(H - 110, 'Назад', () => state = 'menu');
}

function drawChal() {
  dim();
  text('Испытания', W / 2, 52, 34, '#fff6e2');
  ['Дня', 'Постоянные'].forEach((t, i) => {
    const x = 90 + i * 160;
    hot.push({
      x,
      y: 66,
      w: 150,
      h: 30,
      fn: () => {
        chTab = i;
        chPg = 0;
      }
    });
    pill(x, 66, 150, 30, chTab === i);
    text(t, x + 75, 87, 14, chTab === i ? '#1a2036' : '#fff');
  });
  text(chTab ? 'Открываются с уровнем Строителя · сейчас ' + P.hero.lv : 'Обновляются каждый день · награда раз в сутки', W / 2, 118, 13, 'rgba(255,241,214,.8)', 'normal');
  const all = chTab ? CHAL : dayCh(), L = all.slice(chPg * 8, chPg * 8 + 8), stp = chTab ? 52 : 66;
  L.forEach((c, i) => {
    const y = 130 + i * stp, hh = stp - 6, lock = P.hero.lv < c.lv, done = c.daily ? P.dch.done[c.id] : P.ch[c.id];
    if (!lock)
      hot.push({
        x: 40,
        y,
        w: 400,
        h: hh,
        fn: () => startChallenge(c)
      });
    card(40, y, 400, hh, done);
    const a = lock ? 0.45 : 1, w1 = 'rgba(255,255,255,' + a + ')', w2 = 'rgba(255,241,214,' + 0.75 * a + ')';
    text(c.n, 56, y + 20, 16, w1, 'normal', 'left');
    text(c.d + ' · высота ' + c.goal, 56, y + hh - 10, 12, w2, 'normal', 'left');
    text(lock ? 'Ур. ' + c.lv : done ? '✓ Пройдено' : 'Начать', 428, y + 20, 15, lock ? w2 : '#ffd9a8', 'bold', 'right');
    text('+' + c.rc + ' монет · +' + c.rx + ' оп.', 428, y + hh - 10, 12, w2, 'normal', 'right');
  });
  if (all.length > 8)
    pager(chPg, Math.ceil(all.length / 8), v => chPg = v, 548);
  btn(H - 110, 'Назад', () => state = 'menu');
}

function drawArena() {
  dim();
  text('Арена', W / 2, 56, 34, '#fff6e2');
  const s = hs();
  text('Ты: ЗДР ' + s.hp + ' · АТК ' + s.atk + ' · ЗАЩ ' + s.def, W / 2, 84, 14, '#ffd9a8', 'normal');
  text('Выбери локацию. Босс зоны даёт особую награду', W / 2, 106, 12, 'rgba(255,241,214,.75)', 'normal');
  ZONES.forEach((z, zi) => {
    const y = 122 + zi * 74, lock = P.hero.lv < zi * 10 + 1, E = ENEMIES.filter(e => e.z === zi), won = E.filter(e => P.beat[e.i]).length, a = lock ? 0.45 : 1;
    if (!lock)
      hot.push({
        x: 40,
        y,
        w: 400,
        h: 66,
        fn: () => {
          arenaZ = zi;
          state = 'zone';
        }
      });
    card(40, y, 400, 66, won === E.length);
    icon(z.ic, 72, y + 34, 34);
    text(z.n, 108, y + 26, 17, 'rgba(255,255,255,' + a + ')', 'normal', 'left');
    text('Уровни ' + (zi * 10 + 1) + '–' + (zi * 10 + 10) + ' · побеждено ' + won + ' из ' + E.length, 108, y + 46, 12, 'rgba(255,241,214,' + 0.75 * a + ')', 'normal', 'left');
    text(lock ? 'Ур. ' + (zi * 10 + 1) : 'Войти', 428, y + 30, 15, lock ? 'rgba(255,241,214,.5)' : '#ffd9a8', 'bold', 'right');
    bar(108, y + 54, 200, won / E.length, '#ffbe82', 6);
  });
  btn(H - 110, 'Назад', () => state = 'menu');
}

function drawZone() {
  const z = ZONES[arenaZ];
  dim();
  icon(z.ic, W / 2 - 100, 52, 34);
  text(z.n, W / 2 + 10, 60, 26, '#fff6e2');
  text(STORY[arenaZ], W / 2, 90, 12, 'rgba(255,241,214,.8)', 'normal');
  ENEMIES.filter(e => e.z === arenaZ).forEach((e, k) => {
    const y = 108 + k * 60, lock = P.hero.lv < e.lv, won = P.beat[e.i], a = lock ? 0.45 : 1, w2 = 'rgba(255,241,214,' + 0.75 * a + ')';
    if (!lock)
      hot.push({
        x: 40,
        y,
        w: 400,
        h: 54,
        fn: () => startBattle(e.i)
      });
    card(40, y, 400, 54, won);
    if (e.boss) {
      ctx.strokeStyle = 'rgba(255,140,120,.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, y, 400, 54, 12);
      ctx.stroke();
    }
    icon(e.ic, 70, y + 27, 30);
    text((e.boss ? '★ ' : '') + e.n, 104, y + 22, 16, 'rgba(255,255,255,' + a + ')', 'normal', 'left');
    text('ЗДР ' + e.hp + ' · АТК ' + e.atk + ' · ЗАЩ ' + e.def, 104, y + 42, 12, w2, 'normal', 'left');
    text(lock ? 'Ур. ' + e.lv : won ? '✓ Победа' : 'В бой', 428, y + 22, 15, lock ? w2 : '#ffd9a8', 'bold', 'right');
    text('+' + e.rc + ' монет · +' + e.rx + ' оп.', 428, y + 42, 12, w2, 'normal', 'right');
  });
  btn(H - 110, 'К локациям', () => state = 'arena');
}

function row(y, name, right, sw, fn, on, sub) {
  hot.push({
    x: 40,
    y,
    w: 400,
    h: 40,
    fn
  });
  card(40, y, 400, 40, on);
  sw(52, y + 6);
  text(name, 110, y + (sub ? 17 : 26), 16, '#fff', 'normal', 'left');
  if (sub)
    text(sub, 110, y + 33, 12, 'rgba(255,241,214,.7)', 'normal', 'left');
  text(right, 428, y + 26, 14, 'rgba(255,241,214,.95)', 'normal', 'right');
}

function drawShop() {
  dim();
  text('Магазин', W / 2, 52, 34, '#fff6e2');
  SH_TABS.forEach((t, i) => {
    const x = 20 + i * 63;
    hot.push({
      x,
      y: 68,
      w: 60,
      h: 28,
      fn: () => shopTab = i
    });
    pill(x, 68, 60, 28, shopTab === i);
    text(t, x + 30, 87, 11, shopTab === i ? '#1a2036' : '#fff');
  });
  const y0 = 112;
  if (shopTab === 0)
    THEMES.forEach((t, i) => {
      const o = P.th.includes(i), yy = y0 + i * 44;
      row(yy, TH_N[i], o ? 'Открыт' : TH_PR[i] + ' монет', (x, y) => {
        const g = ctx.createLinearGradient(0, y, 0, y + 28);
        g.addColorStop(0, mx(t.top, t.topH, 0.2));
        g.addColorStop(1, mx(t.bot, t.botH, 0.2));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(x, y, 44, 28, 8);
        ctx.fill();
      }, () => {
        if (!o && spend(TH_PR[i])) {
          P.th.push(i);
          toast('Открыт фон: ' + TH_N[i]);
          checkAch();
          saveP();
        }
      }, o);
    });
  if (shopTab === 1)
    PALS.forEach((p, j) => {
      const o = P.pals.includes(j), sel = P.pal === j;
      row(y0 + j * 44, p.n, sel ? 'Выбрано' : o ? 'Выбрать' : p.pr + ' монет', (x, y) => {
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = `hsl(${ p.f ? p.f(k * 3) : (T.h0 + k * 27) % 360 },62%,58%)`;
          ctx.fillRect(x + k * 9, y, 9, 28);
        }
      }, () => {
        if (o) {
          P.pal = j;
          saveP();
        } else if (spend(p.pr)) {
          P.pals.push(j);
          P.pal = j;
          toast('Открыто: ' + p.n);
          saveP();
        }
      }, sel);
    });
  if (shopTab === 2)
    EFX.forEach((f, j) => {
      const o = P.efx.own.includes(j), sel = P.efx.sel === j;
      row(y0 + j * 44, f.n, sel ? 'Выбрано' : o ? 'Выбрать' : f.pr + ' монет', (x, y) => icon(f.ic, x + 22, y + 14, 24), () => {
        if (o) {
          P.efx.sel = j;
          saveP();
        } else if (spend(f.pr)) {
          P.efx.own.push(j);
          P.efx.sel = j;
          toast('Открыт эффект: ' + f.n);
          saveP();
        }
      }, sel);
    });
  if (shopTab >= 3 && shopTab <= 5) {
    const sl = shopTab - 3, k = SL[sl];
    GEAR[sl].forEach((g, j) => {
      const o = P.own[k].includes(j), sel = P.eq[k] === j;
      row(y0 + j * 50, g.n, sel ? 'Надето' : o ? 'Надеть' : g.pr + ' монет', (x, y) => icon(g.ic, x + 22, y + 14, 24), () => {
        if (o) {
          P.eq[k] = j;
          saveP();
        } else if (spend(g.pr)) {
          P.own[k].push(j);
          P.eq[k] = j;
          toast('Куплено: ' + g.n);
          checkAch();
          saveP();
        }
      }, sel, 'АТК +' + g.a + ' · ЗАЩ +' + g.d + ' · ЗДР +' + g.h);
    });
    text('Снаряжение усиливает персонажа на арене', W / 2, 484, 13, 'rgba(255,241,214,.7)', 'normal');
  }
  if (shopTab === 6) {
    [
      ['heal', 'Зелье лечения', '🧪', 60, 'Лечит 40% здоровья в бою'],
      ['ward', 'Оберег', '🧿', 90, 'Лишний щит на следующий бой']
    ].forEach((it, j) => {
      row(y0 + j * 50, it[1] + ' ×' + P.items[it[0]], it[3] + ' монет', (x, y) => icon(it[2], x + 22, y + 14, 24), () => {
        if (spend(it[3])) {
          P.items[it[0]]++;
          saveP();
        }
      }, false, it[4]);
    });
    text('Припасы расходуются в боях на арене', W / 2, 260, 13, 'rgba(255,241,214,.7)', 'normal');
  }
  btn(H - 110, 'Назад', () => state = 'menu');
}

function drawQuests() {
  dim();
  text('Задания дня', W / 2, 84, 36, '#fff6e2');
  text('Заходов подряд: ' + P.days + ' (бонус растёт до 7 дней)', W / 2, 112, 14, 'rgba(255,241,214,.8)', 'normal');
  P.tasks.forEach((t, k) => {
    const d = TASKS[t.i], y = 134 + k * 60;
    card(44, y, 392, 52, t.done);
    text((t.done ? '✓ ' : '') + d.t, 58, y + 22, 16, '#fff', 'normal', 'left');
    text('+' + d.r, 422, y + 22, 16, '#ffd9a8', 'bold', 'right');
    bar(58, y + 34, 364, t.p / d.n, '#ffbe82', 7);
  });
  text('Новые задания и испытания приходят каждый день', W / 2, 340, 13, 'rgba(255,241,214,.7)', 'normal');
  btn(H - 110, 'Назад', () => state = 'menu');
}

function drawAch() {
  dim();
  text('Достижения', W / 2, 52, 34, '#fff6e2');
  text('Получено: ' + ACH.filter(a => P.ach[a.id]).length + ' из ' + ACH.length, W / 2, 80, 14, 'rgba(255,241,214,.8)', 'normal');
  ACH.slice(achPg * 9, achPg * 9 + 9).forEach((a, i) => {
    const y = 96 + i * 48, ok = P.ach[a.id];
    card(40, y, 400, 42, ok);
    ctx.globalAlpha = ok ? 1 : 0.45;
    icon(a.ic, 66, y + 21, 24);
    ctx.globalAlpha = 1;
    text((ok ? '✓ ' : '') + a.t, 96, y + 18, 15, ok ? '#ffd9a8' : '#fff', 'normal', 'left');
    text(a.d, 96, y + 34, 12, 'rgba(255,241,214,.7)', 'normal', 'left');
    text('+' + a.r + ' монет', 428, y + 26, 13, 'rgba(255,241,214,.85)', 'normal', 'right');
  });
  pager(achPg, Math.ceil(ACH.length / 9), v => achPg = v, 540);
  btn(H - 110, 'Назад', () => state = 'menu');
}

function resetAll() {
  try {
    localStorage.removeItem('tower-profile');
    localStorage.removeItem('tower-scores');
  } catch (e) {
  }
  scores = [];
  for (const k of Object.keys(P))
    delete P[k];
  Object.assign(P, {
    coins: 0,
    st: {
      games: 0,
      blocks: 0,
      perfects: 0,
      h: 0,
      streak: 0
    },
    ach: {},
    th: [0],
    pals: [0],
    pal: 0,
    day: '',
    days: 0,
    tasks: [],
    hero: {
      xp: 0,
      lv: 1,
      sp: 0,
      s: [0, 0, 0, 0, 0, 0, 0, 0]
    },
    ch: {},
    dch: {
      day: todayKey(),
      done: {}
    },
    eq: {
      h: 0,
      b: 0,
      t: 0
    },
    own: {
      h: [0],
      b: [0],
      t: [0]
    },
    efx: {
      own: [0],
      sel: 0
    },
    beat: {},
    items: {
      heal: 0,
      ward: 0
    }
  });
  dailyInit();
  ensureNew();
  P.coins = 0;
  P.st.earned = 0;
  toasts.length = 0;
  parts = [];
  B = null;
  lastT = -1;
  pickTheme();
  toMenu();
  saveP();
  toast('Прогресс сброшен');
  snd(300, 0.5, 'triangle', 0.2, 120);
}

function drawConfirm() {
  dim();
  ctx.fillStyle = 'rgba(32,12,30,.94)';
  ctx.beginPath();
  ctx.roundRect(40, 196, 400, 320, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,140,125,.85)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  text('Сбросить весь прогресс?', W / 2, 246, 24, '#ffb3a8');
  text('Будут удалены монеты, уровень, навыки,', W / 2, 288, 15, '#fff', 'normal');
  text('снаряжение, достижения и рекорды.', W / 2, 310, 15, '#fff', 'normal');
  text('Это действие нельзя отменить.', W / 2, 342, 15, '#ffd9a8');
  btn(368, 'Отмена', () => state = 'settings');
  hot.push({
    x: W / 2 - 110,
    y: 436,
    w: 220,
    h: 48,
    fn: resetAll
  });
  ctx.fillStyle = '#e8665a';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 110, 436, 220, 48, 12);
  ctx.fill();
  text('Да, сбросить всё', W / 2, 467, 19, '#fff');
}
