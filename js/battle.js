/*
 * 14. battle.js — Герой и бой на арене: характеристики героя, рисование героя и монстров, ход боя, награды.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

function hs() {
  let a = 0, d = 0, h = 0;
  SL.forEach((k, i) => {
    const g = GEAR[i][P.eq[k]];
    a += g.a;
    d += g.d;
    h += g.h;
  });
  const l = P.hero.lv, S = P.hero.s;
  return {
    hp: Math.round((60 + l * 8 + h) * (1 + 0.08 * S[4])),
    atk: Math.round((8 + l * 1.5 + a) * (1 + 0.06 * S[5])),
    def: d + S[6] * 2
  };
}

function avatar(cx, cy, s) {
  const G = SL.map((k, i) => GEAR[i][P.eq[k]]);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(34, 50);
  ctx.lineTo(46, -8);
  ctx.stroke();
  ctx.fillStyle = G[2].c;
  ctx.beginPath();
  ctx.roundRect(34, -20, 28, 14, 4);
  ctx.fill();
  ctx.fillStyle = G[1].c;
  ctx.beginPath();
  ctx.roundRect(-26, 24, 52, 46, 14);
  ctx.fill();
  ctx.fillStyle = '#ffe0bd';
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, 7);
  ctx.fill();
  ctx.fillStyle = G[0].c;
  ctx.beginPath();
  ctx.arc(0, -6, 30, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-37, -8, 74, 8);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.fillRect(-4, -36, 8, 28);
  ctx.fillStyle = '#2a1a3a';
  ctx.beginPath();
  ctx.arc(-10, 8, 3.2, 0, 7);
  ctx.arc(10, 8, 3.2, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#2a1a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 13, 9, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

function monster(cx, cy, sc, e, fl) {
  ctx.save();
  ctx.translate(cx + (fl ? (Math.random() - 0.5) * 8 * fl : 0), cy);
  if (e.boss) {
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 110 * sc);
    g.addColorStop(0, 'rgba(255,120,120,.45)');
    g.addColorStop(1, 'rgba(255,120,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-150, -150, 300, 300);
  }
  ctx.globalAlpha = fl > 0.3 ? 0.5 : 1;
  icon(e.ic, 0, 0, Math.round(96 * sc));
  ctx.restore();
}

const BW_ = 160, BX = (W - 160) / 2;

function startBattle(i) {
  ch = null;
  const e = ENEMIES[i], s = hs(), ward = P.items.ward > 0;
  if (ward)
    P.items.ward--;
  B = {
    i,
    e,
    eh: e.hp,
    h: s.hp,
    m: s.hp,
    s,
    ph: 'aim',
    t: 0,
    x: 30,
    dir: 1,
    pop: [],
    sh: P.hero.s[3] + (ward ? 1 : 0),
    fe: 0,
    fh: 0,
    res: null,
    rw: '',
    rw2: '',
    n: 0,
    cd: {smash: 0, guard: 0, mend: 0},
    combo: 0,
    smash: false,
    dg: false
  };
  state = 'battle';
  saveP();
}

function battleTap() {
  if (!B || B.ph !== 'aim')
    return;
  const dx = Math.abs(B.x - BX), ov = Math.max(0, BW_ - dx), acc = ov / BW_, pf = dx <= tol(), cm = 1.8 + 0.15 * P.hero.s[7];
  let dmg = 0;
  B.combo = pf ? (B.combo || 0) + 1 : 0;   // комбо: подряд идущие критические удары
  P.st.combo = Math.max(P.st.combo || 0, B.combo);
  if (pf)
    P.st.crits = (P.st.crits || 0) + 1;
  if (ov > 0) {
    dmg = B.s.atk * (0.3 + 1.1 * acc) * (pf ? cm * (1 + Math.min(0.5, 0.1 * (B.combo - 1))) : 1);
    if (B.smash)
      dmg *= 1.8;
    dmg = Math.max(1, Math.round(dmg - B.e.def));
  }
  B.smash = false;
  P.st.dmg = (P.st.dmg || 0) + dmg;
  if (dmg && B.dg && D.ls)
    B.h = Math.min(B.m, B.h + Math.round(dmg * D.ls));
  if (pf) {
    shake = Math.max(shake, 0.5);
    buzz(25);
  }
  B.eh = Math.max(0, B.eh - dmg);
  B.fe = 1;
  B.pop.push({
    t: dmg ? pf ? 'КРИТ ' + dmg : '-' + dmg : 'Промах',
    x: 370,
    y: 215,
    l: 1,
    c: pf ? '#ffd9a8' : '#fff'
  });
  snd(dmg ? pf ? 660 : 300 : 160, 0.15, pf ? 'sine' : 'triangle', 0.2);
  B.ph = 'hit';
  B.t = 0.8;
}

function updBattle(dt) {
  if (!B)
    return;
  B.pop.forEach(p => {
    p.l -= dt;
    p.y -= dt * 40;
  });
  B.pop = B.pop.filter(p => p.l > 0);
  B.fe = Math.max(0, B.fe - dt * 3);
  B.fh = Math.max(0, B.fh - dt * 3);
  if (B.ph === 'aim') {
    const sp = Math.min(280 + B.e.lv * 5, 700) * (1 - 0.04 * P.hero.s[1]) * (1 - (B.dg ? D.slow : 0));
    B.x += B.dir * sp * dt;
    if (B.x <= 30) {
      B.x = 30;
      B.dir = 1;
    } else if (B.x + BW_ >= W - 30) {
      B.x = W - 30 - BW_;
      B.dir = -1;
    }
  } else if (B.ph === 'hit' || B.ph === 'foe') {
    B.t -= dt;
    if (B.t > 0)
      return;
    if (B.ph === 'hit') {
      if (B.eh <= 0) {
        endBattle(true);
        return;
      }
      B.n = (B.n || 0) + 1;
      const hv = B.n % (B.e.boss ? 3 : 4) === 0, dm = Math.max(1, Math.round(B.e.atk * (0.85 + Math.random() * 0.3) * (hv ? 1.5 : 1) * 60 / (60 + B.s.def)));
      if (B.sh > 0) {
        B.sh--;
        B.pop.push({
          t: 'Щит!',
          x: 110,
          y: 215,
          l: 1,
          c: '#a8d8ff'
        });
        snd(520, 0.2, 'triangle', 0.2);
      } else {
        B.h = Math.max(0, B.h - dm);
        B.fh = 1;
        shake = Math.max(shake, 0.6);
        buzz(40);
        B.pop.push({
          t: (hv ? 'МОЩНО -' : '-') + dm,
          x: 110,
          y: 215,
          l: 1,
          c: '#ff9f8a'
        });
        snd(180, 0.2, 'sawtooth', 0.15);
      }
      B.ph = 'foe';
      B.t = 0.8;
    } else {
      if (B.h <= 0) {
        endBattle(false);
        return;
      }
      B.ph = 'aim';
      for (const k in B.cd)
        if (B.cd[k] > 0)
          B.cd[k]--;
    }
  }
}

function endBattle(w) {
  B.ph = w ? 'win' : 'lose';
  B.res = w;
  if (B.dg) {
    endDungeonFloor(w);
    return;
  }
  if (w) {
    const e = B.e, first = !P.beat[e.i], k = first ? 1 : 0.15, rc = Math.max(1, Math.floor(e.rc * k)), rx = Math.max(1, Math.floor(e.rx * k));
    P.beat[e.i] = 1;
    P.st.wins = (P.st.wins || 0) + 1;
    addCoins(rc);
    addXP(rx);
    B.rw = '+' + rc + ' монет · +' + rx + ' опыта' + (first ? '' : ' (повтор: 15%)');
    if (first && e.boss) {
      const bc = 30 * (e.z + 1);
      addCoins(bc);
      P.hero.sp++;
      B.rw2 = 'Босс побеждён: +' + bc + ' монет и +1 очко навыка';
    }
    musicSet(null);
    if (!muted)
      fanfare();
  } else {
    musicSet(null);
    addXP(10);
    B.rw = '+10 опыта';
    snd(300, 0.6, 'sawtooth', 0.18, 50);
  }
  checkAch();
  saveP();
}

function drawBattle() {
  dim();
  const e = B.e;
  text((e.boss ? '★ ' : '') + e.n, W / 2, 52, 22, '#fff6e2');
  text(B.dg ? 'Подземелье · этаж ' + (D.f + 1) + '/' + D.list.length + (D.got.length ? ' · усилений: ' + D.got.length : '') : ZONES[e.z].n, W / 2, 74, 13, 'rgba(255,241,214,.7)', 'normal');
  if (e.boss && !B.n && B.ph === 'aim')
    text(BTAUNT[e.z], W / 2, 98, 13, '#ffb3a8', 'normal');
  if (B.combo >= 2)
    text('Комбо ×' + B.combo, W / 2, 122, 18, '#ffd9a8');
  text('Строитель, ур. ' + P.hero.lv, 110, 150, 14, '#fff', 'normal');
  text('Ур. ' + e.lv, 370, 150, 14, '#fff', 'normal');
  bar(40, 160, 140, B.h / B.m, '#8fd694', 14);
  bar(300, 160, 140, B.eh / e.hp, '#ff9f8a', 14);
  text(Math.ceil(B.h) + ' / ' + B.m, 110, 190, 12, 'rgba(255,255,255,.8)', 'normal');
  text(Math.ceil(B.eh) + ' / ' + e.hp, 370, 190, 12, 'rgba(255,255,255,.8)', 'normal');
  ctx.save();
  if (B.fh > 0)
    ctx.translate((Math.random() - 0.5) * 8 * B.fh, 0);
  avatar(100, 290, 0.9);
  ctx.restore();
  monster(370, 285, e.sz, e, B.fe);
  if (B.ph === 'aim' && (B.n + 1) % (e.boss ? 3 : 4) === 0)
    text('⚠ Мощный удар!', 370, 232, 14, '#ff9f8a');
  for (const p of B.pop) {
    ctx.globalAlpha = Math.max(0, p.l);
    text(p.t, p.x, p.y, 22, p.c);
    ctx.globalAlpha = 1;
  }
  if (B.sh > 0)
    text('Щитов: ' + B.sh, 110, 372, 13, '#a8d8ff', 'normal');
  if (B.ph === 'aim' || B.ph === 'hit' || B.ph === 'foe') {
    ctx.globalAlpha = 0.55;
    drawBlock(BX, 470, BW_, 30);
    ctx.globalAlpha = 1;
    drawBlock(B.x, 444, BW_, 200);
    text('Тапни, когда блок совпадёт с основанием', W / 2, 534, 15, 'rgba(255,255,255,.85)', 'normal');
    text('Идеально — критический удар ×' + (1.8 + 0.15 * P.hero.s[7]).toFixed(2), W / 2, 556, 13, 'rgba(255,241,214,.65)', 'normal');
    hot.push({
      x: W - 100,
      y: 14,
      w: 88,
      h: 34,
      fn: () => {
        if (B.dg) {
          endDungeonFloor(false);
          return;
        }
        B = null;
        state = 'zone';
      }
    });
    pill(W - 100, 14, 88, 34, false);
    text('Сдаться', W - 56, 36, 14, '#fff');
    if (B.ph === 'aim' && P.items.heal > 0) {
      hot.push({
        x: W / 2 - 80,
        y: 580,
        w: 160,
        h: 38,
        fn: () => {
          if (B.h < B.m) {
            P.items.heal--;
            B.h = Math.min(B.m, B.h + B.m * 0.4);
            B.pop.push({
              t: '+ЗДР',
              x: 110,
              y: 215,
              l: 1,
              c: '#8fd694'
            });
            snd(700, 0.2, 'sine', 0.2, 1000);
            saveP();
          }
        }
      });
      pill(W / 2 - 80, 580, 160, 38, true);
      text('🧪 Зелье ×' + P.items.heal, W / 2, 605, 15, '#1a2036');
    }
    drawSkills();
  }
  if (B.res !== null)
    drawBattleResult();
}

// Умения героя в бою: открываются по уровню, имеют перезарядку (в раундах)
const SK = [
  {id: 'smash', n: 'Мощный замах', lv: 3, cd: 3, d: 'след. удар ×1,8'},
  {id: 'guard', n: 'Щит', lv: 6, cd: 4, d: '+1 щит'},
  {id: 'mend', n: 'Починка', lv: 10, cd: 5, d: 'лечит 25%'}
];

function useSkill(i) {
  const s = SK[i];
  if (!B || B.ph !== 'aim' || P.hero.lv < s.lv)
    return;
  if (B.cd[s.id] > 0) {
    toast('Перезарядка: ещё ' + B.cd[s.id] + ' р.');
    return;
  }
  B.cd[s.id] = s.cd;
  if (s.id === 'smash') {
    B.smash = true;
    B.pop.push({t: 'Замах!', x: 110, y: 215, l: 1, c: '#ffd9a8'});
  } else if (s.id === 'guard') {
    B.sh++;
    B.pop.push({t: 'Щит +1', x: 110, y: 215, l: 1, c: '#a8d8ff'});
  } else {
    const g = Math.round(B.m * 0.25);
    B.h = Math.min(B.m, B.h + g);
    B.pop.push({t: '+' + g, x: 110, y: 215, l: 1, c: '#8fd694'});
  }
  snd(760, 0.2, 'triangle', 0.2, 1100);
}

function drawSkills() {
  SK.forEach((s, i) => {
    const x = 24 + i * 148, y = 626, lock = P.hero.lv < s.lv, cd = B.cd[s.id], ready = !lock && cd === 0 && B.ph === 'aim';
    hot.push({x, y, w: 136, h: 40, fn: () => useSkill(i)});
    pill(x, y, 136, 40, ready);
    text(lock ? 'Ур. ' + s.lv : s.n, x + 68, y + 17, 13, ready ? '#1a2036' : 'rgba(255,255,255,.55)');
    text(lock ? s.n : cd > 0 ? 'ещё ' + cd + ' р.' : s.d, x + 68, y + 32, 10, ready ? '#3b3f5c' : 'rgba(255,255,255,.4)', 'normal');
  });
  if (B.smash)
    text('Замах ×1,8 готов', 110, 392, 13, '#ffd9a8', 'normal');
}

// Окно результата боя
function drawBattleResult() {
  ctx.fillStyle = 'rgba(8,6,20,.7)';
  ctx.fillRect(0, 0, W, H);
  if (B.dg) {
    dgResult();
    return;
  }
  text(B.res ? 'Победа!' : 'Поражение', W / 2, 290, 46, '#fff');
  text(B.rw, W / 2, 332, 16, '#ffd9a8', 'normal');
  if (B.rw2)
    text(B.rw2, W / 2, 356, 14, '#ffd9a8', 'normal');
  btn(384, 'Ещё бой', () => startBattle(B.i));
  btn(448, 'К локации', () => {
    B = null;
    state = 'zone';
  });
}
