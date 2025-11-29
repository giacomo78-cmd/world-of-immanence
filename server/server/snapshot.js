// server/snapshot.js
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

function ensureSnapshotDir() {
  if (!fs.existsSync(cfg.SNAPSHOT_DIR)) {
    fs.mkdirSync(cfg.SNAPSHOT_DIR, { recursive: true });
  }
}

function snapshotPath(roomId) {
  return path.join(cfg.SNAPSHOT_DIR, `${roomId}.json`);
}

function saveSnapshot(room) {
  ensureSnapshotDir();

  const payload = {
    id: room.id,
    tick: room.tick,
    safeMode: room.safeMode,
    entities: room.entities,
    meta: { savedAt: new Date().toISOString() }
  };

  fs.writeFileSync(snapshotPath(room.id), JSON.stringify(payload, null, 2));
  console.log('Snapshot saved for room', room.id);
}

function loadSnapshot(room) {
  const p = snapshotPath(room.id);

  if (!fs.existsSync(p)) {
    throw new Error('Snapshot not found');
  }

  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);

  room.tick = data.tick;
  room.safeMode = data.safeMode;
  room.entities = data.entities;

  console.log('Snapshot loaded for room', room.id, 'tick', room.tick);
}

module.exports = { saveSnapshot, loadSnapshot, snapshotPath };