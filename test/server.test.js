import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function client(url) {
  const ws = new WebSocket(url);
  const messages = [];
  ws.on('message', raw => messages.push(JSON.parse(String(raw))));
  return { ws, messages };
}
async function until(check, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = check(); if (result) return result;
    await delay(20);
  }
  throw new Error('Timed out waiting for server state');
}

test('online room create, join, start, turn action and reconnect', async () => {
  const port = 5200 + Math.floor(Math.random() * 500);
  const server = spawn(process.execPath, ['server/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
  const sockets = [];
  try {
    const url = `ws://127.0.0.1:${port}/ws`;
    let a;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { a = client(url); await new Promise((resolve, reject) => { a.ws.once('open', resolve); a.ws.once('error', reject); }); break; }
      catch { a?.ws.terminate(); await delay(100); }
    }
    assert.ok(a, 'server opened'); sockets.push(a.ws);
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
    a.ws.send(JSON.stringify({ type: 'ping' }));
    await until(() => a.messages.find(m => m.type === 'pong'));
    a.ws.send(JSON.stringify({ type: 'create', name: 'คนหนึ่ง' }));
    const joined = await until(() => a.messages.find(m => m.type === 'joined'));
    assert.equal(joined.code.length, 6);
    const b = client(url); sockets.push(b.ws); await new Promise(resolve => b.ws.once('open', resolve));
    b.ws.send(JSON.stringify({ type: 'join', code: joined.code, name: 'คนสอง' }));
    await until(() => b.messages.find(m => m.type === 'joined'));
    a.ws.send(JSON.stringify({ type: 'start' }));
    const started = await until(() => a.messages.find(m => m.type === 'state' && m.state.phase === 'playing'));
    assert.equal(started.state.players.length, 4);
    assert.equal(started.state.players.filter(p => p.bot).length, 2);
    a.ws.send(JSON.stringify({ type: 'action', action: { type: 'roll' } }));
    await until(() => a.messages.find(m => m.type === 'state' && m.state.lastRoll));
    a.ws.close(); await new Promise(resolve => a.ws.once('close', resolve));
    const c = client(url); sockets.push(c.ws); await new Promise(resolve => c.ws.once('open', resolve));
    c.ws.send(JSON.stringify({ type: 'resume', code: joined.code, token: joined.token }));
    const resumed = await until(() => c.messages.find(m => m.type === 'joined'));
    assert.equal(resumed.playerId, joined.playerId);
  } finally {
    for (const ws of sockets) ws.terminate();
    server.kill();
  }
});
