/*
 * 11. input.js — Ввод: нажатия мышью/пальцем, клавиатура, автопауза при сворачивании вкладки.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

// ---- ввод ----
let drag = null;   // ползунок, который сейчас тянут
addEventListener('pointerdown', e => {
  e.preventDefault();
  actx();
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  const h = hot.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  if (h && h.drag) {
    drag = h;
    h.drag(x);
    return;
  }
  if (h) {
    snd(620, 0.06, 'square', 0.06);
    h.fn();
    return;
  }
  if (state === 'play')
    drop();
  else if (state === 'battle')
    battleTap();
});
addEventListener('pointermove', e => {
  if (!drag)
    return;
  const r = cv.getBoundingClientRect();
  drag.drag((e.clientX - r.left) * W / r.width);
});
const endDrag = () => {
  if (drag && drag.done)
    drag.done();
  drag = null;
};
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);
addEventListener('keydown', e => {
  if (e.repeat)
    return;
  actx();
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (state === 'play')
      drop();
    else if (state === 'battle')
      battleTap();
    else if (state === 'menu' || state === 'over')
      ch && state === 'over' ? startChallenge(ch) : md && state === 'over' ? startMode(md) : start();
  } else if (e.code === 'Escape' || e.code === 'KeyP') {
    state === 'play' ? pause() : resume();
  } else if (e.code === 'KeyM')
    toggleSfx();
  else if (e.code === 'KeyN')
    toggleMusic();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pause();
    saveP();
    if (AC)
      AC.suspend();
  } else if (AC)
    AC.resume();
});
