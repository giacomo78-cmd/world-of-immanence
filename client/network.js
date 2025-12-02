// client/network.js
// simple websocket wrapper - change WS_HOST if needed

const WS_HOST = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'ws://localhost:3001'
  : `wss://${location.hostname}:3001`;

class Net {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.onSnapshot = () => {};
    this.onWelcome = () => {};
  }

  connect(desiredId) {
    this.ws = new WebSocket(WS_HOST);

    this.ws.onopen = () => {
      console.log('ws open');
      this.send({ t: 'join', playerId: desiredId });
    };

    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.t === 'welcome') { this.playerId = m.playerId; this.onWelcome(m); }
      if (m.t === 'snapshot') { this.onSnapshot(m); }
    };

    this.ws.onclose = () => console.log('ws close');
  }

  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }
}

window.Net = Net;