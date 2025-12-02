// server/world.js
// world simulation helpers: init, update tick, simple AI and immanence stub

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

  // spawn demo hero+monster
  const hero = createEntity('hero', { x: 100, y: 120, hp: 900, owner: 'player1' });
  const monster = createEntity('monster', { x: 350, y: 200, hp: 200 });
  room.entities[hero.id] = hero;
  room.entities[monster.id] = monster;
}

function updateWorld(room) {
  // apply velocities
  Object.values(room.entities).forEach(e => {
    e.x += (e.vx || 0);
    e.y += (e.vy || 0);

    // clamp to world size
    e.x = Math.max(0, Math.min(2000, e.x));
    e.y = Math.max(0, Math.min(2000, e.y));
  });

  // monster AI: chase hero if close, otherwise wander
const hero = Object.values(room.entities).find(e => e.type === 'hero');

Object.values(room.entities).forEach(e => {
  if (e.type !== 'monster' || room.safeMode || !hero) return;

  const d = distance(e, hero);

  if (d < 250) {
    // CHASE HERO
    const dir = normalize(hero.x - e.x, hero.y - e.y);
    e.vx = dir.x * 1.5;
    e.vy = dir.y * 1.5;
    e.state = 'chasing';
    e.aiTimer = null; // override wandering timer
  } else {
    // WANDER (your original logic)
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

function immanencePulse(room) {
  // Demo stub: minor HP variation for monsters
  Object.values(room.entities).forEach(e => {
    if (e.type === 'monster') {
      e.hp = Math.max(1, Math.round(e.hp * (1 + (Math.random() - 0.5) * 0.08)));
    }
  });
}

module.exports = { initWorld, updateWorld, immanencePulse };
