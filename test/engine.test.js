import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, actionsForBot } from '../src/game/engine.js';
import { ITEMS, POKEMON, POOLS, ROLES, TILES } from '../src/game/data.js';

const people = [0,1,2,3].map(i => ({ id: `p${i}`, name: `Player ${i}`, role: ['trainer','fisher','scientist','rocket'][i] }));
const fixed = value => () => (value - 1) / 6 + 0.001;
const run = (game, id, action, die = 1) => {
  const result = applyAction(game, id, action, fixed(die));
  assert.equal(result.ok, true, result.error);
};

test('crossing Start stops movement, sells with one left, completes after third lap', () => {
  const game = createGame(people);
  const p = game.players[0];
  p.position = 38;
  run(game, p.id, { type: 'roll' }, 4);
  assert.equal(p.position, 0);
  assert.equal(p.laps, 1);
  assert.equal(p.balls.basic, 8);
  assert.equal(game.step, 'sale');
  assert.equal(applyAction(game, p.id, { type: 'sell', ids: [p.pokemon[0].uid] }).ok, false);
  run(game, p.id, { type: 'sell', ids: [] });
  assert.equal(game.turn, 1);
  game.turn = 0; game.step = 'roll'; p.position = 39; p.laps = 2;
  run(game, p.id, { type: 'roll' }, 1);
  assert.equal(p.balls.basic, 11);
  run(game, p.id, { type: 'sell', ids: [p.pokemon[0].uid] });
  assert.equal(p.done, true);
  assert.equal(p.pokemon.length, 0);
});

test('each turn starts with one item, and a full hand resolves before rolling', () => {
  const game = createGame(people, fixed(1));
  assert.equal(game.players[0].items.length, 1);
  assert.equal(game.step, 'roll');
  game.players[1].items = ['lucky_coin', 'potion', 'shield', 'smoke'];
  run(game, 'p0', { type: 'roll' }, 1);
  assert.equal(game.step, 'capture');
  run(game, 'p0', { type: 'skipCapture' }, 1);
  assert.equal(game.turn, 1);
  assert.equal(game.step, 'item_overflow');
  assert.equal(game.pending.source, 'turn');
  assert.equal(game.players[1].items.length, 4);
  const drawn = game.pending.itemId;
  assert.ok(ITEMS[drawn]);
  run(game, 'p1', { type: 'overflow', replaceIndex: 0 }, 1);
  assert.equal(game.turn, 1);
  assert.equal(game.step, 'roll');
  assert.equal(game.players[1].items[0], drawn);
  assert.equal(game.players[1].items.length, 4);
  run(game, 'p1', { type: 'roll' }, 1);
  assert.notEqual(game.step, 'item_overflow');
});

test('capture uses zone threshold, ball is spent, and a team of six cannot catch', () => {
  const game = createGame(people);
  const p = game.players[0];
  p.position = 21; // purple wild
  game.step = 'capture'; game.pending = { kind: 'catch', zone: 'purple', species: 'charizard', legendary: false };
  run(game, p.id, { type: 'throwBall', ball: 'basic' }, 2); // trainer bonus gives 3, below 4
  assert.equal(p.pokemon.length, 1);
  assert.equal(p.balls.basic, 4);
  assert.equal(game.step, 'capture');
  assert.equal(game.pending.species, 'charizard');
  game.turn = 0; game.step = 'capture'; game.pending = { kind: 'catch', zone: 'purple', species: 'charizard', legendary: false };
  p.balls.great = 1;
  run(game, p.id, { type: 'throwBall', ball: 'great' }, 2); // +1 ball +1 trainer
  assert.equal(p.pokemon.length, 2);
  while (p.pokemon.length < 6) p.pokemon.push({ uid: `extra-${p.pokemon.length}`, species: 'pikachu', hp: POKEMON.pikachu.hp });
  game.turn = 0; game.step = 'capture'; game.pending = { kind: 'catch', zone: 'green', species: 'rattata', legendary: false };
  assert.equal(applyAction(game, p.id, { type: 'throwBall', ball: 'basic' }).ok, false);
});

test('legendary requires natural six even with boosted ball', () => {
  const game = createGame(people), p = game.players[0];
  p.balls.ultra = 2;
  game.step = 'capture'; game.pending = { kind: 'catch', zone: 'legendary', species: 'mewtwo', legendary: true };
  run(game, p.id, { type: 'throwBall', ball: 'ultra' }, 5);
  assert.equal(p.pokemon.length, 1);
  game.turn = 0; game.step = 'capture'; game.pending = { kind: 'catch', zone: 'legendary', species: 'mewtwo', legendary: true };
  run(game, p.id, { type: 'throwBall', ball: 'ultra' }, 6);
  assert.equal(p.pokemon.length, 2);
});

test('later player landing on occupied wild tile can force PvP and winner gains three', () => {
  const game = createGame(people);
  game.turn = 1; game.players[1].position = 2; game.players[0].position = 3;
  run(game, 'p1', { type: 'roll' }, 1);
  assert.equal(game.step, 'wild_choice');
  run(game, 'p1', { type: 'chooseWild', choice: 'battle' });
  assert.equal(game.step, 'battle_pick');
  run(game, 'p1', { type: 'chooseFighter', uid: game.players[1].pokemon[0].uid });
  run(game, 'p0', { type: 'chooseFighter', uid: game.players[0].pokemon[0].uid });
  for (let i = 0; i < 6 && game.step === 'battle_roll'; i++) {
    run(game, 'p1', { type: 'battleRoll' }, 6);
    run(game, 'p0', { type: 'battleRoll' }, 1);
  }
  assert.equal(game.players[1].coins, 13);
  assert.equal(game.players[0].coins, 10);
});

test('city restores fainted Pokemon HP', () => {
  const game = createGame(people), p = game.players[0];
  p.position = 4; p.pokemon[0].hp = 0;
  run(game, p.id, { type: 'roll' }, 1);
  assert.equal(game.step, 'shop');
  assert.equal(p.pokemon[0].hp, POKEMON[p.pokemon[0].species].hp);
});

test('encounter pools follow first, second, third and rare categories', () => {
  const first = ['bulbasaur','charmander','squirtle','magikarp','rattata','pidgey','caterpie','oddish','dratini','nidoran'];
  const second = ['ivysaur','charmeleon','wartortle','metapod','pidgeotto','gloom','dragonair','nidorina','pikachu','gyarados','raticate'];
  const third = ['venusaur','charizard','blastoise','butterfree','pidgeot','vileplume','dragonite','nidoqueen','raichu'];
  const rare = ['lapras','snorlax','ditto','chansey','aerodactyl','scyther','tauros','kangaskhan'];
  assert.deepEqual([...POOLS.green].sort(), first.sort());
  assert.deepEqual([...POOLS.blue].sort(), second.sort());
  assert.deepEqual([...POOLS.purple].sort(), third.sort());
  assert.deepEqual([...POOLS.red].sort(), rare.sort());
  assert.ok(Object.values(ROLES).every(role => POOLS.green.includes(role.starter)));
});

test('cave requires an exact landing and skips three future turns', () => {
  assert.deepEqual([2, 22].map(i => TILES[i].type), ['quest', 'quest']);
  assert.deepEqual([12, 32].map(i => TILES[i].type), ['gym', 'gym']);
  assert.deepEqual([18, 28].map(i => TILES[i].type), ['cave', 'cave']);
  assert.deepEqual([10, 30].map(i => TILES[i].type), ['villain', 'villain']);
  const game = createGame(people), p = game.players[0];
  p.position = 16;
  run(game, p.id, { type: 'roll' }, 4);
  assert.equal(p.position, 20);
  assert.equal(p.laps, 0);
  game.turn = 0; game.step = 'roll'; p.position = 17;
  run(game, p.id, { type: 'roll' }, 1);
  assert.equal(p.position, 18);
  assert.equal(p.caveTurns, 3);
  assert.equal(game.turn, 1);
  for (let skipped = 2; skipped >= 0; skipped--) {
    for (let turn = 1; turn <= 3; turn++) {
      const other = game.players[turn];
      game.step = 'capture'; game.pending = { kind: 'catch', zone: 'green', species: 'rattata', legendary: false };
      run(game, other.id, { type: 'skipCapture' });
    }
    assert.equal(p.caveTurns, skipped);
    assert.equal(game.turn, 1);
  }
});

test('random event stays visible until acknowledged', () => {
  const game = createGame(people), p = game.players[0];
  p.position = 7;
  run(game, p.id, { type: 'roll' }, 1);
  assert.equal(game.step, 'event_result');
  assert.equal(game.notice.kind, 'event');
  assert.equal(p.coins, 13);
  run(game, p.id, { type: 'ackEvent' });
  assert.equal(game.turn, 1);
  assert.equal(game.notice, null);
});

test('quest acceptance, completion reward and abandonment', () => {
  const game = createGame(people), p = game.players[0];
  p.position = 1;
  run(game, p.id, { type: 'roll' }, 1);
  assert.equal(game.step, 'quest_choice');
  run(game, p.id, { type: 'chooseQuest', choice: 'accept' });
  assert.equal(p.quest.id, 'catch_two');
  game.turn = 0; game.step = 'capture'; game.pending = { kind: 'catch', zone: 'green', species: 'pidgey', legendary: false };
  run(game, p.id, { type: 'throwBall', ball: 'basic' }, 6);
  assert.equal(p.quest.progress, 1);
  game.turn = 0; game.step = 'capture'; game.pending = { kind: 'catch', zone: 'green', species: 'pidgey', legendary: false };
  run(game, p.id, { type: 'throwBall', ball: 'basic' }, 6);
  assert.equal(p.quest, null);
  assert.equal(p.coins, 16);
  p.quest = { id: 'visit_city', progress: 1 };
  game.turn = 0; game.step = 'roll';
  run(game, p.id, { type: 'abandonQuest' });
  assert.equal(p.quest, null);
});

test('gym badge gates purple fighters and villain victory evolves a team member', () => {
  const game = createGame(people), p = game.players[0];
  p.pokemon.push({ uid: 'purple', species: 'charizard', hp: 11, caughtZone: 'purple' });
  p.position = 11;
  run(game, p.id, { type: 'roll' }, 1);
  assert.equal(game.step, 'battle_pick');
  assert.equal(applyAction(game, p.id, { type: 'chooseFighter', uid: 'purple' }, fixed(1)).ok, false);
  run(game, p.id, { type: 'chooseFighter', uid: p.pokemon[0].uid });
  for (let i = 0; i < 12 && game.step === 'battle_roll'; i++) {
    run(game, p.id, { type: 'battleRoll' }, 6);
    run(game, 'wild', { type: 'battleRoll' }, 1);
  }
  assert.deepEqual(p.badges, [12]);
  game.turn = 0; p.position = 9; game.step = 'roll';
  run(game, p.id, { type: 'roll' }, 1);
  run(game, p.id, { type: 'chooseFighter', uid: 'purple' });
  for (let i = 0; i < 12 && game.step === 'battle_roll'; i++) {
    run(game, p.id, { type: 'battleRoll' }, 6);
    run(game, 'wild', { type: 'battleRoll' }, 1);
  }
  assert.equal(game.step, 'evolve_choice');
  assert.equal(p.coins, 15);
  run(game, p.id, { type: 'evolve', uid: p.pokemon[0].uid });
  assert.equal(p.pokemon[0].species, 'charmeleon');
});

test('four bots can play through to a scored finish without a stuck step', () => {
  const game = createGame(people.map(p => ({ ...p, bot: true })));
  let turns = 0;
  while (game.phase !== 'finished' && turns < 3000) {
    const next = actionsForBot(game, fixed(4));
    assert.ok(next, `bot stuck at ${game.step}`);
    run(game, next.actorId, next.action, next.actorId === 'wild' ? 3 : 4);
    turns++;
  }
  assert.equal(game.phase, 'finished');
  assert.ok(game.players.every(p => p.laps === 3 && p.done));
  assert.ok(game.result.winners.length >= 1);
});

test('many randomized full games finish with legal money and roster limits', () => {
  for (let seed = 1; seed <= 30; seed++) {
    let value = seed;
    const rng = () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
    const game = createGame(people.map(p => ({ ...p, bot: true })), rng);
    let actions = 0;
    while (game.phase !== 'finished' && actions < 3000) {
      const next = actionsForBot(game, rng);
      assert.ok(next, `seed ${seed} stuck at ${game.step}`);
      const result = applyAction(game, next.actorId, next.action, rng);
      assert.equal(result.ok, true, `seed ${seed}: ${result.error}`);
      actions++;
    }
    assert.equal(game.phase, 'finished', `seed ${seed} did not finish`);
    assert.ok(game.players.every(p => p.coins >= 0 && p.pokemon.length <= 6 && p.items.length <= 4));
  }
});
