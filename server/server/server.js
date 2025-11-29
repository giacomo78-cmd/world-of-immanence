// server/server.js
// Main server (WebSocket + simple HTTP admin). Beginner-friendly scaffold.

const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const cfg = require('./config');
const { initWorld, updateWorld, immanencePulse } = require('./world');
const { saveSnapshot, loadSnapshot } = require('./snapshot');

const room = {
  id: cfg.ROOM_ID,
  tick: 0,
  running: false,
  safeMode: false,
  players: {},   // playerId -> { ws }
  entities: {},
  inputQueue: []
};

let tickTimer = null;
let noPlayerTimer = null;

function startTickLoop() {
  stopTickLoop();
  const ms = room.safeMode ? cfg.SAFE_MODE_TICK_MS : cfg.TICK_MS;
  tickTimer = setInterval(processTick, ms);
  room.running = true;
  console.log('Tick loop started @', ms, 'ms');
}

function stopTickLoop() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
  room.running = false;
}

function scheduleAutoFreeze() {
  if (Object.keys(room.players).length === 0 && !noPlayerTimer) {
    noPlayerTimer = setTimeout(() => {
      console.log('Auto-freeze triggered');
      fullFreeze();
    }, cfg.AUTO_FREEZE_SECONDS * 1000);

    console.log('Auto-freeze scheduled in', cfg.AUTO_FREEZE_SECONDS, 's');
  } else if (Object.keys(room.players).length > 0 && noPlayerTimer) {
    clearTimeout(noPlayerTimer);
    noPlayerTimer = null;
  }
}

function processTick() {
  // apply queued inputs
  const toApply = room.inputQueue.splice(0);
  toApply.forEach(item => {
    (item.actions || []).forEach(a => {
      if (a.type === 'move' && room.entities[a.entityId]) {
        const e = room.entities[a.entityId];
        const dx = a.x - e.x;
        const dy = a.y - e.y;
        const len = Math.max(0.001, Math.hypot(dx, dy));
        const speed = a.speed || 2;
        e.vx = (dx / len) * speed;
        e.vy = (dy / len) * speed;
        e.state = 'moving';
      } else if (a.type === 'stop' && room.entities[a.entityId]) {
        const e = room.entities[a.entityId];
        e.vx = 0;
        e.vy = 0;
        e.state = 'idle';
      }
    });
  });

  // update world
  updateWorld(room);

  // immanence pulse periodically
  if (!room.safeMode && room.tick % 300 === 0) {
    immanencePulse(room);
    console.log('Immanence pulse at tick', room.tick);
  }

  // broadcast snapshot
  const snapshot = JSON.stringify({
    t: 'snapshot',
    tick: room.tick,
    entities: room.entities
  });

  Object.values(room.players).forEach(p => {
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(snapshot);
    }
  });

  room.tick++;
}

function fullFreeze() {
  console.log('Performing full freeze (snapshot + stop)');
  saveSnapshot(room);
  stopTickLoop();
  room.safeMode = false;
}

function enterSafeMode() {
  room.safeMode = true;
  startTickLoop();
  console.log('Entered safe neutral mode');
}

function resumeFromSnapshot() {
  try {
    loadSnapshot(room);
    startTickLoop();
    console.log('Resumed from snapshot at tick', room.tick);
  } catch (err) {
    console.warn('No snapshot found, creating new world');
    initWorld(room);
    startTickLoop();
  }
}

// --- WebSocket server ---
const wss = new WebSocket.Server({ port: cfg.WS_PORT });

wss.on('connection', ws => {
  console.log('New WebSocket connection');

  ws.on('message', raw => {
    try {
      const m = JSON.parse(raw);

      if (m.t === 'join') {
        const pid = m.playerId || `p${Math.floor(Math.random() * 10000)}`;
        room.players[pid] = { ws, meta: m.meta || {} };

        console.log('Player joined', pid);

        ws.send(JSON.stringify({
          t: 'welcome',
          playerId: pid,
          roomId: room.id,
          tick: room.tick
        }));

        ws.send(JSON.stringify({
          t: 'snapshot',
          tick: room.tick,
          entities: room.entities
        }));

        scheduleAutoFreeze();

      } else if (m.t === 'input') {
        room.inputQueue.push(m);

      } else if (m.t === 'leave') {
        const pid = m.playerId;
        delete room.players[pid];
        scheduleAutoFreeze();

      } else if (m.t === 'admin') {
        if (m.op === 'freeze') fullFreeze();
        if (m.op === 'safe') enterSafeMode();
        if (m.op === 'resume') resumeFromSnapshot();
      }

    } catch (e) {
      console.error('WS message parse error', e);
    }
  });

  ws.on('close', () => {
    for (const pid in room.players) {
      if (room.players[pid].ws === ws) {
        delete room.players[pid];
        console.log('Player disconnected:', pid);
        scheduleAutoFreeze();
        break;
      }
    }
  });
});

console.log('WebSocket server listening on ws://localhost:' + cfg.WS_PORT);

// --- Admin HTTP ---
const app = express();
app.use(bodyParser.json());

app.get('/status', (req, res) => {
  res.json({
    roomId: room.id,
    tick: room.tick,
    safeMode: room.safeMode,
    players: Object.keys(room.players).length,
    entities: Object.keys(room.entities).length
  });
});

app.post('/admin/save', (req, res) => {
  saveSnapshot(room);
  res.json({ ok: true });
});

app.post('/admin/freeze', (req, res) => {
  fullFreeze();
  res.json({ ok: true });
});

app.post('/admin/safe', (req, res) => {
  enterSafeMode();
  res.json({ ok: true });
});

app.post('/admin/resume', (req, res) => {
  resumeFromSnapshot();
  res.json({ ok: true });
});

app.listen(cfg.HTTP_PORT, () => {
  console.log('Admin HTTP listening on http://localhost:' + cfg.HTTP_PORT);
});

// bootstrap world
initWorld(room);
startTickLoop();