/*
 * 10. stats.js — окно итогов партии (высота в блоках, идеальные, серия), экран «Статистика» (общие данные и рекорды).
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

// Склонение: plural(5, ['блок', 'блока', 'блоков']) → «блоков»
const plural = (n, f) => {
  const m = Math.abs(n) % 100, d = m % 10;
  return m > 10 && m < 20 ? f[2] : d > 1 && d < 5 ? f[1] : d === 1 ? f[0] : f[2];
};
const fmtTime = s => {
  s = Math.floor(s || 0);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h > 0 ? h + ' ч ' + m + ' мин' : m > 0 ? m + ' мин ' + s % 60 + ' с' : s + ' с';
};
const fmtNum = n => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Окно после партии: высота = число блоков, которые удалось поставить
function drawOver() {
  dim();
  const hh = blocks.length - 1, win = chRes === 'win';
  text(win ? 'Испытание пройдено!' : ch ? 'Испытание не пройдено' : overMsg || 'Башня рухнула', W / 2, 220, win ? 34 : ch ? 30 : 40, '#fff');
  text('Высота: ' + hh + ' ' + plural(hh, ['блок', 'блока', 'блоков']) + (ch ? ' из ' + ch.goal : ''), W / 2, 268, 28, '#ffd9a8');
  if (hh > prevH && hh > 0)
    text('★ Новый рекорд высоты!', W / 2, 298, 16, '#fff6e2');
  text('Счёт: ' + score + '  ·  идеальных: ' + runPerf + '  ·  серия: ' + runStreak, W / 2, 328, 16, 'rgba(255,255,255,.9)', 'normal');
  text(ch ? 'Цель: высота ' + ch.goal : md ? score > 0 && score >= (P.mb[md] || 0) ? 'Новый рекорд режима!' : 'Рекорд режима: ' + (P.mb[md] || 0) : score > 0 && score >= best() ? 'Новый рекорд!' : 'Рекорд: ' + best(), W / 2, 354, 17, 'rgba(255,255,255,.85)', 'normal');
  text('Монеты: +' + run + '   Опыт: +' + runXp, W / 2, 382, 19, '#ffd9a8');
  btn(408, 'Ещё раз', () => ch ? startChallenge(ch) : md ? startMode(md) : start());
  btn(472, ch ? 'К испытаниям' : 'В меню', () => {
    if (ch) {
      ch = null;
      reset();
      state = 'chal';
    } else
      toMenu();
  });
}

// Страницы общей статистики
function statPages() {
  const st = P.st, own = P.own, bought = own.h.length + own.b.length + own.t.length - 3;
  return [
    ['Игра', [
      ['Время в игре', fmtTime(st.time)],
      ['Партий сыграно', fmtNum(st.games)],
      ['Блоков построено', fmtNum(st.blocks)],
      ['Идеальных попаданий', fmtNum(st.perfects) + (st.blocks ? ' (' + Math.round(100 * st.perfects / st.blocks) + '%)' : '')],
      ['Лучшая высота', st.h + ' ' + plural(st.h, ['блок', 'блока', 'блоков'])],
      ['Лучший счёт в классике', fmtNum(best())],
      ['Лучшая серия идеальных', fmtNum(st.streak)],
      ['Дней в игре', fmtNum(st.dayCount || 1)],
      ['Серия заходов подряд', P.days + ' дн.']
    ]],
    ['Прогресс', [
      ['Уровень Строителя', P.hero.lv],
      ['Монет заработано', fmtNum(st.earned)],
      ['Монет потрачено', fmtNum(st.spent)],
      ['Монет сейчас', fmtNum(P.coins)],
      ['Достижений', Object.keys(P.ach).length + ' из ' + ACH.length],
      ['Испытаний пройдено', Object.keys(P.ch).length + ' из ' + CHAL.length],
      ['Дневных испытаний', fmtNum(st.dwins)],
      ['Фонов открыто', P.th.length + ' из ' + THEMES.length],
      ['Вещей куплено', bought + ' из ' + GEAR.length * (GEAR[0].length - 1)]
    ]],
    ['Бои', [
      ['Побед на арене', fmtNum(st.wins)],
      ['Врагов побеждено', Object.keys(P.beat).length + ' из ' + ENEMIES.length],
      ['Боссов побеждено', bossN() + ' из ' + ZONES.length],
      ['Критических ударов', fmtNum(st.crits)],
      ['Урона нанесено', fmtNum(st.dmg)],
      ['Лучшее комбо', '×' + st.combo],
      ['Походов в подземелье', fmtNum(st.dun)],
      ['Подземелье пройдено', fmtNum(st.dunClears) + ' раз'],
      ['Лучший поход', st.dunBest + ' из 6 этажей']
    ]],
    ['Режимы и бонусы', [
      ['Рекорд классики', fmtNum(P.mb.classic)],
      ['Рекорд «Ветер»', fmtNum(P.mb.wind)],
      ['Рекорд «Качающаяся башня»', fmtNum(P.mb.sway)],
      ['Рекорд «Гонка со временем»', fmtNum(P.mb.time)],
      ['Бонусов получено', fmtNum(st.bonus)],
      ['С нами с', st.since || '—']
    ]]
  ];
}

let statsTab = 0, statsPg = 0;

function drawStats() {
  dim();
  text('Статистика', W / 2, 52, 34, '#fff6e2');
  ['Общее', 'Рекорды'].forEach((t, i) => {
    const x = 90 + i * 160;
    hot.push({x, y: 66, w: 150, h: 30, fn: () => { statsTab = i; }});
    pill(x, 66, 150, 30, statsTab === i);
    text(t, x + 75, 87, 14, statsTab === i ? '#1a2036' : '#fff');
  });
  if (statsTab === 0) {
    const pages = statPages(), pg = pages[statsPg % pages.length];
    text(pg[0], W / 2, 124, 20, '#ffd9a8');
    pg[1].forEach(([k, v], i) => {
      const y = 138 + i * 44;
      card(40, y, 400, 38, false);
      text(k, 56, y + 24, 15, '#fff', 'normal', 'left');
      text(String(v), 424, y + 24, 16, '#ffd9a8', 'bold', 'right');
    });
    pager(statsPg, pages.length, v => statsPg = v, 548);
  } else {
    text('Лучшие партии в классике', W / 2, 124, 18, '#ffd9a8');
    if (!scores.length)
      text('Пока пусто — сыграйте!', W / 2, 200, 18, 'rgba(255,255,255,.8)', 'normal');
    scores.forEach((r, i) => {
      const y = 160 + i * 36;
      text(i + 1 + '.', 120, y, 20, 'rgba(255,255,255,.6)', 'normal', 'right');
      text(String(r.s), W / 2, y, 24, '#fff');
      text(r.d, 360, y, 15, 'rgba(255,255,255,.6)', 'normal', 'left');
    });
    wrap('Рекорды режимов башни — на вкладке «Общее», страница «Режимы и бонусы».', W / 2, 546, 400, 12, 'rgba(255,241,214,.65)', 15);
  }
  btn(H - 110, 'Назад', () => state = 'menu');
}

ACH.push(
  A('time1', '⏳', 'Час за башней', 'Провести в игре 1 час', 50, () => (P.st.time || 0) >= 3600),
  A('time10', '⌛', 'Десять часов', 'Провести в игре 10 часов', 200, () => (P.st.time || 0) >= 36000)
);
