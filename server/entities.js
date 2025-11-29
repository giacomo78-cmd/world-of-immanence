// server/entities.js
// simple entity factory & helpers

let nextId = 1;

function createEntity(type, opts = {}) {
  const id = `${type}_${nextId++}`;
  return {
    id,
    type,
    x: opts.x || 0,
    y: opts.y || 0,
    vx: 0,
    vy: 0,
    hp: opts.hp ?? (type === 'hero' ? 900 : 100),
    owner: opts.owner || null,
    state: 'idle'
  };
}

module.exports = { createEntity };
