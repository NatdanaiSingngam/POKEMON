import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';

const port = 5200 + Math.floor(Math.random() * 500);
const child = spawn(process.execPath, ['server/index.js'], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
  stdio: 'ignore',
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for the server to bind. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Production server did not start');

  const page = await fetch(`http://127.0.0.1:${port}/?room=ABC123`);
  if (!page.ok || !(await page.text()).includes('ศึกยอดนักขาย')) throw new Error('Invite page failed');

  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  socket.send(JSON.stringify({ type: 'ping' }));
  const reply = await new Promise((resolve, reject) => {
    socket.once('message', raw => resolve(JSON.parse(String(raw))));
    setTimeout(() => reject(new Error('WebSocket timeout')), 2000);
  });
  socket.close();
  if (reply.type !== 'pong') throw new Error('WebSocket heartbeat failed');
  console.log('Production HTTP, invite URL, and WebSocket: OK');
} finally {
  child.kill();
}
