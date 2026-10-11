/*
 * 02. audio.js — Звуковые эффекты: короткие тоны, которые синтезируются через Web Audio API (файлов нет).
 * (часть игры BuildTower; файлы подключаются по порядку, общие переменные — глобальные)
 */

// ---- звук (Web Audio, без файлов) ----
let AC, muted = false;

function snd(f, d, type, v, f2) {
  if (muted)
    return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (f2)
      o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime((v || 0.15) * sVol(), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g);
    g.connect(AC.destination);
    o.start();
    o.stop(t + d);
  } catch (e) {
  }
}
