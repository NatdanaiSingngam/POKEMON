import { BALLS, DRAW_ITEMS, EVENTS, EVOLUTIONS, ITEMS, LAPS_TO_WIN, MAX_ITEMS, MAX_POKEMON, POKEMON, POOLS, QUESTS, ROLES, SHOP_ITEMS, TILES, ZONES } from './data.js';

const die = rng => Math.floor(rng() * 6) + 1;
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function createGame(participants, rng = Math.random) {
  const players = participants.map((source, index) => {
    const role = ROLES[source.role] ? source.role : Object.keys(ROLES)[index % 4];
    const species = ROLES[role].starter;
    return {
      id: source.id, name: source.name || `ผู้เล่น ${index + 1}`, bot: !!source.bot,
      connected: source.connected !== false, role, position: 0, laps: 0, done: false,
      coins: 10, balls: { basic: 5, great: 0, ultra: 0 },
      pokemon: [{ uid: `starter-${index}`, species, hp: POKEMON[species].hp, caughtZone: 'starter' }],
      items: [], moveBonus: 0, badges: [], quest: null, caveTurns: 0,
      stats: { catches: 0, legendaryCatches: 0, quests: 0, pvpWins: 0, villainWins: 0 },
      seenPokemon: [species], recentPokemon: [],
    };
  });
  const game = {
    phase: 'playing', players, turn: 0, step: 'roll', pending: null, battle: null,
    serial: 1, lastRoll: null, lastCatch: null, lastBattle: null, notice: null, result: null,
    encounterHistory: [], announcements: [],
    log: ['เริ่มเกมแล้ว — วนกระดานคนละ 3 รอบ แล้วนับคะแนนรวม'],
    rngSeed: Math.floor(rng() * 1000000),
  };
  drawTurnItem(game, rng);
  return game;
}

function log(game, message) {
  game.log.unshift(message);
  game.log.length = Math.min(game.log.length, 14);
}
function announce(game, kind, title, text, extra = {}) {
  game.announcements.push({ id: game.serial++, kind, title, text, ...extra });
  game.announcements = game.announcements.slice(-24);
}
function current(game) { return game.players[game.turn]; }
function player(game, id) { return game.players.find(p => p.id === id); }
export function scoreBreakdown(p) {
  const stats = p.stats || {};
  const parts = {
    coins: p.coins,
    badges: (p.badges?.length || 0) * 8,
    catches: (stats.catches || 0) * 2,
    legendary: (stats.legendaryCatches || 0) * 6,
    quests: (stats.quests || 0) * 4,
    pvp: (stats.pvpWins || 0) * 3,
    villains: (stats.villainWins || 0) * 2,
  };
  return { ...parts, total: Object.values(parts).reduce((sum, value) => sum + value, 0) };
}
export function saleValue(mon, role) {
  const species = POKEMON[mon.species];
  if (!species) return 0;
  return Math.max(2, Math.ceil(species.price * 0.65)) + (species.ability === 'sale' ? 1 : 0) + (role === 'fisher' && mon.caughtZone === 'blue' ? 2 : 0) + (role === 'merchant' ? 1 : 0);
}
export function badgeRequirement(species) { const zone = POKEMON[species]?.zone; return zone === 'purple' ? 1 : ['red', 'legendary'].includes(zone) ? 2 : 0; }
function activePokemon(p) { return p.pokemon.filter(mon => mon.hp > 0 && (p.badges?.length || 0) >= badgeRequirement(mon.species)); }
function healTeam(p) { p.pokemon.forEach(mon => { mon.hp = POKEMON[mon.species].hp; }); }
function drawTurnItem(game, rng) {
  const p = current(game);
  const itemId = pick(DRAW_ITEMS, rng);
  if (p.items.length < MAX_ITEMS) {
    p.items.push(itemId);
    log(game, `${p.name} เริ่มตาและจั่วการ์ดไอเทม 1 ใบ`);
  } else {
    game.step = 'item_overflow';
    game.pending = { kind: 'item', itemId, source: 'turn' };
    log(game, `${p.name} เริ่มตาและจั่วการ์ดไอเทม 1 ใบ แต่การ์ดเต็ม`);
  }
}
function endTurn(game, rng) {
  if (game.players.every(p => p.done)) {
    const scores = Object.fromEntries(game.players.map(p => [p.id, scoreBreakdown(p)]));
    const best = Math.max(...Object.values(scores).map(score => score.total));
    game.phase = 'finished'; game.step = 'finished';
    game.result = { points: best, scores, winners: game.players.filter(p => scores[p.id].total === best).map(p => p.id) };
    log(game, `จบเกม! คะแนนสูงสุด ${best} แต้ม`);
    return;
  }
  do {
    game.turn = (game.turn + 1) % game.players.length;
    if (!current(game).done && current(game).caveTurns > 0) {
      current(game).caveTurns--;
      log(game, `${current(game).name} ติดอยู่ในถ้ำ ข้ามตา (เหลือ ${current(game).caveTurns} ตา)`);
      continue;
    }
    if (!current(game).done) break;
  } while (true);
  current(game).moveBonus = 0;
  if (current(game).role === 'breeder') {
    current(game).pokemon.forEach(mon => { mon.hp = Math.min(POKEMON[mon.species].hp, mon.hp + 1); });
    log(game, `${current(game).name} ฟื้น HP ทั้งทีมตัวละ 1 จากอาชีพนักเพาะพันธุ์`);
  }
  game.pending = null; game.battle = null; game.step = 'roll';
  drawTurnItem(game, rng);
}
function makePokemon(game, species, zone) {
  return { uid: `mon-${game.serial++}`, species, hp: POKEMON[species].hp, caughtZone: zone };
}
function pickPokemonForPlayer(game, p, pool, rng) {
  const seen = new Set(p.seenPokemon || []);
  const owned = new Set(p.pokemon.map(mon => mon.species));
  const recent = new Set(p.recentPokemon || []);
  const globalSeen = new Set(game.encounterHistory || []);
  let candidates = pool.filter(species => !seen.has(species) && !globalSeen.has(species) && !owned.has(species));
  if (!candidates.length) candidates = pool.filter(species => !seen.has(species) && !owned.has(species));
  if (!candidates.length) candidates = pool.filter(species => !seen.has(species));
  if (!candidates.length) candidates = pool.filter(species => !owned.has(species) && !recent.has(species));
  if (!candidates.length) candidates = pool.filter(species => !owned.has(species));
  if (!candidates.length) candidates = pool.filter(species => !recent.has(species));
  const species = pick(candidates.length ? candidates : pool, rng);
  p.seenPokemon = [...seen, species];
  p.recentPokemon = [...(p.recentPokemon || []), species].slice(-5);
  game.encounterHistory = [...globalSeen, species];
  return species;
}
function advanceQuest(game, p, event, rng) {
  if (!p.quest || QUESTS[p.quest.id]?.event !== event) return;
  p.quest.progress++;
  const quest = QUESTS[p.quest.id];
  if (p.quest.progress < quest.target) { log(game, `${p.name}: ${quest.name} ${p.quest.progress}/${quest.target}`); return; }
  p.quest = null;
  p.coins += quest.coins;
  p.stats.quests++;
  if (quest.reward === 'item') {
    const itemId = pick(DRAW_ITEMS, rng);
    if (p.items.length < MAX_ITEMS) { p.items.push(itemId); log(game, `${p.name} ทำเควสสำเร็จ รับ ${quest.coins} เหรียญ และการ์ดไอเทม 1 ใบ`); announce(game, 'quest', `${p.name} ทำเควสสำเร็จ!`, `${quest.name} · รับ ${quest.coins} เหรียญ และการ์ดไอเทม 1 ใบ`); }
    else { p.coins += 1; log(game, `${p.name} ทำเควสสำเร็จ รับ ${quest.coins + 1} เหรียญ (การ์ดเต็ม)`); announce(game, 'quest', `${p.name} ทำเควสสำเร็จ!`, `${quest.name} · รับ ${quest.coins + 1} เหรียญ (การ์ดเต็ม)`); }
  } else {
    const species = pickPokemonForPlayer(game, p, [...POOLS.green, ...POOLS.blue], rng);
    if (p.pokemon.length < MAX_POKEMON) { p.pokemon.push(makePokemon(game, species, POKEMON[species].zone)); log(game, `${p.name} ทำเควสสำเร็จ รับ ${quest.coins} เหรียญ และ ${POKEMON[species].name}`); announce(game, 'quest', `${p.name} ทำเควสสำเร็จ!`, `${quest.name} · รับ ${quest.coins} เหรียญ และ ${POKEMON[species].name}`, { species }); }
    else { p.coins += 2; log(game, `${p.name} ทำเควสสำเร็จ รับ ${quest.coins + 2} เหรียญ (ทีมเต็ม)`); announce(game, 'quest', `${p.name} ทำเควสสำเร็จ!`, `${quest.name} · รับ ${quest.coins + 2} เหรียญ (ทีมเต็ม)`); }
  }
}
function offerNpcBattle(game, rng, kind) {
  const p = current(game);
  if (!activePokemon(p).length) { log(game, `${p.name} ไม่มีโปเกมอนที่ใช้ต่อสู้ได้`); endTurn(game, rng); return; }
  if (kind === 'gym' && p.badges.includes(p.position)) { log(game, `${p.name} เคยชนะยิมนี้แล้ว`); endTurn(game, rng); return; }
  const species = kind === 'gym' ? (p.position === 12 ? 'wartortle' : 'scyther') : (p.position === 10 ? 'raticate' : 'gyarados');
  game.pending = { kind, tile: p.position };
  game.battle = { kind, sides: [p.id, 'wild'], picks: { wild: makePokemon(game, species, POKEMON[species].zone) }, rolls: {}, effects: {}, attacks: 0, message: '', usedItem: [] };
  game.step = 'battle_pick';
  log(game, `${p.name} พบ ${kind === 'gym' ? 'หัวหน้ายิม' : 'วายร้าย'} และต้องสู้กับ ${POKEMON[species].name}`);
}
function offerWild(game, rng) {
  const p = current(game), zone = TILES[p.position].zone;
  const species = pickPokemonForPlayer(game, p, POOLS[zone], rng);
  game.pending = { kind: 'catch', species, zone, legendary: false, attempts: 0 };
  game.step = 'capture';
  log(game, `${p.name} พบ ${POKEMON[species].name} ใน${ZONES[zone].name}`);
}
function offerLegendary(game, rng) {
  const p = current(game), species = pickPokemonForPlayer(game, p, POOLS.legendary, rng);
  if (activePokemon(p).length === 0) {
    log(game, `${p.name} ไม่มีโปเกมอนที่ต่อสู้ได้ จึงผ่านช่องตำนาน`);
    endTurn(game, rng);
    return;
  }
  game.pending = { kind: 'legendary', species };
  game.battle = {
    kind: 'legendary', sides: [p.id, 'wild'], picks: { wild: makePokemon(game, species, 'legendary') },
    rolls: {}, effects: {}, attacks: 0, message: '', usedItem: [],
  };
  game.step = 'battle_pick';
  log(game, `${p.name} พบ ${POKEMON[species].name} ตำนาน! ต้องชนะก่อนจึงจับได้`);
}
function resolveTile(game, rng) {
  const p = current(game), tile = TILES[p.position];
  if (tile.type === 'wild') {
    const opponent = game.players.find(other => other.id !== p.id && !other.done && other.position === p.position);
    if (opponent) {
      game.pending = { kind: 'wild_choice', opponentId: opponent.id, zone: tile.zone };
      game.step = 'wild_choice';
      log(game, `${p.name} พบ ${opponent.name} บนช่องมอนสเตอร์ป่า`);
    } else offerWild(game, rng);
  } else if (tile.type === 'city') {
    healTeam(p); game.step = 'shop'; game.pending = { kind: 'city' };
    advanceQuest(game, p, 'city', rng);
    log(game, `${p.name} ถึงเมือง — โปเกมอนทั้งทีมฟื้น HP เต็ม`);
  } else if (tile.type === 'quest') {
    const questId = pick(Object.keys(QUESTS), rng);
    game.pending = { kind: 'quest', questId }; game.step = 'quest_choice';
    log(game, `${p.name} พบเควส ${QUESTS[questId].name}`);
    announce(game, 'quest', `${p.name} พบเควส`, `${QUESTS[questId].name} · ${QUESTS[questId].text}`);
  } else if (tile.type === 'cave') {
    p.caveTurns = 3;
    game.notice = { id: game.serial++, kind: 'cave', title: 'ติดอยู่ในถ้ำ!', text: `${p.name} ต้องข้าม 3 ตา` };
    announce(game, 'cave', `${p.name} ติดอยู่ในถ้ำ!`, 'ต้องข้าม 3 ตา');
    log(game, `${p.name} ลงถ้ำพอดี ต้องข้าม 3 ตา`); endTurn(game, rng);
  } else if (tile.type === 'gym' || tile.type === 'villain') {
    offerNpcBattle(game, rng, tile.type);
  } else if (tile.type === 'item') {
    const itemId = pick(DRAW_ITEMS, rng);
    if (p.items.length < MAX_ITEMS) {
      p.items.push(itemId);
      log(game, `${p.name} ได้การ์ดไอเทม 1 ใบ`);
      endTurn(game, rng);
    } else {
      game.step = 'item_overflow'; game.pending = { kind: 'item', itemId };
      log(game, `${p.name} ได้การ์ดไอเทม 1 ใบ แต่ไอเทมเต็ม`);
    }
  } else if (tile.type === 'event') {
    const event = pick(EVENTS, rng);
    game.pending = { kind: 'event', eventId: event.id };
    game.notice = { id: game.serial++, kind: 'event', title: event.name, text: event.text, playerId: p.id };
    announce(game, 'event', `${p.name}: ${event.name}`, event.text, { noticeId: game.notice.id });
    log(game, `${p.name}: ${event.name} — ${event.text}`);
    if (event.kind === 'coins') p.coins = Math.max(0, p.coins + event.amount);
    if (event.kind === 'balls') p.balls.basic += event.amount;
    if (event.kind === 'heal') healTeam(p);
    if (event.kind === 'item') {
      const itemId = pick(DRAW_ITEMS, rng);
      if (p.items.length < MAX_ITEMS) p.items.push(itemId);
      else { game.step = 'item_overflow'; game.pending = { kind: 'item', itemId }; return; }
    }
    if (event.kind === 'legendary') { offerLegendary(game, rng); return; }
    endTurn(game, rng);
  } else if (tile.type === 'legendary') offerLegendary(game, rng);
  else endTurn(game, rng);
}
function getBattleMon(game, side) {
  const b = game.battle;
  if (side === 'wild') return b.picks.wild;
  const p = player(game, side);
  return p?.pokemon.find(mon => mon.uid === b.picks[side]);
}
function battlePower(mon, other, firstAttack) {
  let power = POKEMON[mon.species].power;
  if (POKEMON[mon.species].ability === 'copy') power = Math.max(power, POKEMON[other.species].power);
  if (firstAttack && POKEMON[mon.species].ability === 'power') power += 1;
  return power;
}
function finishBattle(game, winnerSide, loserSide, rng) {
  const b = game.battle;
  game.lastBattle = { id: game.serial++, kind: b.kind, winnerSide, loserSide, winnerName: winnerSide === 'wild' ? 'โปเกมอนป่า' : player(game, winnerSide)?.name, loserName: loserSide === 'wild' ? 'โปเกมอนป่า' : player(game, loserSide)?.name };
  announce(game, 'battle', `${game.lastBattle.winnerName} ชนะการต่อสู้!`, `${game.lastBattle.winnerName} ชนะ ${game.lastBattle.loserName}`, { winnerSide, loserSide, battleKind: b.kind });
  const winningMon = getBattleMon(game, winnerSide);
  if (winnerSide !== 'wild' && winningMon && POKEMON[winningMon.species].ability === 'heal') {
    winningMon.hp = Math.min(POKEMON[winningMon.species].hp, winningMon.hp + 1);
  }
  const winner = winnerSide === 'wild' ? null : player(game, winnerSide);
  const loser = loserSide === 'wild' ? null : player(game, loserSide);
  if (b.kind === 'pvp') game.lastBattle.prize = 3 + (winner?.role === 'rocket' ? 1 : 0);
  if (b.kind === 'pvp') {
    const prize = 3 + (winner?.role === 'rocket' ? 1 : 0);
    winner.coins += prize;
    winner.stats.pvpWins++;
    log(game, `${winner.name} ชนะ ${loser.name} และรับ ${prize} เหรียญ`);
    advanceQuest(game, winner, 'battle', rng);
    endTurn(game, rng);
  } else if (winnerSide === 'wild') {
    log(game, `${POKEMON[b.picks.wild.species].name} ชนะ — จับไม่ได้ในครั้งนี้`);
    endTurn(game, rng);
  } else {
    if (b.kind === 'gym') {
      winner.badges.push(game.pending.tile);
      log(game, `${winner.name} ชนะยิม! ได้เหรียญตรา ${winner.badges.length}/2`);
      advanceQuest(game, winner, 'battle', rng); endTurn(game, rng); return;
    }
    if (b.kind === 'villain') {
      winner.coins += 3;
      winner.stats.villainWins++;
      advanceQuest(game, winner, 'battle', rng);
      const eligible = winner.pokemon.filter(mon => EVOLUTIONS[mon.species]);
      log(game, `${winner.name} ชนะวายร้าย! ได้ 3 เหรียญ และสิทธิ์พัฒนาร่าง`);
      game.battle = null;
      if (eligible.length) { game.step = 'evolve_choice'; game.pending = { kind: 'evolve' }; }
      else endTurn(game, rng);
      return;
    }
    const species = b.picks.wild.species;
    advanceQuest(game, winner, 'battle', rng);
    game.pending = { kind: 'catch', species, zone: 'legendary', legendary: true, attempts: 0 };
    game.battle = null; game.step = 'capture';
    log(game, `${winner.name} ชนะ ${POKEMON[species].name}! ทอยได้ 6 จึงจับสำเร็จ`);
  }
}
function resolveBattleRolls(game, rng) {
  const b = game.battle, [first, second] = b.sides;
  if (b.rolls[first] === undefined || b.rolls[second] === undefined) return;
  const a = b.rolls[first], d = b.rolls[second];
  const firstName = first === 'wild' ? 'โปเกมอนป่า' : player(game, first)?.name;
  const secondName = second === 'wild' ? 'โปเกมอนป่า' : player(game, second)?.name;
  announce(game, 'battleRoll', 'ผลทอยต่อสู้', `${firstName} ทอยได้ ${a} · ${secondName} ทอยได้ ${d}${a === d ? ' · เสมอ ทอยใหม่' : ` · ${a > d ? firstName : secondName} ได้โจมตี`}`, { rolls: [a, d] });
  b.rolls = {};
  if (a === d) {
    b.message = `เต๋าเสมอ ${a}–${d} ทอยใหม่`;
    log(game, b.message);
    return;
  }
  const attackerSide = a > d ? first : second;
  const defenderSide = a > d ? second : first;
  const attacker = getBattleMon(game, attackerSide), defender = getBattleMon(game, defenderSide);
  if (!attacker || !defender) { finishBattle(game, attacker ? attackerSide : defenderSide, attacker ? defenderSide : attackerSide, rng); return; }
  const key = `${attackerSide}:first`;
  const firstAttack = !b.effects[key];
  b.effects[key] = true;
  let damage = battlePower(attacker, defender, firstAttack) + (b.effects[`${attackerSide}:power`] || 0);
  if (firstAttack && attackerSide !== 'wild' && player(game, attackerSide)?.role === 'battler') damage += 1;
  b.effects[`${attackerSide}:power`] = 0;
  if (!b.effects[`${defenderSide}:dodge`] && POKEMON[defender.species].ability === 'dodge') {
    damage -= 1; b.effects[`${defenderSide}:dodge`] = true;
  }
  damage -= b.effects[`${defenderSide}:shield`] || 0;
  b.effects[`${defenderSide}:shield`] = 0;
  damage = Math.max(0, damage);
  defender.hp = Math.max(0, defender.hp - damage);
  b.attacks++;
  b.message = `${POKEMON[attacker.species].name} โจมตี ${damage} — ${POKEMON[defender.species].name} เหลือ ${defender.hp} HP`;
  log(game, b.message);
  if (defender.hp <= 0) finishBattle(game, attackerSide, defenderSide, rng);
}
function legalActor(game, actorId, action) {
  if (game.phase !== 'playing') return 'เกมยังไม่เริ่มหรือจบแล้ว';
  if (['chooseFighter', 'battleRoll'].includes(action.type) || (action.type === 'useItem' && game.step === 'battle_roll')) {
    if (!game.battle?.sides.includes(actorId)) return 'คุณไม่ได้อยู่ในการต่อสู้';
    return null;
  }
  if (current(game).id !== actorId) return 'ยังไม่ถึงตาของคุณ';
  return null;
}
function movePlayer(game, p, value, rng, source = 'die', rolled = value) {
  const from = p.position;
  game.lastRoll = { playerId: p.id, value, rolled, bonus: value - rolled, from, to: (from + value) % TILES.length, source };
  if (from + value >= TILES.length) {
    p.position = 0; p.laps++;
    p.balls.basic += 3;
    if (p.role === 'collector') p.balls.great++;
    game.lastRoll.to = 0;
    game.pending = { kind: 'sale' }; game.step = 'sale';
    log(game, `${p.name} ทอยได้ ${rolled}${value > rolled ? ` + โบนัสเดิน ${value - rolled}` : ''} หยุดที่จุดเริ่มต้น (รอบ ${p.laps}/3) และรับบอลแดง 3 ลูก${p.role === 'collector' ? ' บอลน้ำเงิน 1 ลูก' : ''}`);
  } else {
    p.position = from + value;
    log(game, `${p.name} ทอยได้ ${rolled}${value > rolled ? ` + โบนัสเดิน ${value - rolled}` : ''} เดิน ${value} ช่อง ไปช่อง ${p.position + 1}`);
    resolveTile(game, rng);
  }
}

export function applyAction(game, actorId, action, rng = Math.random) {
  if (!action || typeof action.type !== 'string') return { ok: false, error: 'คำสั่งไม่ถูกต้อง' };
  const illegal = legalActor(game, actorId, action);
  if (illegal) return { ok: false, error: illegal };
  const p = player(game, actorId);
  const fail = error => ({ ok: false, error });

  if (action.type === 'roll') {
    if (game.step !== 'roll') return fail('ตอนนี้ยังทอยไม่ได้');
    const rolled = die(rng), bonus = (p.moveBonus || 0) + (p.role === 'courier' ? 1 : 0);
    p.moveBonus = 0;
    movePlayer(game, p, rolled + bonus, rng, 'die', rolled);
  } else if (action.type === 'chooseQuest') {
    if (game.step !== 'quest_choice') return fail('ตอนนี้รับเควสไม่ได้');
    if (!['accept', 'keep', 'skip'].includes(action.choice)) return fail('ตัวเลือกเควสไม่ถูกต้อง');
    if (action.choice === 'accept') {
      p.quest = { id: game.pending.questId, progress: 0 };
      log(game, `${p.name} รับเควส ${QUESTS[p.quest.id].name}`);
      announce(game, 'quest', `${p.name} รับเควส`, `${QUESTS[p.quest.id].name} · ${QUESTS[p.quest.id].text}`);
    }
    endTurn(game, rng);
  } else if (action.type === 'abandonQuest') {
    if (!['roll', 'shop', 'quest_choice'].includes(game.step) || !p.quest) return fail('ตอนนี้ทิ้งเควสไม่ได้');
    log(game, `${p.name} ทิ้งเควส ${QUESTS[p.quest.id].name}`);
    p.quest = null;
  } else if (action.type === 'evolve') {
    if (game.step !== 'evolve_choice') return fail('ตอนนี้พัฒนาร่างไม่ได้');
    if (action.uid) {
      const mon = p.pokemon.find(mon => mon.uid === action.uid && EVOLUTIONS[mon.species]);
      if (!mon) return fail('เลือกโปเกมอนที่พัฒนาร่างได้');
      mon.species = EVOLUTIONS[mon.species]; mon.hp = POKEMON[mon.species].hp;
      log(game, `${p.name} พัฒนาโปเกมอนเป็น ${POKEMON[mon.species].name}`);
    }
    endTurn(game, rng);
  } else if (action.type === 'sell') {
    if (game.step !== 'sale') return fail('ตอนนี้ขายไม่ได้');
    const ids = Array.isArray(action.ids) ? [...new Set(action.ids)] : [];
    if (ids.some(uid => !p.pokemon.some(mon => mon.uid === uid))) return fail('มีโปเกมอนที่ไม่ได้อยู่ในทีม');
    if (p.laps < LAPS_TO_WIN && p.pokemon.length - ids.length < 1) return fail('รอบนี้ต้องเหลือโปเกมอนอย่างน้อย 1 ตัว');
    let gained = 0;
    for (const uid of ids) {
      const mon = p.pokemon.find(item => item.uid === uid);
      gained += saleValue(mon, p.role);
    }
    p.pokemon = p.pokemon.filter(mon => !ids.includes(mon.uid));
    p.coins += gained;
    if (p.laps >= LAPS_TO_WIN) p.done = true;
    log(game, `${p.name} ขาย ${ids.length} ตัว ได้ ${gained} เหรียญ${p.done ? ' และครบ 3 รอบ' : ''}`);
    endTurn(game, rng);
  } else if (action.type === 'chooseWild') {
    if (game.step !== 'wild_choice') return fail('ไม่มีตัวเลือกนี้');
    if (action.choice === 'catch') offerWild(game, rng);
    else if (action.choice === 'battle') {
      const opponent = player(game, game.pending.opponentId);
      game.battle = { kind: 'pvp', sides: [p.id, opponent.id], picks: {}, rolls: {}, effects: {}, attacks: 0, message: '', usedItem: [] };
      game.pending = null; game.step = 'battle_pick';
      log(game, `${p.name} ท้าสู้ ${opponent.name} — ปฏิเสธไม่ได้`);
      if (activePokemon(p).length === 0 || activePokemon(opponent).length === 0) {
        const winner = activePokemon(p).length ? p.id : opponent.id;
        if (activePokemon(p).length || activePokemon(opponent).length) finishBattle(game, winner, winner === p.id ? opponent.id : p.id, rng);
        else { log(game, 'ทั้งสองฝ่ายไม่มีโปเกมอนที่สู้ได้'); endTurn(game, rng); }
      }
    } else return fail('ตัวเลือกไม่ถูกต้อง');
  } else if (action.type === 'throwBall') {
    if (game.step !== 'capture') return fail('ตอนนี้จับไม่ได้');
    if ((game.pending.attempts || 0) >= 3) return fail('โปเกมอนหนีไปแล้ว');
    const ball = BALLS[action.ball];
    if (!ball || p.balls[action.ball] < 1) return fail('ไม่มีโปเกบอลชนิดนี้');
    if (p.pokemon.length >= MAX_POKEMON) return fail('ทีมเต็ม 6 ตัวแล้ว');
    p.balls[action.ball]--;
    game.pending.attempts = (game.pending.attempts || 0) + 1;
    const value = die(rng);
    const { species, zone, legendary } = game.pending;
    const roleBonus = !legendary ? (p.role === 'trainer' ? 1 : p.role === 'ranger' && zone === 'red' ? 2 : 0) : 0;
    const ballBonus = p.role === 'scientist' && action.ball !== 'basic' ? 1 : 0;
    const threshold = legendary ? 6 : ZONES[zone].threshold;
    const total = legendary ? value : value + ball.bonus + roleBonus + ballBonus;
    const success = legendary ? value === 6 : total >= threshold;
    if (success) {
      p.pokemon.push(makePokemon(game, species, zone));
      p.stats.catches++;
      if (legendary) p.stats.legendaryCatches++;
      advanceQuest(game, p, 'catch', rng);
    }
    const escaped = !success && game.pending.attempts >= 3;
    game.lastCatch = { playerId: p.id, species, value, total, threshold, success, escaped, attempt: game.pending.attempts, ball: action.ball };
    announce(game, 'catch', success ? `${p.name} จับสำเร็จ!` : escaped ? `${POKEMON[species].name} หนีไปแล้ว!` : `${p.name} จับไม่สำเร็จ`, `${POKEMON[species].name} · ทอยได้ ${value}${legendary ? '' : ` รวมโบนัส ${total}`} · ต้องได้ ${threshold} · ครั้งที่ ${game.pending.attempts}/3${success ? ' · เข้าทีมแล้ว' : escaped ? ' · หมดโอกาสจับ' : ' · ลองใหม่ได้'}`, { species, success, escaped, playerId: p.id });
    log(game, `${p.name} ทอยจับ ${value}${legendary ? '' : ` (+${total - value})`} — ${success ? `จับ ${POKEMON[species].name} สำเร็จ!` : escaped ? `${POKEMON[species].name} หนีไปแล้ว` : `จับ ${POKEMON[species].name} ไม่สำเร็จ ลองอีกได้ ${3 - game.pending.attempts} ครั้ง`}`);
    if (success || escaped) endTurn(game, rng);
  } else if (action.type === 'skipCapture') {
    if (game.step !== 'capture') return fail('ตอนนี้ข้ามไม่ได้');
    log(game, `${p.name} ไม่จับโปเกมอน`); endTurn(game, rng);
  } else if (action.type === 'ackEvent') {
    if (game.step !== 'event_result') return fail('ไม่มีเหตุการณ์ที่ต้องปิด');
    game.notice = null;
    endTurn(game, rng);
  } else if (action.type === 'chooseFighter') {
    if (game.step !== 'battle_pick') return fail('ตอนนี้เลือกตัวสู้ไม่ได้');
    const actor = player(game, actorId);
    if (!actor || !activePokemon(actor).some(mon => mon.uid === action.uid)) return fail('โปเกมอนตัวนี้สู้ไม่ได้หรือยังมีเหรียญตราไม่พอ');
    game.battle.picks[actorId] = action.uid;
    log(game, `${actor.name} เลือกโปเกมอนพร้อมสู้`);
    if (game.battle.sides.every(side => game.battle.picks[side])) game.step = 'battle_roll';
  } else if (action.type === 'battleRoll') {
    if (game.step !== 'battle_roll') return fail('ตอนนี้ทอยสู้ไม่ได้');
    if (game.battle.rolls[actorId] !== undefined) return fail('ทอยแล้ว รออีกฝ่าย');
    const penalty = game.battle.effects[`${actorId}:smoke`] || 0;
    game.battle.effects[`${actorId}:smoke`] = 0;
    game.battle.rolls[actorId] = clamp(die(rng) - penalty, 1, 6);
    log(game, `${actorId === 'wild' ? 'โปเกมอนป่า' : player(game, actorId).name} ทอยต่อสู้ได้ ${game.battle.rolls[actorId]}`);
    resolveBattleRolls(game, rng);
  } else if (action.type === 'buy') {
    if (game.step !== 'shop') return fail('ซื้อของได้เฉพาะในเมือง');
    if (BALLS[action.id]) {
      const entry = BALLS[action.id];
      if (p.coins < entry.price) return fail('เงินไม่พอ');
      p.coins -= entry.price; p.balls[action.id]++;
      log(game, `${p.name} ซื้อโปเกบอล ราคา ${entry.price} เหรียญ`);
    } else if (SHOP_ITEMS.includes(action.id)) {
      const entry = ITEMS[action.id];
      if (p.items.length >= MAX_ITEMS) return fail(`ไอเทมเต็ม ${MAX_ITEMS} ใบ`);
      if (p.coins < entry.price) return fail('เงินไม่พอ');
      p.coins -= entry.price; p.items.push(action.id);
      log(game, `${p.name} ซื้อการ์ดไอเทม 1 ใบ ราคา ${entry.price} เหรียญ`);
    } else return fail('ไม่มีของชิ้นนี้');
  } else if (action.type === 'leaveShop') {
    if (game.step !== 'shop') return fail('ตอนนี้ไม่ได้อยู่ในร้าน');
    endTurn(game, rng);
  } else if (action.type === 'overflow') {
    if (game.step !== 'item_overflow') return fail('ไม่มีไอเทมล้น');
    const fromTurnDraw = game.pending.source === 'turn';
    if (action.replaceIndex !== undefined && action.replaceIndex !== null) {
      const idx = Number(action.replaceIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= p.items.length) return fail('ตำแหน่งไอเทมไม่ถูกต้อง');
      p.items[idx] = game.pending.itemId;
      log(game, `${p.name} เปลี่ยนการ์ดไอเทม 1 ใบ`);
    } else log(game, `${p.name} ทิ้งการ์ดไอเทม 1 ใบ`);
    if (fromTurnDraw) { game.pending = null; game.step = 'roll'; }
    else endTurn(game, rng);
  } else if (action.type === 'useItem') {
    const idx = Number(action.index), itemId = p?.items[idx], item = ITEMS[itemId];
    if (!Number.isInteger(idx) || !item) return fail('ไม่มีไอเทมใบนี้');
    const movement = item.move || 0;
    if (game.step === 'battle_roll') {
      if (item.timing !== 'battle') return fail('ไอเทมนี้ใช้ได้เฉพาะนอกการต่อสู้');
      if (game.battle.usedItem.includes(actorId)) return fail('ใช้ไอเทมในศึกนี้แล้ว');
      const own = getBattleMon(game, actorId);
      const otherId = game.battle.sides.find(id => id !== actorId);
      if (!own) return fail('ยังไม่ได้เลือกโปเกมอน');
      if (itemId === 'potion') own.hp = Math.min(POKEMON[own.species].hp, own.hp + 3);
      if (itemId === 'super_potion') own.hp = Math.min(POKEMON[own.species].hp, own.hp + 6);
      if (itemId === 'power_up') game.battle.effects[`${actorId}:power`] = 2;
      if (itemId === 'smoke') game.battle.effects[`${otherId}:smoke`] = 2;
      if (itemId === 'shield') game.battle.effects[`${actorId}:shield`] = 2;
      game.battle.usedItem.push(actorId);
    } else {
      if (!['roll', 'shop'].includes(game.step)) return fail('ตอนนี้ใช้ไอเทมนอกการต่อสู้ไม่ได้');
      if (item.timing !== 'outside') return fail('ไอเทมนี้ใช้ได้เฉพาะระหว่างต่อสู้');
      if (movement && game.step !== 'roll') return fail('ไอเทมเดินใช้ได้ก่อนทอยเท่านั้น');
      const target = item.target === 'other' ? player(game, action.targetId) : p;
      if (!target || (item.target === 'other' && (target.id === p.id || target.done))) return fail('เป้าหมายไม่ถูกต้อง');
      const candyTarget = itemId === 'rare_candy' ? p.pokemon.find(mon => mon.uid === action.targetId && EVOLUTIONS[mon.species]) : null;
      if (itemId === 'rare_candy' && !candyTarget) return fail('เลือกโปเกมอนที่พัฒนาร่างได้');
      if (itemId === 'lucky_coin') p.coins += 2;
      if (itemId === 'full_heal') healTeam(p);
      if (candyTarget) { candyTarget.species = EVOLUTIONS[candyTarget.species]; candyTarget.hp = POKEMON[candyTarget.species].hp; }
      if (itemId === 'ball_box') p.balls.basic += 3;
      if (item.effect === 'coins') p.coins += item.amount;
      if (item.effect === 'balls') p.balls.basic += item.amount;
      if (item.effect === 'greatBall') p.balls.great += item.amount;
      if (item.effect === 'ultraBall') p.balls.ultra += item.amount;
      if (item.effect === 'heal') p.pokemon.forEach(mon => { mon.hp = Math.min(POKEMON[mon.species].hp, mon.hp + item.amount); });
      if (item.effect === 'fine') target.coins = Math.max(0, target.coins - item.amount);
      if (item.effect === 'steal') { const amount = Math.min(item.amount, target.coins); target.coins -= amount; p.coins += amount; }
      if (movement) p.moveBonus = (p.moveBonus || 0) + movement;
    }
    p.items.splice(idx, 1);
    log(game, `${p.name} ใช้ ${item.name}`);
    announce(game, 'item', `${p.name} ใช้ ${item.name}`, item.text, { itemId, playerId: p.id, targetName: item.target === 'other' ? player(game, action.targetId)?.name : null });
  } else return fail('ไม่รู้จักคำสั่งนี้');
  return { ok: true };
}

export function actionsForBot(game, rng = Math.random) {
  if (game.phase !== 'playing') return null;
  const p = current(game), b = game.battle;
  if (game.step === 'battle_pick') {
    const botSide = b.sides.find(id => id !== 'wild' && player(game, id)?.bot && !b.picks[id]);
    if (!botSide) return null;
    const bot = player(game, botSide);
    const fighter = [...activePokemon(bot)].sort((a, z) => POKEMON[z.species].power - POKEMON[a.species].power)[0];
    return fighter ? { actorId: botSide, action: { type: 'chooseFighter', uid: fighter.uid } } : null;
  }
  if (game.step === 'battle_roll') {
    const side = b.sides.find(id => (id === 'wild' || player(game, id)?.bot) && b.rolls[id] === undefined);
    return side ? { actorId: side, action: { type: 'battleRoll' } } : null;
  }
  if (!p.bot) return null;
  if (game.step === 'roll') return { actorId: p.id, action: { type: 'roll' } };
  if (game.step === 'sale') {
    const sorted = [...p.pokemon].sort((a, z) => POKEMON[z.species].power - POKEMON[a.species].power);
    const keep = p.laps < LAPS_TO_WIN ? sorted.slice(0, 1).map(mon => mon.uid) : [];
    return { actorId: p.id, action: { type: 'sell', ids: p.pokemon.filter(mon => !keep.includes(mon.uid)).map(mon => mon.uid) } };
  }
  if (game.step === 'wild_choice') return { actorId: p.id, action: { type: 'chooseWild', choice: 'catch' } };
  if (game.step === 'event_result') return { actorId: p.id, action: { type: 'ackEvent' } };
  if (game.step === 'capture') {
    if (p.pokemon.length >= MAX_POKEMON) return { actorId: p.id, action: { type: 'skipCapture' } };
    const wanted = game.pending.legendary ? ['basic', 'great', 'ultra'] : ['basic', 'great', 'ultra'];
    const ball = wanted.find(type => p.balls[type] > 0);
    return { actorId: p.id, action: ball ? { type: 'throwBall', ball } : { type: 'skipCapture' } };
  }
  if (game.step === 'shop') {
    if (p.balls.basic < 2 && p.coins >= 3) return { actorId: p.id, action: { type: 'buy', id: 'basic' } };
    return { actorId: p.id, action: { type: 'leaveShop' } };
  }
  if (game.step === 'item_overflow') return { actorId: p.id, action: { type: 'overflow' } };
  if (game.step === 'quest_choice') return { actorId: p.id, action: { type: 'chooseQuest', choice: p.quest ? 'keep' : 'accept' } };
  if (game.step === 'evolve_choice') {
    const eligible = p.pokemon.filter(mon => EVOLUTIONS[mon.species]);
    eligible.sort((a, b) => POKEMON[EVOLUTIONS[b.species]].power - POKEMON[EVOLUTIONS[a.species]].power);
    return { actorId: p.id, action: { type: 'evolve', uid: eligible[0]?.uid } };
  }
  return null;
}
