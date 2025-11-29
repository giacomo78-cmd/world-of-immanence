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
  ctx.clearRect(0,0,width,height);

  ctx.fillStyle = '#072b2b';
  ctx.fillRect(0,0,width,height);

  Object.values(localEntities).forEach(e => {
    if (e.type === 'hero') {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(e.x/2, e.y/2, 12, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.fillText(e.id, e.x/2 - 10, e.y/2 - 18);

    } else if (e.type === 'monster') {
      ctx.fillStyle = '#ef476f';
      ctx.beginPath();
      ctx.arc(e.x/2, e.y/2, 10, 0, Math.PI*2);
      ctx.fill();

    } else {
      ctx.fillStyle = '#6be3c9';
      ctx.beginPath();
      ctx.arc(e.x/2, e.y/2, 6, 0, Math.PI*2);
      ctx.fill();
    }
  });

  requestAnimationFrame(draw);
}

net.onWelcome = (m) => {
  myPlayerId = m.playerId;
  document.getElementById('status').textContent = `Player: ${myPlayerId} | tick:${m.tick}`;
};

net.onSnapshot = (snap) => {
  localEntities = snap.entities || {};

  if (!myHeroId) {
    for (const id in localEntities) {
      const e = localEntities[id];
      if (e.owner === myPlayerId && e.type === 'hero') {
        myHeroId = e.id;
        break;
      }
    }
  }

  document.getElementById('status').textContent =
    `Player: ${myPlayerId} | tick:${snap.tick} | ents:${Object.keys(localEntities).length}`;
};

canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const cx = ev.clientX - rect.left;
  const cy = ev.clientY - rect.top;

  const tx = cx * 2;
  const ty = cy * 2;

  if (!myHeroId) return;

  net.send({
    t: 'input',
    playerId: myPlayerId,
    seq: Date.now(),
    tick: 0,
    actions: [{ type: 'move', entityId: myHeroId, x: tx, y: ty, speed: 4 }]
  });
});

document.getElementById('btnFreeze').onclick = () =>
  fetch('/admin/freeze', { method: 'POST' });

document.getElementById('btnSafe').onclick = () =>
  fetch('/admin/safe', { method: 'POST' });

document.getElementById('btnResume').onclick = () =>
  fetch('/admin/resume', { method: 'POST' });

net.connect('player1');
draw();