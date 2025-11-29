// server/world.js
// world simulation helpers: init, update tick, simple AI and immanence stub

const { createEntity } = require('./entities');
const cfg = require('./config');

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

  // simple monster wander (disabled in safeMode)
  Object.values(room.entities).forEach(e => {
    if (e.type === 'monster' && !room.safeMode) {
      if (Math.random() < 0.02) {
        e.vx = (Math.random() - 0.5) * 2;
        e.vy = (Math.random() - 0.5) * 2;
      }
    }
  });
}

function immanencePulse(room) {
  // Demo stub: minor HP variation for monsters
  Object.values(room.entities).forEach(e => {
    if (e.type === 'monster') {
      e.hp = Math.max(1, Math.round(e.hp * (1 + (Math.random() - 0.5) * 0.08)));
    }
  });
}

module.exports = { initWorld, updateWorld, immanencePulse };