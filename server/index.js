import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { applyAction, actionsForBot, createGame } from '../src/game/engine.js';
import { ROLES } from '../src/game/data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || (dev ? '127.0.0.1' : '0.0.0.0');
const rooms = new Map();
const vite = dev ? await (await import('vite')).createServer({
  root, server: { middlewareMode: true }, appType: 'spa',
}) : null;

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.glb': 'model/gltf-binary', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  if (new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end('{"ok":true}');
    return;
  }
  if (dev) return vite.middlewares(req, res);
  const path = normalize(decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname));
  const safe = path.replace(/^[/\\]+/, '');
  let target = join(root, 'dist', safe || 'index.html');
  if (!target.startsWith(join(root, 'dist'))) { res.writeHead(403); res.end(); return; }
  try { if (!(await stat(target)).isFile()) target = join(root, 'dist', 'index.html'); }
  catch { target = join(root, 'dist', 'index.html'); }
  try {
    const data = await readFile(target);
    res.writeHead(200, { 'content-type': mime[extname(target)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8192 });
const cleanName = value => String(value || '').trim().replace(/[<>\x00-\x1f]/g, '').slice(0, 18) || 'ผู้เล่น';
const send = (ws, message) => { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); };
function roomCode() {
  let code;
  do { code = randomBytes(3).toString('hex').toUpperCase(); } while (rooms.has(code));
  return code;
}
function lobbyView(room) {
  return { phase: 'lobby', players: room.participants.map(({ token, ws, ...p }) => p), hostId: room.hostId };
}
function broadcast(room) {
  const state = room.game || lobbyView(room);
  for (const p of room.participants) {
    if (!p.ws) continue;
    if (!room.game) { send(p.ws, { type: 'state', code: room.code, state }); continue; }
    const view = structuredClone(state);
    for (const other of view.players) if (other.id !== p.id) {
      other.itemCount = other.items.length;
      other.items = [];
    }
    if (view.pending?.itemId && view.players[view.turn]?.id !== p.id) delete view.pending.itemId;
    send(p.ws, { type: 'state', code: room.code, state: view });
  }
}
function addParticipant(room, name, bot = false) {
  const availableRoles = Object.keys(ROLES).filter(role => !room.participants.some(participant => participant.role === role));
  const role = room.participants.length === 0 ? 'trainer' : availableRoles[Math.floor(Math.random() * availableRoles.length)] || 'trainer';
  const p = {
    id: randomUUID(), token: randomBytes(24).toString('hex'), name: cleanName(name),
    role, bot, connected: !bot, ws: null,
  };
  room.participants.push(p);
  return p;
}
function sendJoined(room, p) {
  send(p.ws, { type: 'joined', code: room.code, playerId: p.id, token: p.token });
  broadcast(room);
}
function start(room) {
  while (room.participants.length < 4) addParticipant(room, `บอท ${room.participants.length + 1}`, true);
  room.game = createGame(room.participants);
  broadcast(room);
  pumpBots(room);
}
function pumpBots(room) {
  if (room.botTimer || !room.game || room.game.phase !== 'playing') return;
  const choice = actionsForBot(room.game);
  if (!choice) return;
  room.botTimer = setTimeout(() => {
    room.botTimer = null;
    if (!room.game || room.game.phase !== 'playing') return;
    const next = actionsForBot(room.game);
    if (!next) return;
    applyAction(room.game, next.actorId, next.action);
    broadcast(room);
    pumpBots(room);
  }, room.game.step === 'battle_roll' ? 500 : 330);
}

wss.on('connection', ws => {
  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { send(ws, { type: 'error', message: 'ข้อมูลไม่ถูกต้อง' }); return; }
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'ping') { send(ws, { type: 'pong' }); return; }
    if (msg.type === 'create') {
      if (ws.room) return;
      const room = { code: roomCode(), participants: [], game: null, hostId: null, botTimer: null };
      const p = addParticipant(room, msg.name);
      p.ws = ws; ws.room = room; ws.playerId = p.id; room.hostId = p.id;
      rooms.set(room.code, room);
      sendJoined(room, p);
      if (msg.solo) start(room);
      return;
    }
    if (msg.type === 'join' || msg.type === 'resume') {
      if (ws.room) return;
      const room = rooms.get(String(msg.code || '').toUpperCase());
      if (!room) { send(ws, { type: 'error', message: 'ไม่พบห้องนี้' }); return; }
      let p;
      if (msg.token) p = room.participants.find(item => item.token === msg.token);
      if (!p && room.game) { send(ws, { type: 'error', message: 'เกมเริ่มแล้ว เข้าห้องใหม่ไม่ได้' }); return; }
      if (!p && room.participants.length >= 4) { send(ws, { type: 'error', message: 'ห้องเต็มแล้ว' }); return; }
      if (!p) p = addParticipant(room, msg.name);
      if (p.ws && p.ws !== ws) p.ws.close();
      p.ws = ws; p.connected = true; p.bot = false;
      ws.room = room; ws.playerId = p.id;
      if (room.game) {
        const gp = room.game.players.find(item => item.id === p.id);
        if (gp) { gp.connected = true; gp.bot = false; }
      }
      sendJoined(room, p); pumpBots(room); return;
    }
    const room = ws.room;
    const p = room?.participants.find(item => item.id === ws.playerId);
    if (!room || !p) return;
    if (!room.game) {
      if (msg.type === 'name') { p.name = cleanName(msg.name); broadcast(room); }
      if (msg.type === 'role' && ROLES[msg.role]) { p.role = msg.role; broadcast(room); }
      if (msg.type === 'start' && p.id === room.hostId) start(room);
      return;
    }
    if (msg.type === 'action' && msg.action && typeof msg.action === 'object') {
      const result = applyAction(room.game, p.id, msg.action);
      if (!result.ok) { send(ws, { type: 'error', message: result.error }); return; }
      broadcast(room); pumpBots(room);
    }
  });
  ws.on('close', () => {
    const room = ws.room;
    const p = room?.participants.find(item => item.id === ws.playerId);
    if (!p || p.ws !== ws) return;
    p.ws = null; p.connected = false;
    if (room.game) {
      const gp = room.game.players.find(item => item.id === p.id);
      if (gp) { gp.connected = false; gp.bot = true; }
      broadcast(room); pumpBots(room);
    } else {
      room.participants = room.participants.filter(item => item.id !== p.id);
      if (room.hostId === p.id) room.hostId = room.participants[0]?.id;
      if (room.participants.length === 0) rooms.delete(room.code);
      else broadcast(room);
    }
  });
});

server.listen(port, host, () => {
  console.log(`Game ready at http://${host}:${port}/`);
  if (host === '127.0.0.1') console.log('Set HOST=0.0.0.0 to allow other devices on your network.');
});
