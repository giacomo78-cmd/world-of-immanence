// server/world.js
const { createEntity } = require('./entities');
const cfg = require('./config');

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(dx, dy) {
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

function initWorld(room) {
  room.tick = 0;
  room.safeMode = false;
  room.entities = {};
  room.nextEntityId = 1;

  const hero = createEntity('hero', {
    x: 100,
    y: 120,
    hp: 900,
    owner: 'player1'
  });

  const monster = createEntity('monster', {
    x: 350,
    y: 200,
    hp: 200
  });

  room.entities[hero.id] = hero;
  room.entities[monster.id] = monster;
}

function updateWorld(room) {
  Object.values(room.entities).forEach(e => {
    e.x += e.vx || 0;
    e.y += e.vy || 0;
    e.x = Math.max(0, Math.min(2000, e.x));
    e.y = Math.max(0, Math.min(2000, e.y));
  });

  const hero = Object.values(room.entities).find(e => e.type === 'hero');

  Object.values(room.entities).forEach(e => {
    if (e.type !== 'monster' || room.safeMode || !hero) return;

    const d = distance(e, hero);

    if (d < 250) {
      const dir = normalize(hero.x - e.x, hero.y - e.y);
      e.vx = dir.x * 1.5;
      e.vy = dir.y * 1.5;
      e.state = 'chasing';
      e.aiTimer = null;
    } else {
      if (!e.aiTimer || Date.now() > e.aiTimer) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5;
        e.vx = Math.cos(angle) * speed;
        e.vy = Math.sin(angle) * speed;
        e.aiTimer = Date.now() + 1000 + Math.random() * 2000;
        e.state = 'wandering';
      }
    }
  });
  // combat: monster damages hero on contact
Object.values(room.entities).forEach(e => {
  if (e.type !== 'monster') return;

  const hero = Object.values(room.entities).find(x => x.type === 'hero');
  if (!hero) return;

  const dx = hero.x - e.x;
  const dy = hero.y - e.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 25) {
    hero.hp -= 1;
    hero.state = 'hit';
  }
});
}

function immanencePulse(room) {
  Object.values(room.entities).forEach(e => {
    if (e.type === 'monster') {
      e.hp = Math.max(
        1,
        Math.round(e.hp * (1 + (Math.random() - 0.5) * 0.08))
      );
    }
  });
}

module.exports = {
  initWorld,
  updateWorld,
  immanencePulse
};
