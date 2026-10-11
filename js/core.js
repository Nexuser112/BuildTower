/*
 * 01. core.js — Основа: размеры игрового поля, холст, масштабирование и локальная таблица рекордов.
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

const W = 480, H = 720, BH = 26, BASE_W = 230, BASE_Y = H - 140;
const cv = document.getElementById('c'), ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
cv.width = W * dpr;
cv.height = H * dpr;

function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = W * s + 'px';
  cv.style.height = H * s + 'px';
}
addEventListener('resize', fit);
fit();

// ---- рекорды (localStorage) ----
let scores = [];
try {
  scores = JSON.parse(localStorage.getItem('tower-scores') || '[]');
} catch (e) {
}

const best = () => scores.length ? scores[0].s : 0;

function saveScore(s) {
  if (s <= 0)
    return;
  scores.push({
    s,
    d: new Date().toLocaleDateString('ru-RU')
  });
  scores.sort((a, b) => b.s - a.s);
  scores = scores.slice(0, 10);
  try {
    localStorage.setItem('tower-scores', JSON.stringify(scores));
  } catch (e) {
  }
}
