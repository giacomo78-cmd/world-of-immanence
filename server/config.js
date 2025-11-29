// server/config.js
module.exports = {
  ROOM_ID: 'room-1',
  TICK_MS: 100,            // 10 Hz
  SAFE_MODE_TICK_MS: 1000, // 1 Hz for safe/neutral mode
  AUTO_FREEZE_SECONDS: 120,
  SNAPSHOT_DIR: './snapshots',
  WS_PORT: process.env.WS_PORT || 3001,
  HTTP_PORT: process.env.HTTP_PORT || 3000
};
