import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROLES, TILES } from './game/data.js';
import { POKEDEX } from './game/artwork.js';

const materialCache = new Map();
function mat(color, roughness = .86) {
  const key = `${color}:${roughness}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
  return materialCache.get(key);
}
function cube(parent, w, h, d, color, x = 0, y = 0, z = 0, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function tileTexture(tile, index) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const zoneColor = { green: '#36bb64', blue: '#43b7d4', purple: '#9952d2', red: '#e34b61' }[tile.zone];
  const ink = '#252a2b', gray = '#7c8888', white = '#f7f9f5';
  const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const px = (x, y, w, h, color = ink) => rect(16 + x * 4, 5 + y * 4, w * 4, h * 4, color);
  rect(0, 0, 96, 96, tile.type === 'start' || tile.type === 'villain' || tile.type === 'legendary' ? '#d9e0df' : '#f1f4f1');
  rect(0, 0, 96, 3, '#83908c'); rect(0, 93, 96, 3, '#83908c');
  rect(0, 0, 3, 96, '#83908c'); rect(93, 0, 3, 96, '#83908c');
  if (index % 10 !== 0) {
    const side = Math.floor((index - 1) / 10);
    if (side === 0) rect(4, 88, 88, 7, zoneColor);
    if (side === 1) rect(2, 4, 8, 88, zoneColor);
    if (side === 2) rect(4, 2, 88, 7, zoneColor);
    if (side === 3) rect(86, 4, 8, 88, zoneColor);
  }
  if (tile.type === 'wild') {
    const ring = [[6,1,4,1],[4,2,8,1],[3,3,3,1],[10,3,3,1],[2,4,2,2],[12,4,2,2],[1,6,2,4],[13,6,2,4],[2,10,2,2],[12,10,2,2],[3,12,3,1],[10,12,3,1],[4,13,8,1],[6,14,4,1]];
    ring.forEach(([x,y,w,h]) => px(x,y,w,h,zoneColor));
    px(6,6,4,4,white); px(7,7,2,2,zoneColor);
  } else if (tile.type === 'quest') {
    px(6,1,4,2,'#c52d4b'); px(5,3,6,2,'#d93151'); px(6,5,4,5,'#d93151');
    px(7,10,2,1,'#b71d3f'); px(6,12,4,2,'#d93151'); px(7,14,2,1,'#b71d3f');
  } else if (tile.type === 'event') {
    px(8,0,3,2,'#f0cb49'); px(7,2,3,2,'#e9bd34'); px(6,4,3,2,'#f0cb49');
    px(5,6,7,2,'#e9bd34'); px(8,8,3,2,'#f0cb49'); px(7,10,3,2,'#e9bd34'); px(6,12,3,2,'#f0cb49');
  } else if (tile.type === 'city' || tile.type === 'gym') {
    px(2,2,12,1,ink); px(1,3,14,1,gray); px(2,4,12,10,ink);
    px(3,5,10,8,white); px(4,6,8,1,gray); px(4,8,8,1,gray); px(4,11,8,1,gray);
    if (tile.type === 'city') { px(5,7,2,1,ink); px(9,7,2,1,ink); px(5,9,2,2,ink); px(9,9,2,2,ink); }
    else { px(5,7,2,4,ink); px(8,7,3,4,ink); px(4,12,8,1,ink); }
    px(1,14,14,1,ink);
  } else if (tile.type === 'cave') {
    px(2,11,12,4,'#253b48'); px(3,7,10,4,'#435865'); px(5,4,6,3,'#5f7480');
    px(6,9,4,6,'#172f3c'); px(7,5,2,3,'#b3c6c9');
  } else if (tile.type === 'villain') {
    px(2,7,12,5,ink); px(4,5,7,2,gray); px(5,6,4,2,white); px(11,8,3,3,'#737d7b');
    px(3,10,2,3,ink); px(11,10,2,3,ink); px(4,12,2,2,gray); px(10,12,2,2,gray);
    px(1,7,2,2,gray); px(13,6,2,2,gray); px(6,9,3,2,white);
  } else if (tile.type === 'legendary') {
    px(5,2,6,2,ink); px(3,4,10,2,ink); px(2,6,12,5,ink); px(4,11,8,2,ink);
    px(5,13,2,2,ink); px(9,13,2,2,ink); px(4,7,2,2,white); px(10,7,2,2,white);
    px(7,10,2,1,white); px(1,5,2,2,ink); px(13,5,2,2,ink);
  } else if (tile.type === 'start') {
    px(5,2,6,1,ink); px(3,3,10,3,'#e7ebea'); px(2,6,12,4,'#e44d59');
    px(2,9,12,1,ink); px(3,10,10,3,white); px(5,13,6,1,ink); px(6,7,4,4,ink); px(7,8,2,2,white);
  }
  if (tile.type !== 'wild') {
    ctx.fillStyle = ink; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const labels = { start: 'เริ่ม', city: 'เมือง', quest: 'เควส', event: 'สุ่ม', gym: 'ยิม', cave: 'ถ้ำ', villain: 'วายร้าย', legendary: 'ตำนาน' };
    ctx.fillText(labels[tile.type] || '', 48, 79, 86);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
}
function tilePosition(i) {
  const step = 1.12;
  if (i <= 10) return [5.6 - i * step, 5.6];
  if (i <= 20) return [-5.6, 5.6 - (i - 10) * step];
  if (i <= 30) return [-5.6 + (i - 20) * step, -5.6];
  return [5.6, -5.6 + (i - 30) * step];
}
const POSITIONS = TILES.map((_, i) => tilePosition(i));

function pixelGroundTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  for (let z = 0; z < 64; z++) for (let x = 0; x < 64; x++) {
    const dx = (x - 31.5) / 31.5, dz = (z - 31.5) / 31.5;
    const radius = Math.hypot(dx, dz);
    const jag = Math.sin(x * 1.93 + z * .43) * .028 + Math.cos(z * 1.65 - x * .37) * .02;
    let color = radius < .23 + jag ? '#dedbb1' : radius < .78 + jag ? '#faf7df' : '#86d651';
    if (radius > .79 && (x * 13 + z * 19) % 31 === 0) color = '#97d86d';
    if (radius < .77 && radius > .27 && (x * 7 + z * 11) % 47 === 0) color = '#d9d4aa';
    ctx.fillStyle = color; ctx.fillRect(x, z, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function battleFloorTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e6e2d0'; ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    ctx.fillStyle = (x + y) % 2 ? '#efecde' : '#e9e5d6';
    ctx.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
    ctx.fillStyle = '#d5d0bd';
    ctx.fillRect(x * 16 + 3, y * 16 + 5, 10, 2);
    ctx.fillRect(x * 16 + 3, y * 16 + 10, 10, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function tree(scene, x, z, green = '#29965b', size = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(size); scene.add(g);
  cube(g, .22, .78, .22, '#785a35', 0, .4, 0);
  cube(g, 1.05, .5, .96, '#187d43', 0, .91, 0);
  cube(g, .96, .48, .92, green, 0, 1.24, 0);
  cube(g, .68, .38, .67, green, 0, 1.58, 0);
  cube(g, .42, .24, .43, '#65bf58', 0, 1.85, 0);
  return g;
}
function bush(scene, x, z, color = '#328c62') {
  cube(scene, .31, .27, .31, color, x, .14, z);
  cube(scene, .18, .16, .18, '#58b56a', x + .16, .16, z + .05);
}
function building(scene, x, z, roof, symbol, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); scene.add(g);
  const shade = new THREE.Color(roof).multiplyScalar(.72).getStyle();
  cube(g, 1.73, .09, 1.63, '#c0c7bd', 0, .07, 0);
  cube(g, 1.55, 1.1, 1.38, '#f2ddc6', 0, .62, 0);
  for (let i = 0; i < 6; i++) cube(g, 1.56, .025, .025, i % 2 ? '#e8d0ba' : '#faf0da', 0, .22 + i * .16, .697, false);
  cube(g, 1.89, .13, 1.68, shade, 0, 1.19, 0);
  cube(g, 1.83, .16, 1.65, roof, 0, 1.31, 0);
  cube(g, 1.72, .10, 1.55, roof, 0, 1.43, 0);
  for (let i = 0; i < 11; i++) cube(g, .025, .012, 1.55, shade, -.78 + i * .156, 1.485, 0, false);
  cube(g, .43, .66, .045, '#79513b', .24, .38, .72);
  cube(g, .34, .30, .05, '#75b8cd', -.35, .74, .73);
  cube(g, .39, .035, .07, '#fff4df', -.35, .92, .76);
  cube(g, .28, .22, .04, '#83c4d2', -.52, .7, -.72);
  cube(g, .59, .06, .32, '#9f9f91', .25, .09, .89);
  cube(g, .38, .2, .06, '#f8f4e7', -.28, 1.04, .75);
  if (symbol) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.textAlign = 'center'; ctx.fillStyle = '#302d35';
    ctx.font = 'bold 72px system-ui'; ctx.fillText(symbol, 64, 91);
    const t = new THREE.CanvasTexture(canvas);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(.36, .36), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    plaque.position.set(-.28, 1.05, .79); g.add(plaque);
  }
  return g;
}

function fence(scene, x, z, alongX = true, posts = 5) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const step = .28;
  for (let i = 0; i < posts; i++) {
    const offset = (i - (posts - 1) / 2) * step;
    cube(g, .08, .49, .08, '#e0ddd0', alongX ? offset : 0, .25, alongX ? 0 : offset);
  }
  cube(g, alongX ? posts * step : .07, .07, alongX ? .07 : posts * step, '#c4bfb2', 0, .3, 0);
  return g;
}
function voxelAvatar(role) {
  const g = new THREE.Group();
  const skin = '#f2c59f', hair = '#253039', navy = '#273d53', roleColor = ROLES[role]?.color || '#ed6475';
  cube(g, .63, .09, .56, '#263940', 0, .04, 0, false);
  cube(g, .56, .035, .5, roleColor, 0, .10, 0, false);
  for (const x of [-.15, .15]) {
    cube(g, .16, .25, .22, navy, x, .25, .01);
    cube(g, .18, .11, .25, '#20272f', x, .13, .07);
  }
  cube(g, .39, .42, .32, role === 'rocket' ? '#f2f0e8' : role === 'scientist' ? '#e7f0ec' : role === 'fisher' ? '#4c9bcb' : role === 'trainer' ? '#e95e63' : roleColor, 0, .58, 0);
  cube(g, .33, .27, .3, skin, 0, .98, 0);
  cube(g, .1, .06, .025, hair, -.08, 1.0, .17, false);
  cube(g, .1, .06, .025, hair, .08, 1.0, .17, false);
  cube(g, .12, .05, .024, '#cb8a73', 0, .89, .17, false);
  for (const x of [-.27, .27]) {
    cube(g, .13, .31, .24, role === 'scientist' ? '#e7f0ec' : role === 'rocket' ? '#222832' : roleColor, x, .61, 0);
    cube(g, .13, .09, .2, skin, x, .41, .02);
  }
  if (role === 'trainer') {
    cube(g, .39, .11, .37, '#ed545b', 0, 1.16, -.02);
    cube(g, .42, .055, .19, '#fff6ea', 0, 1.12, .22);
    cube(g, .13, .035, .055, '#fff6ea', 0, 1.22, .17, false);
    cube(g, .37, .41, .19, '#394e68', 0, .62, -.25);
    cube(g, .3, .1, .04, '#fff7e7', 0, .66, .18, false);
    cube(g, .17, .08, .06, '#fff7e7', 0, .58, .19, false);
    cube(g, .12, .1, .11, '#f8f6e8', .32, .42, .15);
    cube(g, .12, .05, .12, '#dc5157', .32, .47, .15);
  } else if (role === 'fisher') {
    cube(g, .58, .07, .53, '#e7bf69', 0, 1.18, 0);
    cube(g, .4, .14, .4, '#dfb15c', 0, 1.29, 0);
    cube(g, .42, .045, .42, '#739cbe', 0, 1.25, 0);
    cube(g, .29, .13, .035, '#d9ecf1', 0, .63, .18, false);
    cube(g, .04, 1.14, .04, '#765a39', .43, .98, 0);
    cube(g, .34, .035, .035, '#765a39', .57, 1.54, 0);
    cube(g, .025, .38, .025, '#d9e9df', .73, 1.34, 0, false);
    cube(g, .1, .11, .1, '#f4e7cc', .73, 1.1, 0);
  } else if (role === 'scientist') {
    cube(g, .39, .1, .36, '#7f6da4', 0, 1.16, -.03);
    cube(g, .31, .05, .08, '#35485a', 0, 1.08, .15, false);
    cube(g, .48, .44, .12, '#f4f7f1', 0, .55, -.14);
    cube(g, .05, .34, .04, '#a0c9ca', 0, .61, .18, false);
    cube(g, .09, .08, .04, '#74b2c8', -.12, 1.02, .17, false);
    cube(g, .09, .08, .04, '#74b2c8', .12, 1.02, .17, false);
    cube(g, .14, .11, .12, '#80c5d5', -.34, .42, .14);
    cube(g, .05, .06, .05, '#d4f4e6', -.34, .51, .14);
  } else if (role === 'rocket') {
    cube(g, .4, .1, .37, '#22252d', 0, 1.16, 0);
    cube(g, .4, .07, .13, '#22252d', 0, 1.08, .17);
    cube(g, .18, .14, .35, '#232730', -.16, 1.0, -.07);
    cube(g, .18, .14, .35, '#232730', .16, 1.0, -.07);
    cube(g, .21, .05, .035, '#d84250', 0, .77, .18, false);
    cube(g, .055, .18, .035, '#d84250', -.06, .69, .18, false);
    cube(g, .18, .045, .035, '#d84250', 0, .62, .18, false);
    cube(g, .43, .06, .35, '#242b34', 0, .43, 0);
    cube(g, .13, .07, .04, '#cfb966', 0, .44, .19, false);
  } else if (role === 'breeder') {
    cube(g, .45, .12, .4, '#f8ebbd', 0, 1.17, 0);
    cube(g, .25, .18, .3, '#7daf64', 0, 1.28, -.03);
    cube(g, .08, .18, .06, '#3b946b', 0, 1.47, 0);
    cube(g, .18, .09, .09, '#58b885', -.09, 1.49, 0);
    cube(g, .18, .09, .09, '#58b885', .09, 1.49, 0);
    cube(g, .28, .27, .035, '#fff2d8', 0, .56, .18, false);
    cube(g, .17, .055, .04, '#e3b981', 0, .66, .2, false);
    cube(g, .2, .21, .16, '#b48053', .3, .47, .14);
    cube(g, .16, .05, .17, '#e0b06e', .3, .59, .14);
  } else if (role === 'ranger') {
    cube(g, .49, .08, .43, '#3c5c44', 0, 1.17, .02);
    cube(g, .31, .16, .31, '#496c4e', 0, 1.27, -.03);
    cube(g, .42, .1, .13, '#213b31', 0, 1.12, .22);
    cube(g, .45, .35, .13, '#3b6045', 0, .66, -.23);
    cube(g, .32, .07, .04, '#d6bb75', 0, .72, .18, false);
    cube(g, .15, .11, .07, '#303f35', -.11, .91, .18);
    cube(g, .15, .11, .07, '#303f35', .11, .91, .18);
    cube(g, .05, .2, .04, '#d2d5b4', .4, .55, .06);
  } else if (role === 'merchant') {
    cube(g, .45, .1, .38, '#44384b', 0, 1.17, 0);
    cube(g, .3, .27, .3, '#4d3f52', 0, 1.32, -.03);
    cube(g, .28, .05, .31, '#edc96d', 0, 1.35, -.03);
    cube(g, .22, .2, .04, '#fff1cf', 0, .67, .18, false);
    cube(g, .12, .17, .045, '#a55d4e', 0, .65, .21, false);
    cube(g, .09, .09, .05, '#f8d05d', 0, .61, .24, false);
    cube(g, .26, .28, .2, '#9b674f', .38, .43, .04);
    cube(g, .18, .055, .14, '#e0b65e', .38, .57, .04);
  } else if (role === 'courier') {
    cube(g, .45, .12, .4, '#f0a94e', 0, 1.19, 0);
    cube(g, .39, .16, .36, '#e17b42', 0, 1.28, -.02);
    cube(g, .37, .055, .12, '#f6e1a3', 0, 1.13, .2);
    cube(g, .06, .31, .045, '#ffe9b9', -.12, .6, .2, false);
    cube(g, .06, .31, .045, '#ffe9b9', .12, .6, .2, false);
    cube(g, .4, .42, .22, '#6d7580', 0, .67, -.26);
    cube(g, .34, .12, .05, '#e2aa5b', 0, .72, -.39, false);
    cube(g, .25, .2, .09, '#e2c58c', .4, .51, .1);
  } else if (role === 'collector') {
    cube(g, .48, .09, .43, '#66569a', 0, 1.18, 0);
    cube(g, .32, .2, .31, '#8871af', 0, 1.3, -.03);
    cube(g, .1, .035, .08, '#f4e1ab', 0, 1.34, .16, false);
    cube(g, .36, .3, .18, '#6f5394', 0, .62, -.27);
    cube(g, .28, .08, .04, '#f6d985', 0, .68, .18, false);
    cube(g, .16, .16, .04, '#d6e9e8', .33, .59, .17, false);
    cube(g, .06, .2, .055, '#724f35', .33, .45, .17);
    cube(g, .09, .09, .045, '#a8c2ca', .33, .59, .2, false);
  } else if (role === 'battler') {
    cube(g, .38, .08, .37, '#30384b', 0, 1.18, 0);
    cube(g, .4, .08, .06, '#d94f5a', 0, 1.14, .17, false);
    cube(g, .09, .16, .05, '#d94f5a', .15, 1.03, -.17);
    cube(g, .37, .08, .06, '#fff0d9', 0, .71, .18, false);
    cube(g, .37, .08, .06, '#fff0d9', 0, .56, .18, false);
    cube(g, .18, .16, .18, '#d94958', -.29, .45, .03);
    cube(g, .18, .16, .18, '#d94958', .29, .45, .03);
    cube(g, .12, .13, .06, '#fff0d9', 0, .47, .2, false);
  }
  g.scale.setScalar(1.17);
  g.userData.role = role;
  return g;
}
function creature(scene, x, z, color, shape = 'mouse') {
  const g = new THREE.Group(); g.position.set(x, .02, z); scene.add(g);
  cube(g, .42, .36, .48, color, 0, .23, 0);
  cube(g, .33, .3, .33, color, 0, .52, .07);
  cube(g, .07, .07, .025, '#2c3039', -.11, .56, .25, false);
  cube(g, .07, .07, .025, '#2c3039', .11, .56, .25, false);
  if (shape === 'mouse' || shape === 'fox') {
    cube(g, .14, .36, .14, color, -.2, .84, 0);
    cube(g, .14, .36, .14, color, .2, .84, 0);
  } else if (shape === 'bird') {
    cube(g, .2, .2, .36, color, -.3, .44, -.1);
    cube(g, .2, .2, .36, color, .3, .44, -.1);
  } else if (shape === 'plant') {
    cube(g, .38, .25, .3, '#3f9b59', 0, .77, -.08);
  } else if (shape === 'dragon') {
    cube(g, .14, .29, .3, color, 0, .52, -.38);
  }
  return g;
}

function flower(scene, x, z, color) {
  const g = new THREE.Group(); g.position.set(x, .08, z); scene.add(g);
  cube(g, .035, .18, .035, '#428f44', 0, .1, 0, false);
  for (const [dx, dz] of [[-.07,0],[.07,0],[0,-.07],[0,.07]]) cube(g, .1, .035, .1, color, dx, .21, dz, false);
  cube(g, .055, .04, .055, '#f9d96e', 0, .24, 0, false);
}

function water(scene, x, z, w, d) {
  cube(scene, w + .22, .08, d + .22, '#f7e0a2', x, -.045, z, false);
  const surface = cube(scene, w, .055, d, '#55c7df', x, -.004, z, false);
  const glints = [];
  for (let i = 0; i < 4; i++) {
    const glint = cube(scene, w > d ? .33 : .055, .009, w > d ? .055 : .33, '#c8f7ef', x + (w > d ? (i - 1.5) * .7 : 0), .03, z + (w > d ? 0 : (i - 1.5) * .7), false);
    glints.push(glint);
  }
  return { surface, glints };
}

export function createBoard(mount) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#8bc3cf');
  scene.fog = new THREE.Fog('#8bc3cf', 25, 60);
  const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, .1, 100);
  camera.position.set(17, 21, 19); camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .82;
  mount.appendChild(renderer.domElement);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true; orbit.enablePan = false;
  orbit.minPolarAngle = Math.PI / 5; orbit.maxPolarAngle = Math.PI / 2.35;
  orbit.minZoom = .68; orbit.maxZoom = 2.4;
  scene.add(new THREE.HemisphereLight(0xf5f9ff, 0x58745e, .9));
  const sun = new THREE.DirectionalLight(0xffefd2, 1.45); sun.position.set(-9, 15, 10);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
  scene.add(sun);

  // Terrain continues beyond the playable board, like the clipped landscape in the reference.
  cube(scene, 26, .54, 26, '#8b673d', 0, -1.53, 0, false);
  cube(scene, 25.8, .12, 25.8, '#71b94c', 0, -1.19, 0, false);
  for (const [x,z,w,d] of [[9.4,-1.3,1.35,12.8],[-8.9,2.8,1.35,7.6],[2.5,9.15,8.1,1.25]]) {
    cube(scene, w + .26, .08, d + .26, '#d5d39a', x, -1.08, z, false);
    cube(scene, w, .05, d, '#48bddd', x, -1.02, z, false);
  }
  for (let i = 0; i < 65; i++) {
    const x = Math.sin(i * 22.71) * 11.3, z = Math.cos(i * 16.83) * 11.3;
    if (Math.abs(x) > 7.9 || Math.abs(z) > 7.9) cube(scene, .13, .1, .13, i % 5 ? '#479f49' : '#e9e5aa', x, -.98, z, false);
  }
  cube(scene, 14.4, .68, 14.4, '#6a543b', 0, -.5, 0);
  cube(scene, 14.6, .12, 14.6, '#b48b51', 0, -.84, 0);
  cube(scene, 14.3, .2, 14.3, '#4ca34d', 0, -.06, 0);
  cube(scene, 14.1, .025, 14.1, '#83d652', 0, .055, 0, false);
  const streams = [water(scene, -3.3, -6.9, 3.2, .35), water(scene, 3.35, 6.9, 3.1, .35)];
  for (let i = 0; i < 10; i++) {
    const x = -6.85 + i * 1.52;
    cube(scene, .55, .18, .22, i % 2 ? '#896b45' : '#a47b4b', x, -.31, -7.2, false);
    cube(scene, .55, .18, .22, i % 2 ? '#896b45' : '#a47b4b', x, -.31, 7.2, false);
  }
  // Keep the middle clear so draw effects can appear without permanent card stacks.
  const center = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: pixelGroundTexture(), toneMapped: false }));
  center.rotation.x = -Math.PI / 2; center.position.y = .09; center.receiveShadow = true; scene.add(center);
  const emblem = new THREE.Group(); emblem.position.y = .13; scene.add(emblem);
  const outer = new THREE.Mesh(new THREE.RingGeometry(.48, .66, 24), mat('#f8f6dc')); outer.rotation.x = -Math.PI / 2; emblem.add(outer);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(.23, 24), mat('#f8f6dc')); inner.rotation.x = -Math.PI / 2; inner.position.y = .005; emblem.add(inner);
  cube(emblem, 1.23, .012, .075, '#f8f6dc', 0, .01, 0, false);

  const battleBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: '#191b1c' }));
  battleBackdrop.rotation.x = -Math.PI / 2; battleBackdrop.position.y = -.86; battleBackdrop.visible = false; scene.add(battleBackdrop);
  const arena = new THREE.Group(); arena.visible = false; scene.add(arena);
  const arenaFloor = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 9.4), new THREE.MeshBasicMaterial({ map: battleFloorTexture(), side: THREE.DoubleSide, toneMapped: false }));
  arenaFloor.rotation.x = -Math.PI / 2; arenaFloor.position.y = .33; arena.add(arenaFloor);
  for (const [x, z, color] of [[-2.2, 1.6, '#558abd'], [2.2, -1.6, '#bd6264']]) {
    cube(arena, 2.9, .16, 2.3, '#414446', x, .40, z);
    cube(arena, 2.7, .035, 2.1, color, x, .50, z, false);
    cube(arena, 2.3, .01, 1.7, '#e9e6d8', x, .525, z, false);
  }
  const battleArt = [0, 1].map((_, index) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, alphaTest: .04 }));
    sprite.position.set(index ? 2.2 : -2.2, 1.55, index ? -1.6 : 1.6);
    sprite.scale.set(2.55, 2.55, 1); sprite.visible = false; arena.add(sprite);
    return sprite;
  });
  const artLoader = new THREE.TextureLoader();
  const artCache = new Map();
  function updateBattleArt(sprite, mon) {
    sprite.visible = Boolean(mon?.species && POKEDEX[mon.species]);
    if (!sprite.visible || sprite.userData.species === mon.species) return;
    sprite.userData.species = mon.species;
    let texture = artCache.get(mon.species);
    if (!texture) {
      texture = artLoader.load(`/pokemon-art/${POKEDEX[mon.species]}.png`);
      texture.colorSpace = THREE.SRGBColorSpace;
      artCache.set(mon.species, texture);
    }
    sprite.material.map = texture; sprite.material.needsUpdate = true;
  }

  TILES.forEach((tile, i) => {
    const [x, z] = POSITIONS[i];
    cube(scene, 1.1, .17, 1.1, '#4c5e53', x, .13, z);
    cube(scene, 1.04, .065, 1.04, '#e1e7df', x, .25, z);
    const accent = { legendary: '#c89024', villain: '#40484d', gym: '#555f5d', cave: '#647e97', quest: '#d44557', event: '#d79c3e' }[tile.type] || { green: '#268a4d', blue: '#308fc1', purple: '#8255bc', red: '#ce4d5c' }[tile.zone];
    const side = i === 0 ? 0 : Math.floor((i - 1) / 10);
    const stripZ = side === 0 ? .45 : side === 2 ? -.45 : 0;
    const stripX = side === 1 ? -.45 : side === 3 ? .45 : 0;
    cube(scene, side % 2 ? .17 : 1.04, .013, side % 2 ? 1.04 : .17, accent, x + stripX, .29, z + stripZ, false);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.02), tileTexture(tile, i));
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, .297, z); scene.add(plane);
  });

  for (const [x, z, roof, icon] of [[-6.8, -2.8, '#ef6ba8','✚'],[6.8,-2.6,'#f4c72c','◉'],[6.8,3.2,'#ef6ba8','✚'],[-6.8,3.5,'#f4c72c','◉']]) building(scene, x, z, roof, icon, .94);
  for (const [x,z,roof,symbol,scale] of [[-9.3,-3.8,'#cf874b','◉',1.25],[9.4,4.7,'#ef6ba8','✚',1.22],[-2.8,-9.0,'#f4c72c','◉',1.08],[2.8,9.1,'#ef6ba8','✚',1.2]]) {
    const house = building(scene, x, z, roof, symbol, scale); house.position.y = -.82;
  }
  for (const [x,z,along] of [[-8.3,-2.7,false],[-8.1,3.3,false],[8.1,-4.4,false],[8.0,2.2,false],[-3.7,-8.15,true],[3.8,8.05,true]]) {
    const rail = fence(scene,x,z,along,6); rail.position.y = -.82;
  }
  for (const [x,z,size] of [[-7,-6,.95],[-7,6,1.06],[7,-6,1.1],[7,6,.95],[-3,7.35,.8],[3,-7.35,.86]]) tree(scene,x,z, size > 1 ? '#2b9d58' : '#49a767', size);
  for (const [x,z,size] of [[-10,-6,1.6],[-10,6,1.35],[10,-6,1.5],[10,7,1.6],[-5,9,1.4],[6,-9,1.5]]) {
    const forestTree = tree(scene,x,z,'#389a44',size); forestTree.position.y = -.82;
  }
  for (let i = 0; i < 32; i++) {
    const x = Math.sin(i * 13.53) * 4.4, z = Math.cos(i * 19.11) * 4.4;
    if (Math.abs(x) > 3.6 || Math.abs(z) > 3.6) bush(scene, x, z);
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.sin(i * 17.31) * 6.7, z = Math.cos(i * 11.93) * 6.7;
    if (Math.abs(x) < 6.15 && Math.abs(z) < 6.15 && (Math.abs(x) < 4.85 || Math.abs(z) < 4.85)) flower(scene, x, z, i % 3 ? '#fff2d0' : '#f4acc4');
  }
  const creatures = [
    creature(scene, -6.9, 1.1, '#edc54d', 'mouse'),
    creature(scene, 6.8, 1.0, '#aa80c7', 'mouse'),
    creature(scene, -3.7, 6.8, '#ed985d', 'dragon'),
  ];

  // A physical die sits on the playfield while the authoritative roll is pending.
  function dieFace(number) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffdf1'; ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#d0d9d2'; ctx.lineWidth = 5; ctx.strokeRect(4, 4, 120, 120);
    const pips = {
      1: [[64, 64]], 2: [[35, 35], [93, 93]],
      3: [[35, 35], [64, 64], [93, 93]],
      4: [[35, 35], [93, 35], [35, 93], [93, 93]],
      5: [[35, 35], [93, 35], [64, 64], [35, 93], [93, 93]],
      6: [[35, 32], [93, 32], [35, 64], [93, 64], [35, 96], [93, 96]],
    };
    ctx.fillStyle = number === 1 ? '#df5266' : '#2a4150';
    for (const [x, y] of pips[number]) { ctx.beginPath(); ctx.arc(x, y, number === 1 ? 15 : 11, 0, Math.PI * 2); ctx.fill(); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter; return new THREE.MeshStandardMaterial({ map: texture, roughness: .46 });
  }
  const dieFaces = [3, 4, 1, 6, 2, 5].map(dieFace);
  const die = new THREE.Group(); die.visible = false; scene.add(die);
  const dieBody = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.24, 1.24), dieFaces);
  dieBody.castShadow = true; dieBody.receiveShadow = true; die.add(dieBody);
  die.add(new THREE.LineSegments(new THREE.EdgesGeometry(dieBody.geometry), new THREE.LineBasicMaterial({ color: '#6b817f', transparent: true, opacity: .65 })));
  const dieShadow = new THREE.Mesh(new THREE.CircleGeometry(.95, 32), new THREE.MeshBasicMaterial({ color: '#173b3a', transparent: true, opacity: .25, depthWrite: false }));
  dieShadow.rotation.x = -Math.PI / 2; dieShadow.position.set(0, .35, 0); dieShadow.visible = false; scene.add(dieShadow);
  const topNormals = { 1: [0, 1, 0], 2: [0, 0, 1], 3: [1, 0, 0], 4: [-1, 0, 0], 5: [0, 0, -1], 6: [0, -1, 0] };
  let dieMotion = null;
  function startDie() {
    die.visible = dieShadow.visible = motionAllowed;
    die.position.set(-2.5, 3.8, -1.2); die.rotation.set(.3, .4, .2);
    dieMotion = { stage: 'rolling', started: performance.now() };
  }
  function landDie(value) {
    if (!dieMotion || !topNormals[value]) return;
    const normal = new THREE.Vector3(...topNormals[value]);
    if (!motionAllowed) {
      die.visible = dieShadow.visible = true;
      die.position.set(0, .99, 0);
      die.quaternion.setFromUnitVectors(normal, new THREE.Vector3(0, 1, 0));
      dieMotion = null;
      return;
    }
    dieMotion = { stage: 'landing', started: performance.now(), from: die.quaternion.clone(), to: new THREE.Quaternion().setFromUnitVectors(normal, new THREE.Vector3(0, 1, 0)), x: die.position.x, z: die.position.z, y: die.position.y };
  }
  function clearDie() { die.visible = dieShadow.visible = false; dieMotion = null; }

  const avatarMap = new Map();
  const highlight = new THREE.Mesh(new THREE.RingGeometry(.58, .67, 32), new THREE.MeshBasicMaterial({ color: '#ffe07b', side: THREE.DoubleSide }));
  highlight.rotation.x = -Math.PI / 2; highlight.position.y = .315; scene.add(highlight);
  const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let previousFrame = performance.now(), elapsed = 0;
  const bursts = [];
  let previousLog = '';
  function burst(position, color, count = 14) {
    if (!motionAllowed) return;
    const [x, z] = POSITIONS[position] || POSITIONS[0];
    for (let i = 0; i < count; i++) {
      const angle = i * Math.PI * 2 / count;
      const mesh = cube(scene, .09, .09, .09, color, x, .7, z, false);
      bursts.push({ mesh, vx: Math.cos(angle) * (1.1 + i % 3 * .2), vz: Math.sin(angle) * (1.1 + i % 3 * .2), vy: 2.5 + i % 4 * .2, life: .65 });
    }
  }
  function waypoint(index, offset) {
    const [x, z] = POSITIONS[index];
    return new THREE.Vector3(x + offset[0], .31, z + offset[1]);
  }
  function sync(state) {
    if (!state?.players) return;
    const battle = state.phase === 'playing' && state.battle && ['battle_pick', 'battle_roll'].includes(state.step) ? state.battle : null;
    arena.visible = Boolean(battle); battleBackdrop.visible = Boolean(battle); emblem.visible = !battle;
    scene.background.set(battle ? '#191b1c' : '#8bc3cf');
    scene.fog.color.set(battle ? '#191b1c' : '#8bc3cf');
    if (battle) battle.sides.forEach((side, index) => {
      const mon = side === 'wild' ? battle.picks.wild : state.players.find(p => p.id === side)?.pokemon.find(entry => entry.uid === battle.picks[side]);
      updateBattleArt(battleArt[index], mon);
      if (mon) {
        if (battleArt[index].userData.species === mon.species && battleArt[index].userData.lastHp > mon.hp) battleArt[index].userData.hitUntil = performance.now() + 450;
        battleArt[index].userData.lastHp = mon.hp;
      }
    });
    const live = new Set();
    state.players.forEach((p, index) => {
      live.add(p.id);
      let avatar = avatarMap.get(p.id);
      if (avatar && avatar.userData.role !== p.role) {
        scene.remove(avatar); avatar.traverse(child => child.geometry?.dispose()); avatarMap.delete(p.id); avatar = null;
      }
      if (!avatar) {
        avatar = voxelAvatar(p.role); scene.add(avatar); avatarMap.set(p.id, avatar);
        avatar.userData.position = p.position || 0;
        avatar.userData.route = [];
        avatar.userData.elapsed = 0;
      }
      const offset = [[-.23,-.23],[.23,-.23],[-.23,.23],[.23,.23]][index % 4];
      const target = p.position || 0;
      if (!avatar.userData.initialized) { avatar.position.copy(waypoint(target, offset)); avatar.userData.initialized = true; }
      if (target !== avatar.userData.position) {
        const from = avatar.userData.position;
        const steps = (target - from + POSITIONS.length) % POSITIONS.length;
        avatar.userData.route = motionAllowed && steps <= 6
          ? Array.from({ length: steps }, (_, n) => waypoint((from + n + 1) % POSITIONS.length, offset))
          : [waypoint(target, offset)];
        avatar.userData.position = target;
        avatar.userData.elapsed = 0;
      }
      avatar.visible = !p.done;
    });
    for (const [id, avatar] of avatarMap) if (!live.has(id)) { scene.remove(avatar); avatarMap.delete(id); }
    const active = state.players[state.turn];
    if (state.phase === 'playing' && active) {
      const [x, z] = POSITIONS[active.position]; highlight.position.x = x; highlight.position.z = z; highlight.visible = true;
    } else highlight.visible = false;
    if (state.phase === 'playing' && state.log?.[0] && previousLog && state.log[0] !== previousLog) {
      const line = state.log[0];
      if (/จับ.*สำเร็จ/.test(line)) burst(state.players.find(p => p.id === state.lastCatch?.playerId)?.position ?? active?.position ?? 0, '#fbd263', 18);
      else if (/โจมตี/.test(line)) burst(active?.position ?? 0, '#f4746e', 10);
      else if (/ชนะ/.test(line)) burst(active?.position ?? 0, '#f48675', 18);
      else if (/ขาย/.test(line) || /ได้การ์ด/.test(line)) burst(active?.position ?? 0, '#7de3ad', 12);
      else if (/ถึงเมือง/.test(line)) burst(active?.position ?? 0, '#62e0bf', 12);
    }
    previousLog = state.log?.[0] || '';
  }
  function resize() {
    const w = Math.max(1,mount.clientWidth), h = Math.max(1,mount.clientHeight);
    renderer.setSize(w,h,false);
    const span = 8.35, aspect = w/h;
    camera.left = -span * aspect; camera.right = span * aspect; camera.top = span; camera.bottom = -span;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(mount); resize();
  let active = true;
  function frame() {
    if (!active) return;
    requestAnimationFrame(frame);
    const now = performance.now(), dt = Math.min((now - previousFrame) / 1000, .05);
    previousFrame = now; elapsed += dt;
    const time = elapsed;
    if (dieMotion) {
      const t = Math.max(0, (now - dieMotion.started) / 1000);
      if (dieMotion.stage === 'rolling') {
        const travel = Math.min(t / .9, 1), eased = 1 - (1 - travel) ** 3;
        die.position.set(-2.5 * (1 - eased), .98 + 2.85 * (1 - travel) ** 2 + Math.abs(Math.sin(t * 16)) * .42 * (1 - travel), -1.2 * (1 - eased));
        die.rotation.set(.3 + t * 15, .4 + t * 11, .2 + t * 13);
      } else {
        const settle = Math.min(t / .58, 1), eased = 1 - (1 - settle) ** 3;
        die.position.set(dieMotion.x * (1 - eased), .99 + Math.abs(Math.sin(settle * Math.PI * 2)) * .23 * (1 - settle), dieMotion.z * (1 - eased));
        die.quaternion.slerpQuaternions(dieMotion.from, dieMotion.to, eased);
      }
      dieShadow.position.x = die.position.x; dieShadow.position.z = die.position.z;
      dieShadow.material.opacity = .3 / (1 + Math.max(0, die.position.y - 1) * .6);
      const shadowScale = 1 + Math.max(0, die.position.y - 1) * .2;
      dieShadow.scale.set(shadowScale, shadowScale, shadowScale);
    }
    for (const avatar of avatarMap.values()) {
      const route = avatar.userData.route;
      if (route?.length) {
        const goal = route[0];
        const delta = goal.clone().sub(avatar.position);
        const distance = Math.hypot(delta.x, delta.z);
        const speed = motionAllowed ? 5.8 : 100;
        if (distance < speed * dt) { avatar.position.copy(goal); route.shift(); }
        else { avatar.position.addScaledVector(delta, speed * dt / distance); avatar.position.y = .31 + Math.sin(time * 23) * .08; avatar.rotation.y = Math.atan2(delta.x, delta.z); }
      } else avatar.position.y += (.31 + (motionAllowed ? Math.sin(time * 2.4 + avatar.id) * .025 : 0) - avatar.position.y) * .12;
    }
    if (motionAllowed) {
      if (arena.visible) battleArt.forEach((sprite, i) => {
        sprite.position.y = 1.55 + Math.sin(time * 2.6 + i * 1.8) * .09;
        sprite.material.color.set(sprite.userData.hitUntil > now ? '#ff7777' : '#ffffff');
      });
      highlight.scale.setScalar(1 + Math.sin(time * 4) * .08);
      highlight.material.opacity = .76 + Math.sin(time * 4) * .18;
      highlight.material.transparent = true;
      creatures.forEach((g, i) => { g.position.y = .02 + Math.sin(time * (1.7 + i * .2) + i) * .055; g.rotation.y = Math.sin(time * .7 + i) * .12; });
      streams.forEach(({ glints }, i) => glints.forEach((glint, j) => { glint.position.x += (i ? 1 : -1) * dt * .12; if (Math.abs(glint.position.x - (i ? 3.35 : -3.3)) > 1.45) glint.position.x = (i ? 3.35 : -3.3) + (i ? -1 : 1) * 1.45; }));
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]; b.life -= dt; b.vy -= dt * 6;
        b.mesh.position.x += b.vx * dt; b.mesh.position.z += b.vz * dt; b.mesh.position.y += b.vy * dt;
        b.mesh.scale.setScalar(Math.max(.01, b.life / .65));
        if (b.life <= 0) { scene.remove(b.mesh); b.mesh.geometry.dispose(); bursts.splice(i, 1); }
      }
    }
    orbit.update(); renderer.render(scene,camera);
  }
  frame();
  return { sync, startDie, landDie, clearDie, isMoving(id) { return Boolean(avatarMap.get(id)?.userData.route?.length); }, setInteractive(enabled) { orbit.enabled = enabled; }, dispose() { active=false; observer.disconnect(); orbit.dispose(); renderer.dispose(); mount.removeChild(renderer.domElement); } };
}
