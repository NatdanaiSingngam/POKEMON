import { EXTRA_EVOLUTIONS, EXTRA_POKEMON } from './gen1-extra.js';

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
  great: { name: 'บอลน้ำเงิน', color: '#4598e6', bonus: 1, price: 2 },
  ultra: { name: 'บอลดำ', color: '#303c4b', bonus: 2, price: 3 },
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
  ...EXTRA_POKEMON,
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
  ...EXTRA_EVOLUTIONS,
};

export const QUESTS = {
  catch_two: { name: 'นักจับมือฉมัง', text: 'จับโปเกมอนให้สำเร็จ 2 ตัว', event: 'catch', target: 2, coins: 6, reward: 'item' },
  visit_city: { name: 'ท่องเมือง', text: 'แวะเมือง 2 ครั้ง', event: 'city', target: 2, coins: 5, reward: 'item' },
  win_battle: { name: 'ยอดนักสู้', text: 'ชนะการต่อสู้ 1 ครั้ง', event: 'battle', target: 1, coins: 6, reward: 'pokemon' },
  catch_three: { name: 'ถุงบอลรั่ว', text: 'จับโปเกมอนให้สำเร็จ 3 ตัว', event: 'catch', target: 3, coins: 9, reward: 'item' },
  city_regular: { name: 'ลูกค้าขาประจำ', text: 'แวะเมือง 3 ครั้ง', event: 'city', target: 3, coins: 8, reward: 'pokemon' },
  battle_two: { name: 'สายบวกประจำซอย', text: 'ชนะการต่อสู้ 2 ครั้ง', event: 'battle', target: 2, coins: 10, reward: 'item' },
  first_catch: { name: 'มือใหม่ใจกล้า', text: 'จับโปเกมอนให้สำเร็จ 1 ตัว', event: 'catch', target: 1, coins: 3, reward: 'item' },
  city_hopper: { name: 'เที่ยวทุกป้าย', text: 'แวะเมือง 4 ครั้ง', event: 'city', target: 4, coins: 12, reward: 'item' },
  battle_three: { name: 'ราชาเต๋าเดือด', text: 'ชนะการต่อสู้ 3 ครั้ง', event: 'battle', target: 3, coins: 15, reward: 'pokemon' },
};

export const ITEMS = {
  lucky_coin: { name: 'เหรียญนำโชค', icon: '✦', timing: 'outside', target: 'self', price: 4, text: 'รับเงิน 3 เหรียญ' },
  pickpocket: { name: 'มือไว', icon: '✋', timing: 'outside', target: 'other', price: 4, effect: 'steal', amount: 5, text: 'รับเงินจากคู่แข่งสูงสุด 5 เหรียญ' },
  full_heal: { name: 'ยาฟื้นทีม', icon: '✚', timing: 'outside', target: 'self', price: 2, text: 'ฟื้น HP โปเกมอนทั้งทีมจนเต็ม' },
  ball_box: { name: 'กล่องโปเกบอล', icon: '◉', timing: 'outside', target: 'self', price: 3, text: 'รับบอลแดง 3 ลูก' },
  tax_notice: { name: 'ใบเรียกเก็บ', icon: '▧', timing: 'outside', target: 'other', price: 3, effect: 'fine', amount: 6, text: 'คู่แข่งเสียเงินสูงสุด 6 เหรียญ' },
  potion: { name: 'ยารักษา', icon: '✚', timing: 'battle', target: 'self', price: 1, text: 'ฟื้น HP ตัวที่สู้ 3 หน่วย' },
  super_potion: { name: 'ยารักษาขั้นสูง', icon: '✚', timing: 'battle', target: 'self', price: 2, text: 'ฟื้น HP ตัวที่สู้ 6 หน่วย' },
  repel: { name: 'รีเพล', icon: '↗', timing: 'outside', target: 'self', price: 1, move: 2, text: 'ทอยเต๋าแล้วเดินเพิ่ม 2 ช่อง' },
  super_repel: { name: 'ซูเปอร์รีเพล', icon: '↗', timing: 'outside', target: 'self', price: 2, move: 4, text: 'ทอยเต๋าแล้วเดินเพิ่ม 4 ช่อง' },
  rare_candy: { name: 'แคนดี้', icon: '✦', timing: 'outside', target: 'self', price: 5, text: 'พัฒนาโปเกมอน 1 ตัวและฟื้น HP เต็ม' },
  bicycle: { name: 'จักรยาน', icon: '◆', timing: 'outside', target: 'self', price: 5, move: 6, text: 'ทอยเต๋าแล้วเดินเพิ่ม 6 ช่อง' },
  power_up: { name: 'พลังเร่ง', icon: '⚡', timing: 'battle', target: 'self', price: 4, text: 'การโจมตีครั้งถัดไปแรงขึ้น 2' },
  smoke: { name: 'ควันแกล้ง', icon: '☁', timing: 'battle', target: 'other', price: 3, text: 'แต้มเต๋าคู่แข่งครั้งถัดไป -2' },
  shield: { name: 'โล่ฉุกเฉิน', icon: '⬡', timing: 'battle', target: 'self', price: 3, text: 'ลดความเสียหายครั้งถัดไป 2' },
  tip_jar: { name: 'กระปุกทิป', icon: '◈', timing: 'outside', target: 'self', effect: 'coins', amount: 2, text: 'รับ 2 เหรียญ' },
  found_wallet: { name: 'กระเป๋าตก', icon: '▣', timing: 'outside', target: 'self', effect: 'coins', amount: 4, text: 'รับ 4 เหรียญ' },
  coupon: { name: 'คูปองลดราคา', icon: '✧', timing: 'outside', target: 'self', effect: 'coins', amount: 3, text: 'แลกคูปองรับ 3 เหรียญ' },
  street_show: { name: 'เปิดหมวก', icon: '♫', timing: 'outside', target: 'self', effect: 'coins', amount: 5, text: 'แสดงเปิดหมวกรับ 5 เหรียญ' },
  red_ball_pair: { name: 'บอลคู่จิ้น', icon: '◉', timing: 'outside', target: 'self', effect: 'balls', amount: 2, text: 'รับบอลแดง 2 ลูก' },
  red_ball_bundle: { name: 'บอลลดแลกแจกแถม', icon: '◉', timing: 'outside', target: 'self', effect: 'balls', amount: 4, text: 'รับบอลแดง 4 ลูก' },
  blue_ball_gift: { name: 'ของฝากชาวฟ้า', icon: '◉', timing: 'outside', target: 'self', effect: 'greatBall', amount: 1, text: 'รับบอลน้ำเงิน 1 ลูก' },
  black_ball_gift: { name: 'กล่องดำปริศนา', icon: '◉', timing: 'outside', target: 'self', effect: 'ultraBall', amount: 1, text: 'รับบอลดำ 1 ลูก' },
  team_snack: { name: 'ข้าวกล่องทีม', icon: '✚', timing: 'outside', target: 'self', effect: 'heal', amount: 2, text: 'ฟื้น HP ทุกตัว 2 หน่วย' },
  energy_drink: { name: 'น้ำชูกำลัง', icon: '✚', timing: 'outside', target: 'self', effect: 'heal', amount: 4, text: 'ฟื้น HP ทุกตัว 4 หน่วย' },
  bandage: { name: 'พลาสเตอร์ลายดาว', icon: '✚', timing: 'outside', target: 'self', effect: 'heal', amount: 1, text: 'ฟื้น HP ทุกตัว 1 หน่วย' },
  piggy_bank: { name: 'เขย่ากระปุก', icon: '◈', timing: 'outside', target: 'self', effect: 'coins', amount: 6, text: 'ทุบกระปุกรับ 6 เหรียญ' },
  loose_change: { name: 'เหรียญใต้โซฟา', icon: '◈', timing: 'outside', target: 'self', effect: 'coins', amount: 1, text: 'รับ 1 เหรียญ' },
  bus_ticket: { name: 'ตั๋วรถเมล์', icon: '↗', timing: 'outside', target: 'self', move: 1, text: 'ทอยเต๋าแล้วเดินเพิ่ม 1 ช่อง' },
  running_shoes: { name: 'รองเท้าวิ่ง', icon: '↗', timing: 'outside', target: 'self', move: 2, text: 'ทอยเต๋าแล้วเดินเพิ่ม 2 ช่อง' },
  scooter: { name: 'สกูตเตอร์มือสอง', icon: '↗', timing: 'outside', target: 'self', move: 3, text: 'ทอยเต๋าแล้วเดินเพิ่ม 3 ช่อง' },
  roller_skates: { name: 'โรลเลอร์สเกต', icon: '↗', timing: 'outside', target: 'self', move: 4, text: 'ทอยเต๋าแล้วเดินเพิ่ม 4 ช่อง' },
  turbo_boost: { name: 'เทอร์โบบูสต์', icon: '↗', timing: 'outside', target: 'self', move: 5, text: 'ทอยเต๋าแล้วเดินเพิ่ม 5 ช่อง' },
  prank_fine: { name: 'ใบสั่งปลอม', icon: '▧', timing: 'outside', target: 'other', effect: 'fine', amount: 4, text: 'คู่แข่งเสียเงินสูงสุด 4 เหรียญ' },
  snack_tax: { name: 'ภาษีขนม', icon: '▧', timing: 'outside', target: 'other', effect: 'steal', amount: 3, text: 'รับเงินจากคู่แข่งสูงสุด 3 เหรียญ' },
  parking_ticket: { name: 'ค่าจอดจักรยาน', icon: '▧', timing: 'outside', target: 'other', effect: 'fine', amount: 8, text: 'คู่แข่งเสียเงินสูงสุด 8 เหรียญ' },
};
export const SHOP_ITEMS = ['potion', 'super_potion', 'repel', 'super_repel', 'full_heal', 'rare_candy', 'bicycle'];
export const DRAW_ITEMS = Object.keys(ITEMS).filter(itemId => !SHOP_ITEMS.includes(itemId));

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
  { id: 'meme_coin', name: 'มีมขายดี', text: 'โพสต์มีมแล้วรับ 5 เหรียญ', kind: 'coins', amount: 5 },
  { id: 'lost_sock', name: 'ถุงเท้าหาย', text: 'ซื้อถุงเท้าใหม่ เสีย 1 เหรียญ', kind: 'coins', amount: -1 },
  { id: 'street_food', name: 'ร้านข้าวใจดี', text: 'กินอิ่ม ฟื้น HP ทั้งทีม', kind: 'heal' },
  { id: 'ball_rain', name: 'ฝนตกเป็นบอล', text: 'รับบอลแดง 4 ลูก', kind: 'balls', amount: 4 },
  { id: 'mystery_box', name: 'พัสดุไม่ระบุผู้ส่ง', text: 'จั่วไอเทม 1 ใบ', kind: 'item' },
  { id: 'bus_fare', name: 'ค่ารถแพงขึ้น', text: 'เสีย 3 เหรียญ', kind: 'coins', amount: -3 },
  { id: 'sponsor', name: 'สปอนเซอร์เข้าด่วน', text: 'รับ 6 เหรียญ', kind: 'coins', amount: 6 },
  { id: 'forgotten_ball', name: 'บอลในกระเป๋าเก่า', text: 'รับบอลแดง 1 ลูก', kind: 'balls', amount: 1 },
  { id: 'nap_time', name: 'งีบในโปเกมอนเซ็นเตอร์', text: 'ฟื้น HP ทั้งทีม', kind: 'heal' },
  { id: 'lucky_draw', name: 'วงล้อโชคดี', text: 'จั่วไอเทม 1 ใบ', kind: 'item' },
  { id: 'street_festival', name: 'งานวัด', text: 'รับ 2 เหรียญ', kind: 'coins', amount: 2 },
  { id: 'parking_fine', name: 'จอดผิดช่อง', text: 'เสีย 2 เหรียญ', kind: 'coins', amount: -2 },
];
