/*
 * 18. main.js — Главный цикл и запуск игры.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

let last = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  chip();
  gearBtn();
  drawToast();
  musicSync();
  requestAnimationFrame(loop);
}
try {
  document.fonts.load('40px "Lilita One"');
} catch (e) {
}
dailyInit();
pickTheme();
reset();
requestAnimationFrame(loop);
