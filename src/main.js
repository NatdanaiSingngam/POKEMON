import './style.css';
import './motion.css';
import './art.css';
import './hud.css';
import './encounter.css';
import './roll.css';
import './game-layout.css';
import './battle.css';
import './announcement.css';
import './shop.css';
import './roles.css';
import { createBoard } from './board.js';
import { BALLS, EVOLUTIONS, ITEMS, MAX_ITEMS, POKEMON, QUESTS, ROLES, SHOP_ITEMS, ZONES } from './game/data.js';
import { badgeRequirement } from './game/engine.js';
import { monArt } from './game/art.js';
import { POKEDEX, pokemonPortrait } from './game/artwork.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const ROLE_SYMBOLS = { trainer: '◉', fisher: '♒', scientist: '✚', rocket: 'R', breeder: '✿', ranger: '✦', merchant: '◈', courier: '➜', collector: '◇', battler: '⚔' };
const rolePreview = (id, role) => `<span class="role-portrait role-${id}" style="--role:${role.color}" aria-hidden="true"><span class="role-portrait-hair"></span><span class="role-portrait-face"></span><span class="role-portrait-body"></span><span class="role-portrait-hat"></span><span class="role-portrait-mark">${ROLE_SYMBOLS[id] || '◉'}</span></span>`;
const board = createBoard($('world'));
let socket, state, playerId, code, token, selectedSale = new Set(), toastTimer;
const params = new URLSearchParams(location.search);
let remembered = JSON.parse(localStorage.getItem('pokemon-board-session') || 'null');
if (params.get('room') && params.get('room').toUpperCase() !== remembered?.code) remembered = null;
let name = localStorage.getItem('pokemon-board-name') || '';
let suspense = null;
let arrivalPending = false;
let arrivalPlayerId = null;
let arrivalCheckScheduled = false;
let openDetails = null;
let heartbeatTimer;
let announcementQueue = [];
let activeAnnouncement = null;
let announcementTimer = null;
let seenAnnouncementId = 0;

function advanceAnnouncement() {
  clearTimeout(announcementTimer);
  activeAnnouncement = announcementQueue.shift() || null;
  if (activeAnnouncement) {
    const delay = { item: 1800, battleRoll: 2000, catch: 2300, battle: 2600, quest: 3100, event: 3200, cave: 2600 }[activeAnnouncement.kind] || 2400;
    announcementTimer = setTimeout(() => {
      if (activeAnnouncement?.kind === 'event' && state?.step === 'event_result' && state.notice?.id === activeAnnouncement.noticeId && state.players[state.turn]?.id === playerId) act({ type: 'ackEvent' });
      activeAnnouncement = null; advanceAnnouncement(); render();
    }, delay);
  }
}
function collectAnnouncements(next) {
  const incoming = (next.announcements || []).filter(entry => entry.id > seenAnnouncementId);
  if (incoming.length) {
    seenAnnouncementId = Math.max(...incoming.map(entry => entry.id));
    announcementQueue.push(...incoming);
    if (!activeAnnouncement) advanceAnnouncement();
  }
}

function waitForArrival() {
  if (!arrivalPending) { arrivalCheckScheduled = false; return; }
  if (board.isMoving(arrivalPlayerId)) { requestAnimationFrame(waitForArrival); return; }
  arrivalPending = false;
  arrivalPlayerId = null;
  arrivalCheckScheduled = false;
  render();
}

function applyState(next, roomCode) {
  state = next; code = roomCode; selectedSale.clear(); board.sync(state);
  collectAnnouncements(next);
  arrivalPlayerId = state?.step === 'capture' ? state.players[state.turn]?.id : null;
  arrivalPending = Boolean(arrivalPlayerId && board.isMoving(arrivalPlayerId));
  render();
  if (arrivalPending && !arrivalCheckScheduled) { arrivalCheckScheduled = true; requestAnimationFrame(waitForArrival); }
}
function suspenseValue(next, kind) {
  if (kind === 'catch') return next.lastCatch?.playerId === playerId ? next.lastCatch.value : null;
  if (kind === 'move') return next.lastRoll?.playerId === playerId ? next.lastRoll.value : null;
  const battleRoll = next.battle?.rolls?.[playerId];
  if (battleRoll !== undefined) return battleRoll;
  const ownName = next.players.find(p => p.id === playerId)?.name;
  const line = next.log.find(entry => entry.startsWith(`${ownName} ทอยต่อสู้ได้ `));
  return line ? Number(line.match(/ทอยต่อสู้ได้ (\d)/)?.[1]) : null;
}
function drawSuspense(stage, value) {
  if (!suspense) return;
  const { kind, result } = suspense;
  const caption = kind === 'catch' ? 'ทอยจับโปเกมอน' : kind === 'battle' ? 'ทอยเต๋าต่อสู้' : 'ทอยเต๋าเดิน';
  const outcome = kind === 'catch' && result ? (result.success ? 'จับสำเร็จ!' : 'จับไม่สำเร็จ') : kind === 'battle' ? 'แต้มต่อสู้' : 'เดินบนกระดาน';
  $('rollOverlay').innerHTML = `<div class="roll-shade ${kind === 'battle' ? 'battle-roll-shade' : ''}"><div class="roll-card ${stage === 'rolling' ? 'is-rolling' : 'is-result'} ${kind === 'catch' ? 'roll-catch' : kind === 'battle' ? 'roll-battle' : ''}" role="status"><div class="roll-label">${stage === 'rolling' ? caption : outcome}</div><div class="roll-die"><span id="rollNumber">${value ?? '?'}</span></div><div class="roll-detail">${stage === 'rolling' ? 'กำลังทอย…' : `ทอยได้ ${value ?? '—'}${kind === 'catch' && result ? ` · ${esc(POKEMON[result.species].name)}` : ''}`}</div></div></div>`;
}
function finishSuspense() {
  if (!suspense) return;
  clearInterval(suspense.interval); clearTimeout(suspense.timer); clearTimeout(suspense.watchdog);
  const latest = suspense.latest;
  suspense = null;
  $('rollOverlay').innerHTML = '';
  if (latest) {
    applyState(latest.state, latest.code);
  }
}
function revealSuspense() {
  if (!suspense?.latest) return;
  clearInterval(suspense.interval);
  const value = suspense.outcomeValue ?? suspense.value;
  suspense.result = suspense.outcomeCatch || null;
  drawSuspense('result', value);
  suspense.timer = setTimeout(finishSuspense, 1400);
}
function beginSuspense(kind) {
  if (suspense) return false;
  if (socket?.readyState !== WebSocket.OPEN) { toast('ยังไม่เชื่อมต่อเซิร์ฟเวอร์'); return false; }
  suspense = { kind, started: performance.now(), value: 1, latest: null, result: null, interval: null, timer: null, watchdog: null, revealing: false };
  drawSuspense('rolling', 1);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) suspense.interval = setInterval(() => {
    if (!suspense || suspense.revealing) return;
    suspense.value = suspense.value % 6 + 1;
    const face = $('rollNumber'); if (face) face.textContent = suspense.value;
  }, 85);
  suspense.watchdog = setTimeout(() => { if (suspense && !suspense.latest) { finishSuspense(); toast('ยังไม่ได้รับผลทอย ลองอีกครั้ง'); } }, 7000);
  return true;
}
function queueSuspenseState(next, roomCode) {
  if (!suspense.latest) {
    suspense.outcomeValue = suspenseValue(next, suspense.kind);
    suspense.outcomeCatch = suspense.kind === 'catch' ? next.lastCatch : null;
  }
  suspense.latest = { state: next, code: roomCode };
  if (suspense.revealing) return;
  suspense.revealing = true;
  const elapsed = performance.now() - suspense.started;
  suspense.timer = setTimeout(revealSuspense, Math.max(0, 1150 - elapsed));
}

function send(type, extra = {}) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...extra })); else toast('ยังไม่เชื่อมต่อเซิร์ฟเวอร์'); }
function act(action) { send('action', { action }); }
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3600); }
function inviteUrl() { return `${location.origin}${location.pathname}?room=${encodeURIComponent(code)}`; }
function copyInviteLink() { navigator.clipboard.writeText(inviteUrl()).then(() => toast('คัดลอกลิงก์ชวนเพื่อนแล้ว')).catch(() => toast(`รหัสห้อง ${code}`)); }
function connect() {
  socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  socket.onopen = () => {
    $('connection').textContent = '● ออนไลน์';
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' })); }, 60000);
    if (remembered?.code && remembered?.token) send('resume', { code: remembered.code, token: remembered.token });
    else render();
  };
  socket.onclose = () => { clearInterval(heartbeatTimer); finishSuspense(); $('connection').textContent = '● ขาดการเชื่อมต่อ'; setTimeout(connect, 1800); };
  socket.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'error') { finishSuspense(); toast(msg.message); if (!state && remembered) { localStorage.removeItem('pokemon-board-session'); remembered = null; history.replaceState(null, '', location.pathname); render(); } return; }
    if (msg.type === 'joined') {
      code = msg.code; token = msg.token; playerId = msg.playerId;
      remembered = { code, token, playerId };
      localStorage.setItem('pokemon-board-session', JSON.stringify(remembered));
      history.replaceState(null, '', `?room=${code}`);
      $('roomBadge').hidden = false; $('roomBadge').textContent = `ห้อง ${code} ⧉`;
    }
    if (msg.type === 'state') { if (suspense) queueSuspenseState(msg.state, msg.code); else applyState(msg.state, msg.code); }
  };
}
function monCard(mon, selectable = false, badges = 0) {
  const data = POKEMON[mon.species];
  return `<button class="monster-card ${mon.hp <= 0 ? 'fainted' : ''} ${selectedSale.has(mon.uid) ? 'selected' : ''}" ${selectable ? `data-sale="${esc(mon.uid)}"` : 'disabled'}><span class="mon-icon">${pokemonPortrait(mon.species)}</span><span><b>${esc(data.name)}</b><br>HP ${mon.hp}/${data.hp} · ⚔ ${data.power}<br>ขาย ${data.price}${data.ability === 'sale' ? '+1' : ''} เหรียญ<br>${badges < badgeRequirement(mon.species) ? `🔒 ต้องมีเหรียญตรา ${badgeRequirement(mon.species)} เหรียญจึงใช้สู้ได้` : esc(data.abilityText)}</span></button>`;
}
function playerHudHtml() {
  return state?.players?.map((p, i) => `<div class="hud-player hud-${i} ${state.turn === i && state.phase === 'playing' ? 'on-turn' : ''} ${p.done ? 'done' : ''}" style="--hud:${ROLES[p.role]?.color || '#75b78a'}"><div class="hud-photo">${pokemonPortrait(ROLES[p.role]?.starter, 'hud-portrait')}<strong>${esc(p.name)}</strong></div><div class="hud-meta"><span>${esc(ROLES[p.role]?.name || '')}</span><span>รอบ ${p.laps}/3 · 🏅 ${p.badges?.length || 0}/2</span></div><div class="hud-resources"><span class="hud-coin">🪙 ${p.coins}</span>${Object.entries(BALLS).map(([id]) => `<span class="hud-ball hud-ball-${id}">◉ ${p.balls[id]}</span>`).join('')}</div><div class="hud-team">${Array.from({ length: 6 }, (_, slot) => p.pokemon[slot] ? `<span class="hud-mon" title="${esc(POKEMON[p.pokemon[slot].species].name)}">${pokemonPortrait(p.pokemon[slot].species)}</span>` : '<span class="hud-mon empty">·</span>').join('')}</div></div>`).join('') || '';
}
function itemList(me, battle = false) {
  const allowed = battle ? state.battle?.sides.includes(playerId) : state.players[state.turn]?.id === playerId && ['roll', 'shop'].includes(state.step);
  const targets = state.players.filter(p => p.id !== me.id && !p.done);
  return me.items.length ? me.items.map((id, index) => {
    const item = ITEMS[id];
    const canUse = allowed && item.timing === (battle ? 'battle' : 'outside') && (!battle || !state.battle.usedItem.includes(playerId)) && (!item.move || state.step === 'roll') && (item.target !== 'other' || targets.length > 0) && (id !== 'rare_candy' || me.pokemon.some(mon => EVOLUTIONS[mon.species]));
    const targetPicker = canUse && !battle && item.target === 'other' ? `<select class="field item-target" aria-label="เลือกคู่แข่ง">${targets.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>` : canUse && id === 'rare_candy' ? `<select class="field item-target" aria-label="เลือกโปเกมอนที่จะพัฒนาร่าง">${me.pokemon.filter(mon => EVOLUTIONS[mon.species]).map(mon => `<option value="${esc(mon.uid)}">${esc(POKEMON[mon.species].name)} → ${esc(POKEMON[EVOLUTIONS[mon.species]].name)}</option>`).join('')}</select>` : '';
    const iconFile = SHOP_ITEMS.includes(id) ? id.replaceAll('_', '-') : null;
    return `<div class="item-card"><span class="item-icon">${iconFile ? `<img src="/shop-icons/${iconFile}.png" alt="">` : item.icon}</span><div class="item-copy"><strong>${item.name}</strong>${item.text}<br><span class="muted">${item.timing === 'battle' ? 'ระหว่างสู้' : 'นอกการสู้'} · ${item.target === 'other' ? 'คู่แข่ง' : 'ตัวเอง'}</span>${targetPicker}</div>${canUse ? `<button class="btn small" data-use-item="${index}">ใช้</button>` : ''}</div>`;
  }).join('') : '<p class="muted">ยังไม่มีการ์ดไอเทม</p>';
}
function shopHtml() {
  const me = state.players[state.turn];
  const ballSprites = { basic: 'poke-ball', great: 'great-ball', ultra: 'ultra-ball' };
  const balls = Object.entries(BALLS).map(([id, ball]) => `<button class="shop-ball" data-buy="${id}" ${me.coins < ball.price ? 'disabled' : ''} aria-label="ซื้อ${esc(ball.name)} ${ball.price} เหรียญ"><img src="/shop-icons/${ballSprites[id]}.png" alt=""><span>${esc(ball.name)}</span><b>🪙 ${ball.price}</b></button>`).join('');
  const items = SHOP_ITEMS.map(id => { const item = ITEMS[id]; return `<button class="shop-card" data-buy="${id}" ${me.coins < item.price || me.items.length >= MAX_ITEMS ? 'disabled' : ''} aria-label="ซื้อ${esc(item.name)} ${item.price} เหรียญ"><span class="shop-card-title">${esc(id.replaceAll('_', ' ').toUpperCase())}</span><img src="/shop-icons/${id.replaceAll('_', '-')}.png" alt=""><span class="shop-card-text">${esc(item.text)}</span><b>🪙 ${item.price}</b></button>`; }).join('');
  return `<div class="shop-shade"><section class="shop-panel" role="dialog" aria-modal="true" aria-label="ร้านค้าโปเกมอน"><div class="shop-header"><div><small>POKÉ MART</small><h2>ร้านค้า</h2></div><strong>🪙 ${me.coins}</strong></div><div class="shop-grid-pixel">${balls}${items}</div><p class="shop-limit">การ์ดไอเทม ${me.items.length}/${MAX_ITEMS} · กดการ์ดเพื่อซื้อ</p><button class="btn shop-exit" data-act="leaveShop">ออกจากร้านค้า</button></section></div>`;
}
function captureModalHtml() {
  if (arrivalPending || state?.phase !== 'playing' || state.step !== 'capture') return '';
  const me = state.players[state.turn];
  const spectating = me?.id !== playerId;
  const encounter = state.pending;
  const pokemon = POKEMON[encounter.species];
  const legendary = encounter.legendary;
  const threshold = legendary ? 6 : ZONES[encounter.zone].threshold;
  const full = me.pokemon.length >= 6;
  const zoneColor = { green: '#38b85f', blue: '#37b1df', purple: '#9c5add', red: '#e64d66' }[encounter.zone] || '#edbf4c';
  return `<div class="encounter-shade"><section class="encounter-card" role="dialog" aria-modal="true" aria-label="จับ${esc(pokemon.name)}" style="--encounter-color:${zoneColor}">
    <div class="encounter-topline"><span>${legendary ? '✦ LEGENDARY' : 'WILD POKÉMON'}</span><span>${spectating ? `${esc(me.name)} พบโปเกมอน` : legendary ? 'ช่องทอง' : esc(ZONES[encounter.zone].name)} · ทีม ${me.pokemon.length}/6</span></div>
    <div class="encounter-art-panel">${pokemonPortrait(encounter.species, 'large')}<div class="encounter-spark spark-one">✦</div><div class="encounter-spark spark-two">✦</div></div>
    <div class="encounter-name"><h2>${esc(pokemon.name)}</h2><span>#${String(POKEDEX[encounter.species]).padStart(3, '0')}</span></div>
    <div class="encounter-stats"><span><b>HP</b> ${pokemon.hp}</span><span><b>⚔ พลังโจมตี</b> ${pokemon.power}</span><span><b>◉ ขาย</b> ${pokemon.price} เหรียญ</span></div>
    <p class="encounter-rule">${legendary ? 'ชนะการต่อสู้ก่อน แล้วทอยได้ 6 เท่านั้น · โบนัสบอลไม่มีผล' : `ทอยได้ ${threshold} ขึ้นไปเพื่อจับ ${esc(pokemon.name)} · โบนัสบอลช่วยเพิ่มแต้ม`} </p>
    ${full ? '<p class="encounter-full">ทีมเต็ม 6 ตัวแล้ว จับเพิ่มไม่ได้</p>' : ''}
    ${spectating ? `<p class="waiting">รอ ${esc(me.name)} จับหรือออกจากการจับ…</p>` : `<div class="encounter-ball-grid">${Object.entries(BALLS).map(([id, ball]) => `<button class="btn encounter-ball" data-ball="${id}" ${me.balls[id] < 1 || full ? 'disabled' : ''}><span class="ball-symbol ball-${id}">◉</span><strong>${esc(ball.name)}</strong><small>มี ${me.balls[id]} ลูก ${legendary ? '' : `· โบนัส +${ball.bonus}`}</small></button>`).join('')}</div><button class="btn encounter-skip" data-act="skipCapture">ออกจากการจับ · จบตา</button>`}
  </section></div>`;
}
function announcementHtml() {
  if (!state || state.phase !== 'playing') return '';
  const announcement = activeAnnouncement;
  if (!announcement) return '';
  if (announcement.kind === 'catch' && arrivalPending) return '';
  const isBattle = announcement.kind === 'battle';
  const won = isBattle && announcement.winnerSide === playerId;
  const lost = isBattle && announcement.loserSide === playerId;
  const title = isBattle ? won ? 'ชนะการต่อสู้!' : lost ? 'แพ้การต่อสู้' : announcement.title : announcement.title;
  const labels = { battle: 'BATTLE RESULT', battleRoll: 'BATTLE DICE', catch: 'CATCH RESULT', quest: 'QUEST', event: 'RANDOM EVENT', item: 'ITEM CARD', cave: 'BOARD EVENT' };
  const icons = { battle: won ? '🏆' : lost ? '⚔' : '🏅', battleRoll: '🎲', catch: announcement.success ? '◉' : '◇', quest: '📜', event: '✦', item: '✦', cave: '◆' };
  return `<div class="announcement-shade"><section class="announcement-card announcement-kind-${announcement.kind} ${isBattle ? won ? 'announcement-win' : lost ? 'announcement-lose' : '' : ''}" role="status" aria-label="${esc(title)}"><div class="eyebrow">${labels[announcement.kind] || 'BOARD EVENT'}</div><div class="announcement-icon">${icons[announcement.kind] || '✦'}</div>${announcement.species ? `<div class="announcement-pokemon">${pokemonPortrait(announcement.species)}</div>` : ''}${announcement.itemId ? `<div class="announcement-item-art">${esc(ITEMS[announcement.itemId]?.icon || '✦')}</div>` : ''}<h2>${esc(title)}</h2><p>${esc(announcement.text)}${announcement.targetName ? ` · เป้าหมาย ${esc(announcement.targetName)}` : ''}</p></section></div>`;
}
function actionHtml() {
  const me = state.players.find(p => p.id === playerId);
  const p = state.players[state.turn];
  const mine = p?.id === playerId;
  const battle = state.battle;
  if (state.phase === 'finished') {
    const winners = state.players.filter(p => state.result.winners.includes(p.id));
    const ranking = [...state.players].sort((a, b) => b.coins - a.coins);
    return `<div class="card action-panel"><div class="action-kicker">GAME OVER · ครบ 3 รอบ</div><h2>🏆 ${winners.map(p => esc(p.name)).join(' และ ')} ชนะ!</h2><p>สรุปผลหลังทุกคนวนครบกระดาน</p><div class="results-list">${ranking.map((p, i) => `<div class="result-row ${state.result.winners.includes(p.id) ? 'winner' : ''}"><b>${i + 1}. ${esc(p.name)}</b><strong>◉ ${p.coins}</strong></div>`).join('')}</div><button class="btn primary block" data-ui="new">เริ่มเกมใหม่</button></div>`;
  }
  if (!me) return '<div class="card waiting">กำลังเข้าห้อง…</div>';
  let body = '';
  if (state.step === 'battle_pick' && battle?.sides.includes(playerId)) {
    const chosen = battle.picks[playerId];
    body = chosen ? '<p>เลือกตัวสู้แล้ว รออีกฝ่ายเลือก…</p>' : `<p>เลือกโปเกมอนที่มี HP เพื่อต่อสู้</p><div class="monster-grid">${me.pokemon.filter(mon => mon.hp > 0 && (me.badges?.length || 0) >= badgeRequirement(mon.species)).map(mon => `<button class="monster-card" data-fighter="${mon.uid}"><span class="mon-icon">${pokemonPortrait(mon.species)}</span><span><b>${POKEMON[mon.species].name}</b><br>HP ${mon.hp}/${POKEMON[mon.species].hp} · ⚔ ${POKEMON[mon.species].power}</span></button>`).join('')}</div>`;
  } else if (state.step === 'battle_roll' && battle?.sides.includes(playerId)) {
    body = `<p>${esc(battle.message || 'ทอยเต๋า สูงกว่าจะโจมตี')}</p>${battle.rolls[playerId] === undefined ? '<button class="btn primary block" data-act="battleRoll">🎲 ทอยเต๋าสู้</button>' : '<p class="waiting">รออีกฝ่ายทอยเต๋า…</p>'}`;
  } else if (!mine) body = `<p class="waiting">รอ ${esc(p.name)} เล่นอยู่…</p>`;
  else if (state.step === 'roll') {
    const bonus = (me.moveBonus || 0) + (me.role === 'courier' ? 1 : 0);
    body = `<p>ถึงตาคุณแล้ว ทอยเต๋าเพื่อเดินบนกระดาน</p>${bonus ? `<p>โบนัสเดิน +${bonus} ช่อง</p>` : ''}${state.lastRoll ? `<div class="big-die">🎲 ${state.lastRoll.value}</div>` : ''}<button class="btn primary block" data-act="roll">ทอยเต๋า${bonus ? ` + ${bonus}` : ''}</button>`;
  }
  else if (state.step === 'sale') {
    const earned = me.pokemon.filter(mon => selectedSale.has(mon.uid)).reduce((sum, mon) => sum + POKEMON[mon.species].price + (POKEMON[mon.species].ability === 'sale' ? 1 : 0) + (me.role === 'fisher' && mon.caughtZone === 'blue' ? 2 : 0) + (me.role === 'merchant' ? 1 : 0), 0);
    body = `<p>ถึงจุดเริ่มต้น · รอบ ${me.laps}/3 เลือกตัวที่จะขาย ${me.laps < 3 ? '(ต้องเหลืออย่างน้อย 1 ตัว)' : '(ขายได้ทั้งหมด)'}</p><div class="monster-grid">${me.pokemon.map(mon => monCard(mon, true)).join('')}</div><div class="button-row"><button class="btn gold" data-act="sell">ขายที่เลือก +${earned} เหรียญ</button><button class="btn" data-ui="skip-sale">ไม่ขาย</button></div>`;
  } else if (state.step === 'wild_choice') body = `<p>มี ${esc(state.players.find(other => other.id === state.pending.opponentId)?.name)} อยู่บนช่องมอนสเตอร์ป่า คุณเลือกจับหรือท้าสู้ได้ อีกฝ่ายปฏิเสธการสู้ไม่ได้</p><div class="button-row"><button class="btn primary" data-choice="catch">จับมอนสเตอร์ป่า</button><button class="btn red" data-choice="battle">ท้าสู้ · ชนะ +3</button></div>`;
  else if (state.step === 'capture') body = arrivalPending ? '<p class="waiting">กำลังเดินไปยังช่องโปเกมอน…</p>' : '<p class="waiting">การ์ดจับโปเกมอนเปิดอยู่กลางจอ</p>';
  else if (state.step === 'event_result') body = `<p>เหตุการณ์: ${esc(state.notice?.title || '')}</p><button class="btn primary block" data-act="ackEvent">รับทราบ · จบตา</button>`;
else if (state.step === 'shop') body = '<p>ร้านค้าเปิดอยู่กลางจอ</p>';
  else if (state.step === 'quest_choice') {
    const quest = QUESTS[state.pending.questId];
    body = `<p>เควสใหม่: <b>${quest.name}</b><br>${quest.text}<br>รางวัล ${quest.coins} เหรียญ และ ${quest.reward === 'item' ? 'การ์ดไอเทม 1 ใบ' : 'โปเกมอน 1 ตัว'}</p>${me.quest ? '<p>มีเควสอยู่แล้ว เลือกเก็บอันเดิมหรือแทนที่</p>' : ''}<div class="button-row"><button class="btn primary" data-quest="accept">${me.quest ? 'รับแทนเควสเดิม' : 'รับเควส'}</button><button class="btn" data-quest="${me.quest ? 'keep' : 'skip'}">${me.quest ? 'เก็บเควสเดิม' : 'ไม่รับ'}</button></div>`;
  } else if (state.step === 'evolve_choice') body = `<p>ชนะวายร้าย รับ 5 เหรียญ! เลือกโปเกมอน 1 ตัวเพื่อพัฒนาร่าง HP จะฟื้นเต็ม</p><div class="monster-grid">${me.pokemon.filter(mon => EVOLUTIONS[mon.species]).map(mon => `<button class="monster-card" data-evolve="${mon.uid}">${pokemonPortrait(mon.species)}<span>${POKEMON[mon.species].name} → ${POKEMON[EVOLUTIONS[mon.species]].name}</span></button>`).join('')}</div><button class="btn block" data-act="evolve">ข้ามการพัฒนาร่าง</button>`;
  else if (state.step === 'item_overflow') body = `<p>${state.pending.source === 'turn' ? 'เริ่มตาใหม่ · จั่วได้' : 'คุณได้'} ${ITEMS[state.pending.itemId].name} แต่มีการ์ดครบ ${MAX_ITEMS} ใบแล้ว เลือกใบที่จะเปลี่ยนหรือทิ้งใบใหม่${state.pending.source === 'turn' ? ' แล้วจึงทอยเต๋า' : ''}</p>${me.items.map((id, i) => `<button class="btn block" data-overflow="${i}">เปลี่ยน ${ITEMS[id].name}</button>`).join('')}<button class="btn block" data-act="overflow">ทิ้งใบใหม่</button>`;
  else body = '<p>กำลังดำเนินเกม…</p>';
  return `<div class="card action-panel"><div class="action-kicker">${state.step.includes('battle') ? 'BATTLE' : mine ? 'YOUR TURN' : 'TURN IN PROGRESS'}</div><h2>${state.step.includes('battle') ? 'การต่อสู้' : mine ? esc(me.name) : esc(p.name)}</h2>${body}</div>`;
}
function itemDockHtml() {
  const me = state.players.find(p => p.id === playerId);
  if (!me || state.phase !== 'playing') return '';
  const battle = state.step === 'battle_roll' && state.battle?.sides.includes(playerId);
  return `<div class="hand-heading"><strong>การ์ดไอเทม</strong><span>${me.items.length}/${MAX_ITEMS}</span></div><div class="hand-cards">${itemList(me, battle)}</div>`;
}
function battleOverlayHtml() {
  const battle = state?.battle;
  if (state?.phase !== 'playing' || !battle || !['battle_pick', 'battle_roll'].includes(state.step)) return '';
  const labels = { pvp: 'ผู้เล่นปะทะผู้เล่น', gym: 'ศึกยิม', villain: 'ศึกวายร้าย', legendary: 'ศึกโปเกมอนตำนาน' };
  const fighters = battle.sides.map((side, i) => {
    const trainer = state.players.find(p => p.id === side);
    const mon = side === 'wild' ? battle.picks.wild : trainer?.pokemon.find(entry => entry.uid === battle.picks[side]);
    const data = mon && POKEMON[mon.species];
    const hp = data ? Math.max(0, Math.min(100, Math.round(mon.hp / data.hp * 100))) : 0;
    return `<div class="battle-status battle-status-${i}"><div class="battle-status-owner">${side === 'wild' ? (battle.kind === 'gym' ? 'หัวหน้ายิม' : battle.kind === 'villain' ? 'วายร้าย' : 'โปเกมอนตำนาน') : esc(trainer?.name || 'ผู้เล่น')}</div><div class="battle-status-main"><span class="battle-status-portrait">${data ? pokemonPortrait(mon.species) : '◉'}</span><span class="battle-status-copy"><strong>${data ? esc(data.name) : 'กำลังเลือกตัวสู้'}</strong><span>HP ${data ? `${mon.hp}/${data.hp}` : '—'} · ⚔ ${data?.power ?? '—'}</span></span><span class="battle-status-die">🎲 ${battle.rolls[side] ?? '—'}</span></div><div class="battle-hp-track"><span style="width:${hp}%"></span></div></div>`;
  }).join('<div class="battle-vs">VS</div>');
  return `<div class="battle-stage"><div class="battle-heading"><span>⚔ BATTLE ARENA</span><strong>${labels[battle.kind] || 'การต่อสู้'}</strong><small>ทอยได้มากกว่าเป็นฝ่ายโจมตี</small></div><div class="battle-status-row">${fighters}</div><div class="battle-live-message">${esc(battle.message || (state.step === 'battle_pick' ? 'เลือกโปเกมอนลงสนาม' : 'ทอยเต๋าเพื่อเริ่มโจมตี'))}</div></div>`;
}
function detailsDockHtml() {
  const me = state.players.find(p => p.id === playerId);
  if (!me) return '';
  const quest = me.quest && QUESTS[me.quest.id];
  const canAbandon = state.players[state.turn]?.id === playerId && ['roll', 'shop', 'quest_choice'].includes(state.step);
  return `<div class="detail-buttons"><button class="btn small" data-ui="team">ทีม ${me.pokemon.length}/6</button><button class="btn small" data-ui="quest">🏅 ${me.badges?.length || 0}/2 · ${quest ? `${quest.name} ${me.quest.progress}/${quest.target}` : 'ยังไม่มีเควส'}</button><button class="btn small" data-ui="log">เหตุการณ์</button></div>${openDetails === 'team' ? `<div class="detail-pop"><h2>ทีมโปเกมอน</h2><div class="monster-grid">${me.pokemon.map(mon => monCard(mon, false, me.badges?.length || 0)).join('')}</div></div>` : openDetails === 'quest' ? `<div class="detail-pop"><h2>เหรียญตราและเควส</h2><p>เหรียญตรา ${me.badges?.length || 0}/2 · 1 เหรียญใช้โปเกมอนโซนม่วงสู้ได้ · 2 เหรียญใช้โซนแดงและตำนานสู้ได้</p><p>${quest ? `${quest.name}: ${quest.text} (${me.quest.progress}/${quest.target}) · รางวัล ${quest.coins} เหรียญและ${quest.reward === 'item' ? 'ไอเทม' : 'โปเกมอน'}` : 'ยังไม่มีเควส ไปหยุดที่ช่องเควสเพื่อรับ'}</p>${quest && canAbandon ? '<button class="btn small" data-act="abandonQuest">ทิ้งเควส</button>' : ''}</div>` : openDetails === 'log' ? `<div class="detail-pop"><h2>เหตุการณ์ล่าสุด</h2><ol class="log-list">${state.log.map(line => `<li>${esc(line)}</li>`).join('')}</ol></div>` : ''}`;
}
function lobbyHtml() {
  const me = state.players.find(p => p.id === playerId);
  return `<div class="modal lobby-modal"><div class="eyebrow">ROOM ${code} · ${state.players.length}/4 คน</div><h1>เตรียมออกเดินทาง</h1><p>ส่งลิงก์นี้ให้เพื่อนเปิดในเบราว์เซอร์ แล้วรอให้ทุกคนเข้าห้องก่อนเริ่มเกม</p><div class="button-row"><input class="field" style="flex:1;min-width:0" readonly aria-label="ลิงก์ชวนเพื่อน" value="${esc(inviteUrl())}"><button class="btn gold" data-ui="copy-link">คัดลอก URL</button></div><div class="card">${state.players.map(p => `<div class="lobby-player"><b>${esc(p.name)} ${p.id === state.hostId ? '👑' : ''}</b><span>${esc(ROLES[p.role].name)}</span></div>`).join('')}</div><h2>เลือกอาชีพของคุณ</h2><div class="role-grid">${Object.entries(ROLES).map(([id, role]) => `<button class="role-choice ${me?.role === id ? 'selected' : ''}" data-role="${id}" style="--role:${role.color}" aria-pressed="${me?.role === id}">${rolePreview(id, role)}<span class="role-choice-copy"><b>${role.name}</b><small>คู่หูเริ่มต้น: ${POKEMON[role.starter].name}</small><span>${role.ability}</span></span></button>`).join('')}</div><div class="rule-note">เริ่มเกมเมื่อพร้อม · ที่ว่างจะเติมบอทให้ครบ 4 คน</div>${state.hostId === playerId ? '<button class="btn gold block" data-ui="start">เริ่มเกม</button>' : '<p class="waiting">รอหัวหน้าห้องเริ่มเกม…</p>'}</div>`;
}
function landingHtml() {
  const invited = /^[0-9A-F]{6}$/i.test(params.get('room') || '') ? params.get('room').toUpperCase() : null;
  return `<div class="modal"><div class="eyebrow">POKÉMON BOARD GAME</div><h1>${invited ? 'เพื่อนชวนเข้าห้อง' : 'ศึกยอดนักขาย'}</h1><p>${invited ? `ห้อง <b>${invited}</b> · ตั้งชื่อแล้วกดเข้าห้องเพื่อเล่นกับเพื่อน` : 'เกมกระดาน 3D สำหรับ 4 คน จับโปเกมอน ต่อสู้ ขายที่จุดเริ่มต้น ใครมีเงินมากที่สุดหลังครบ 3 รอบชนะ'}</p><label class="field-label" for="playerName">ชื่อผู้เล่น</label><input id="playerName" class="field" maxlength="18" value="${esc(name)}" placeholder="ตั้งชื่อของคุณ">${invited ? `<input id="joinCode" type="hidden" value="${invited}"><button class="btn primary block" data-ui="join">เข้าห้อง ${invited}</button><button class="btn block" data-ui="home">กลับหน้าเริ่มเกม</button>` : `<div class="mode-row"><button class="btn primary" data-ui="solo">เล่นคนเดียวกับบอท</button><button class="btn gold" data-ui="create">สร้างห้องกับเพื่อน</button></div><label class="field-label" for="joinCode">รหัสห้องเพื่อน</label><div class="button-row"><input id="joinCode" class="field" style="flex:1" maxlength="6" placeholder="เช่น A1B2C3"><button class="btn" data-ui="join">เข้าห้อง</button></div>`}<div class="rule-note">บอร์ด 4 โซน: เขียว ≥2 · ฟ้า ≥3 · ม่วง ≥4 · แดง ≥5 · ตำนานชนะการสู้ก่อนแล้วทอย 6</div></div>`;
}
function render() {
  const inBattle = state?.phase === 'playing' && ['battle_pick', 'battle_roll'].includes(state.step) && Boolean(state.battle);
  document.querySelector('.world-wrap').classList.toggle('in-battle', inBattle);
  $('battleOverlay').innerHTML = battleOverlayHtml();
  board.setInteractive(Boolean(state && state.phase !== 'lobby' && !['capture', 'shop'].includes(state.step)));
  $('encounterOverlay').innerHTML = captureModalHtml();
  $('announcementOverlay').innerHTML = announcementHtml();
  $('playerHud').innerHTML = state?.phase === 'playing' || state?.phase === 'finished' ? playerHudHtml() : '';
  if (state?.phase === 'lobby') { $('overlay').innerHTML = lobbyHtml(); $('actionDock').innerHTML = ''; $('itemDock').innerHTML = ''; $('detailsDock').innerHTML = ''; }
  else if (!state) { $('overlay').innerHTML = landingHtml(); $('actionDock').innerHTML = ''; $('itemDock').innerHTML = ''; $('detailsDock').innerHTML = ''; }
  else {
    const shopping = state.step === 'shop' && state.players[state.turn]?.id === playerId;
    $('overlay').innerHTML = shopping ? shopHtml() : '';
    const actor = state.players[state.turn];
    const battleParticipant = state.step.startsWith('battle') && state.battle?.sides.includes(playerId);
    const showAction = state.phase === 'finished' || (actor?.id === playerId && state.step !== 'capture') || battleParticipant;
    $('actionDock').innerHTML = showAction && !shopping ? actionHtml() : '';
    $('itemDock').innerHTML = itemDockHtml();
    $('itemDock').className = `hand-size-${Math.max(1, Math.min(MAX_ITEMS, state.players.find(p => p.id === playerId)?.items.length || 0))}`;
    $('detailsDock').innerHTML = detailsDockHtml();
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (suspense) return;
  if (button.dataset.act === 'roll' || button.dataset.act === 'battleRoll') {
    if (beginSuspense(button.dataset.act === 'roll' ? 'move' : 'battle')) act({ type: button.dataset.act });
    return;
  }
  if (button.dataset.ball) {
    if (beginSuspense('catch')) act({ type: 'throwBall', ball: button.dataset.ball });
    return;
  }
  const ui = button.dataset.ui;
  if (ui === 'solo' || ui === 'create' || ui === 'join') {
    name = $('playerName')?.value.trim() || 'ผู้เล่น'; localStorage.setItem('pokemon-board-name', name);
    if (ui === 'join') { const room = $('joinCode').value.trim().toUpperCase(); if (room.length !== 6) { toast('กรอกรหัสห้อง 6 ตัว'); return; } send('join', { code: room, name }); }
    else send('create', { name, solo: ui === 'solo' });
  } else if (ui === 'copy-link') copyInviteLink();
  else if (ui === 'home') { params.delete('room'); history.replaceState(null, '', location.pathname); render(); }
  else if (ui === 'start') send('start');
  else if (ui === 'team' || ui === 'log' || ui === 'quest') { openDetails = openDetails === ui ? null : ui; render(); }
  else if (ui === 'new') { localStorage.removeItem('pokemon-board-session'); location.href = location.pathname; }
  else if (ui === 'skip-sale') act({ type: 'sell', ids: [] });
  if (button.dataset.role) send('role', { role: button.dataset.role });
  if (button.dataset.act) act({ type: button.dataset.act, ...(button.dataset.act === 'sell' ? { ids: [...selectedSale] } : {}) });
  if (button.dataset.sale) { selectedSale.has(button.dataset.sale) ? selectedSale.delete(button.dataset.sale) : selectedSale.add(button.dataset.sale); render(); }
  if (button.dataset.choice) act({ type: 'chooseWild', choice: button.dataset.choice });
  if (button.dataset.quest) act({ type: 'chooseQuest', choice: button.dataset.quest });
  if (button.dataset.evolve) act({ type: 'evolve', uid: button.dataset.evolve });
  if (button.dataset.ball) act({ type: 'throwBall', ball: button.dataset.ball });
  if (button.dataset.fighter) act({ type: 'chooseFighter', uid: button.dataset.fighter });
  if (button.dataset.buy) act({ type: 'buy', id: button.dataset.buy });
  if (button.dataset.overflow) act({ type: 'overflow', replaceIndex: Number(button.dataset.overflow) });
  if (button.dataset.useItem) act({ type: 'useItem', index: Number(button.dataset.useItem), targetId: button.closest('.item-card')?.querySelector('.item-target')?.value });
  if (button.id === 'roomBadge') copyInviteLink();
});
document.addEventListener('error', event => { if (event.target.matches?.('.pokemon-art')) event.target.remove(); }, true);
connect(); render();
