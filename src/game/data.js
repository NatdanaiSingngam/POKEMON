export const MAX_POKEMON = 6;
export const MAX_ITEMS = 6;
export const LAPS_TO_WIN = 3;

export const ZONES = {
  green: { name: 'โซนเขียว · ร่างแรก', color: '#39b769', threshold: 2 },
  blue: { name: 'โซนฟ้า · ร่างสอง', color: '#42b0d9', threshold: 3 },
  purple: { name: 'โซนม่วง · ร่างสาม', color: '#9867d0', threshold: 4 },
  red: { name: 'โซนแดง · โปเกมอนหายาก', color: '#df6272', threshold: 5 },
};

export const BALLS = {
  basic: { name: 'บอลแดง', color: '#f26970', bonus: 0, price: 1 },
  great: { name: 'บอลน้ำเงิน', color: '#4598e6', bonus: 1, price: 3 },
  ultra: { name: 'บอลดำ', color: '#303c4b', bonus: 2, price: 5 },
};

export const ROLES = {
  trainer: { name: 'เทรนเนอร์', color: '#ed6475', starter: 'charmander', ability: 'จับโปเกมอนทั่วไป +1', effect: 'catch' },
  fisher: { name: 'นักตกปลา', color: '#51ace8', starter: 'magikarp', ability: 'ขายโปเกมอนที่จับในโซนฟ้า +2 เหรียญ', effect: 'blue_sale' },
  scientist: { name: 'นักวิทยาศาสตร์', color: '#a889e3', starter: 'squirtle', ability: 'โปเกบอลน้ำเงินและดำเพิ่มโบนัสอีก +1', effect: 'ball' },
  rocket: { name: 'แก๊งร็อกเก็ต', color: '#373947', starter: 'rattata', ability: 'ชนะผู้เล่นอื่นได้เงินเพิ่มอีก 1 เหรียญ', effect: 'battle_coin' },
};

const p = (name, zone, hp, power, price, color, shape, ability, abilityText) => ({
  name, zone, hp, power, price, color, shape, ability, abilityText,
});
export const POKEMON = {
  bulbasaur: p('ฟุชิกิดาเนะ', 'green', 6, 2, 4, '#75bb9f', 'plant', 'heal', 'หลังชนะฟื้น 1 HP'),
  charmander: p('ฮิโตคาเงะ', 'green', 5, 2, 4, '#ed9955', 'lizard', 'power', 'โจมตีครั้งแรก +1'),
  squirtle: p('เซนิกาเมะ', 'green', 6, 2, 4, '#71b6d9', 'turtle', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  magikarp: p('คอยคิง', 'green', 4, 1, 2, '#ef774f', 'fish', 'sale', 'ขายได้เพิ่ม 1 เหรียญ'),
  rattata: p('โครัตตา', 'green', 5, 2, 3, '#a876c7', 'mouse', 'power', 'โจมตีครั้งแรก +1'),
  raticate: p('รัตตา', 'blue', 8, 3, 8, '#a876a7', 'mouse', 'power', 'โจมตีครั้งแรก +1'),
  pidgey: p('ป๊อปโปะ', 'green', 4, 2, 3, '#bba37a', 'bird', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  caterpie: p('คาเตอร์ปี', 'green', 6, 1, 3, '#7aba5e', 'bug', 'heal', 'หลังชนะฟื้น 1 HP'),
  oddish: p('นาโซโนะคุสะ', 'green', 5, 2, 3, '#73a0d5', 'plant', 'sale', 'ขายได้เพิ่ม 1 เหรียญ'),
  dratini: p('มินิริว', 'green', 6, 2, 5, '#82b0d7', 'dragon', 'heal', 'หลังชนะฟื้น 1 HP'),
  nidoran: p('นิโดรัน', 'green', 5, 2, 4, '#8bb8da', 'mouse', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  ivysaur: p('ฟุชิกิโซ', 'blue', 8, 3, 8, '#69b796', 'plant', 'heal', 'หลังชนะฟื้น 1 HP'),
  charmeleon: p('ลิซาโดะ', 'blue', 7, 4, 8, '#e5835e', 'lizard', 'power', 'โจมตีครั้งแรก +1'),
  wartortle: p('คาเมล', 'blue', 8, 3, 8, '#6d9fd0', 'turtle', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  metapod: p('ทรานเซล', 'blue', 10, 2, 7, '#83a65d', 'bug', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  pidgeotto: p('พีเจียน', 'blue', 7, 4, 8, '#ba9674', 'bird', 'power', 'โจมตีครั้งแรก +1'),
  gloom: p('คุไซฮานะ', 'blue', 8, 3, 8, '#718dca', 'plant', 'sale', 'ขายได้เพิ่ม 1 เหรียญ'),
  dragonair: p('ฮาคุริว', 'blue', 9, 4, 10, '#7e9ed6', 'dragon', 'heal', 'หลังชนะฟื้น 1 HP'),
  nidorina: p('นิโดรินา', 'blue', 8, 3, 8, '#679bc6', 'mouse', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  pikachu: p('พิคาชู', 'blue', 6, 4, 9, '#f1cf4a', 'mouse', 'power', 'โจมตีครั้งแรก +1'),
  gyarados: p('เกียราดอส', 'blue', 10, 5, 11, '#548ec7', 'dragon', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  venusaur: p('ฟุชิกิบานะ', 'purple', 12, 5, 16, '#5a9d79', 'plant', 'heal', 'หลังชนะฟื้น 1 HP'),
  charizard: p('ลิซาร์ดอน', 'purple', 11, 6, 17, '#e8844c', 'dragon', 'power', 'โจมตีครั้งแรก +1'),
  blastoise: p('คาเม็กซ์', 'purple', 13, 5, 17, '#5586bd', 'turtle', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  butterfree: p('บัตเตอร์ฟรี', 'purple', 9, 5, 14, '#9a91c5', 'bird', 'heal', 'หลังชนะฟื้น 1 HP'),
  pidgeot: p('พีเจียต', 'purple', 10, 6, 15, '#bd9768', 'bird', 'power', 'โจมตีครั้งแรก +1'),
  vileplume: p('รัฟเฟรเซีย', 'purple', 11, 5, 15, '#b45c8e', 'plant', 'sale', 'ขายได้เพิ่ม 1 เหรียญ'),
  dragonite: p('ไคริว', 'purple', 13, 6, 19, '#dcae66', 'dragon', 'heal', 'หลังชนะฟื้น 1 HP'),
  nidoqueen: p('นิโดควีน', 'purple', 12, 5, 17, '#5886b9', 'dragon', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  raichu: p('ไรชู', 'purple', 10, 6, 16, '#e0a45f', 'mouse', 'power', 'โจมตีครั้งแรก +1'),
  lapras: p('ลาพลาซ', 'red', 12, 5, 19, '#6cacc9', 'turtle', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  snorlax: p('คาบิกอน', 'red', 15, 5, 19, '#5c8584', 'bear', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  ditto: p('เมตามอน', 'red', 10, 4, 17, '#b588bd', 'blob', 'copy', 'พลังโจมตีเท่าคู่ต่อสู้ถ้าสูงกว่า'),
  chansey: p('ลัคกี', 'red', 18, 3, 18, '#eba7b5', 'blob', 'heal', 'หลังชนะฟื้น 1 HP'),
  aerodactyl: p('พเทรา', 'red', 11, 7, 22, '#8c8bba', 'dragon', 'power', 'โจมตีครั้งแรก +1'),
  scyther: p('สไตรค์', 'red', 11, 7, 21, '#83b86c', 'bug', 'power', 'โจมตีครั้งแรก +1'),
  tauros: p('เคนทารอส', 'red', 13, 6, 20, '#a38569', 'bear', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  kangaskhan: p('การูรา', 'red', 14, 6, 22, '#ac9279', 'bear', 'heal', 'หลังชนะฟื้น 1 HP'),
  mewtwo: p('มิวทู', 'legendary', 15, 7, 26, '#b7a7d0', 'legendary', 'copy', 'พลังโจมตีเท่าคู่ต่อสู้ถ้าสูงกว่า'),
  articuno: p('ฟรีเซอร์', 'legendary', 13, 6, 23, '#8bcce4', 'bird', 'dodge', 'ลดความเสียหายครั้งแรก 1'),
  zapdos: p('ธันเดอร์', 'legendary', 12, 7, 23, '#ebc857', 'bird', 'power', 'โจมตีครั้งแรก +1'),
  moltres: p('ไฟเยอร์', 'legendary', 12, 7, 23, '#e77e55', 'bird', 'heal', 'หลังชนะฟื้น 1 HP'),
};

export const POOLS = Object.fromEntries(['green', 'blue', 'purple', 'red', 'legendary'].map(zone => [
  zone, Object.keys(POKEMON).filter(key => POKEMON[key].zone === zone),
]));

export const EVOLUTIONS = {
  bulbasaur: 'ivysaur', ivysaur: 'venusaur', charmander: 'charmeleon', charmeleon: 'charizard',
  squirtle: 'wartortle', wartortle: 'blastoise', magikarp: 'gyarados', rattata: 'raticate',
  pidgey: 'pidgeotto', pidgeotto: 'pidgeot', caterpie: 'metapod', metapod: 'butterfree',
  oddish: 'gloom', gloom: 'vileplume', dratini: 'dragonair', dragonair: 'dragonite',
  nidoran: 'nidorina', nidorina: 'nidoqueen', pikachu: 'raichu',
};

export const QUESTS = {
  catch_two: { name: 'นักจับมือฉมัง', text: 'จับโปเกมอนให้สำเร็จ 2 ตัว', event: 'catch', target: 2, coins: 6, reward: 'item' },
  visit_city: { name: 'ท่องเมือง', text: 'แวะเมือง 2 ครั้ง', event: 'city', target: 2, coins: 5, reward: 'item' },
  win_battle: { name: 'ยอดนักสู้', text: 'ชนะการต่อสู้ 1 ครั้ง', event: 'battle', target: 1, coins: 6, reward: 'pokemon' },
};

export const ITEMS = {
  lucky_coin: { name: 'เหรียญนำโชค', icon: '✦', timing: 'outside', target: 'self', price: 4, text: 'รับเงิน 3 เหรียญ' },
  pickpocket: { name: 'มือไว', icon: '✋', timing: 'outside', target: 'other', price: 4, text: 'รับเงินจากคู่แข่งไม่เกิน 2 เหรียญ' },
  full_heal: { name: 'ยาฟื้นทีม', icon: '✚', timing: 'outside', target: 'self', price: 3, text: 'ฟื้น HP โปเกมอนทั้งทีมจนเต็ม' },
  ball_box: { name: 'กล่องโปเกบอล', icon: '◉', timing: 'outside', target: 'self', price: 3, text: 'รับบอลแดง 3 ลูก' },
  tax_notice: { name: 'ใบเรียกเก็บ', icon: '▧', timing: 'outside', target: 'other', price: 3, text: 'คู่แข่งเสียเงิน 2 เหรียญ' },
  potion: { name: 'ยาฉุกเฉิน', icon: '✚', timing: 'battle', target: 'self', price: 3, text: 'ฟื้น HP ตัวที่สู้ 3 หน่วย' },
  power_up: { name: 'พลังเร่ง', icon: '⚡', timing: 'battle', target: 'self', price: 4, text: 'การโจมตีครั้งถัดไปแรงขึ้น 2' },
  smoke: { name: 'ควันแกล้ง', icon: '☁', timing: 'battle', target: 'other', price: 3, text: 'แต้มเต๋าคู่แข่งครั้งถัดไป -2' },
  shield: { name: 'โล่ฉุกเฉิน', icon: '⬡', timing: 'battle', target: 'self', price: 3, text: 'ลดความเสียหายครั้งถัดไป 2' },
};

const tile = (type, zone, label) => ({ type, zone, label });
export const TILES = Array.from({ length: 40 }, (_, i) => {
  const side = Math.floor((i - 1) / 10);
  const zone = ['green', 'blue', 'purple', 'red'][Math.max(0, Math.min(3, side))];
  if (i === 0) return tile('start', 'green', 'เริ่มต้น');
  if ([5, 15, 25, 35].includes(i)) return tile('city', zone, 'เมือง');
  if ([2, 22].includes(i)) return tile('quest', zone, 'เควส');
  if ([8, 39].includes(i)) return tile('event', zone, 'สุ่มเหตุการณ์');
  if ([10, 30].includes(i)) return tile('villain', zone, 'วายร้าย');
  if ([12, 32].includes(i)) return tile('gym', zone, 'ยิม');
  if ([18, 28].includes(i)) return tile('cave', zone, 'ถ้ำ');
  if (i === 20) return tile('legendary', 'purple', 'ช่องทอง');
  return tile('wild', zone, 'มอนสเตอร์ป่า');
});

export const EVENTS = [
  { id: 'coin3', name: 'เจอเหรียญ', text: 'รับเงิน 3 เหรียญ', kind: 'coins', amount: 3 },
  { id: 'coin2', name: 'ลูกค้าประจำ', text: 'รับเงิน 2 เหรียญ', kind: 'coins', amount: 2 },
  { id: 'fine2', name: 'ค่าซ่อมอุปกรณ์', text: 'เสียเงินไม่เกิน 2 เหรียญ', kind: 'coins', amount: -2 },
  { id: 'ball2', name: 'ของฝากนักเดินทาง', text: 'รับบอลแดง 2 ลูก', kind: 'balls', amount: 2 },
  { id: 'heal', name: 'พักแรม', text: 'ฟื้น HP ทั้งทีม', kind: 'heal' },
  { id: 'item', name: 'กล่องลึกลับ', text: 'จั่วไอเทม 1 ใบ', kind: 'item' },
  { id: 'legendary', name: 'LEGENDARY IN AREA', text: 'พบโปเกมอนตำนาน', kind: 'legendary' },
];
