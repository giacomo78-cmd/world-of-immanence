// client/main.js
// very small Canvas prototype - displays entities as circles and allows tap/click to move hero

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let width = canvas.width, height = canvas.height;

const net = new Net();

let localEntities = {};
let myPlayerId = null;
let myHeroId = null;

function draw() {
  ctx.clearRect(0, 0, width, height);

  // background
  ctx.fillStyle = '#072b2b';
  ctx.fillRect(0, 0, width, height);

  Object.values(localEntities).forEach(e => {
    const sx = e.x / 2;
    const sy = e.y / 2;

    if (e.type === 'hero') {
      // --- HERO COLOR BASED ON HP ---
      const maxHp = e.maxHp || 900;
      const hpRatio = e.hp / maxHp;

      if (hpRatio < 0.3) ctx.fillStyle = '#ef476f';      // low HP → red
      else if (hpRatio < 0.6) ctx.fillStyle = '#ffd166'; // medium → orange/yellow
      else ctx.fillStyle = '#06d6a0';                     // healthy → greenish

      // hero body
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();

      // --- HP BAR ---
      const barWidth = 24;
      const barHeight = 4;
      ctx.fillStyle = '#222';
      ctx.fillRect(sx - barWidth / 2, sy - 22, barWidth, barHeight);

      ctx.fillStyle = '#ef476f';
      ctx.fillRect(
        sx - barWidth / 2,
        sy - 22,
        barWidth * Math.max(0, hpRatio),
        barHeight
      );

      // id label
      ctx.fillStyle = '#000';
      ctx.fillText(e.id, sx - 10, sy - 28);

    } else if (e.type === 'monster') {
      // monster body
      ctx.fillStyle = e.state === 'chasing' ? '#ff0054' : '#ef476f';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();

    } else {
      ctx.fillStyle = '#6be3c9';
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);*
