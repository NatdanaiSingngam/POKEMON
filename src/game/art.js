import { POKEMON } from './data.js';

// Small code-drawn voxel portraits keep the game self-contained and distinguish body types.
const box = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const accent = '#f4e7b8';
function silhouette(shape, color) {
  const parts = [];
  if (['bird', 'dragon'].includes(shape)) {
    parts.push(box(3, 30, 15, 8, color), box(47, 30, 14, 8, color));
  }
  if (['mouse', 'fox', 'dog'].includes(shape)) {
    parts.push(box(14, 5, 10, 16, color), box(40, 5, 10, 16, color));
  }
  if (shape === 'turtle') parts.push(box(9, 29, 46, 23, '#405e7b'), box(16, 22, 32, 23, color));
  else if (shape === 'fish') parts.push(box(3, 25, 19, 21, color), box(44, 19, 15, 14, color), box(44, 40, 15, 12, color));
  else if (shape === 'bug') parts.push(box(15, 5, 5, 19, color), box(44, 5, 5, 19, color), box(8, 37, 48, 13, color));
  else if (shape === 'plant') parts.push(box(11, 8, 19, 17, '#4b9c64'), box(31, 8, 22, 17, '#4b9c64'), box(18, 14, 28, 13, color));
  else if (shape === 'dragon') parts.push(box(46, 43, 15, 10, color), box(50, 38, 10, 8, color));
  else if (shape === 'ghost') parts.push(box(10, 16, 44, 38, color), box(10, 48, 9, 12, color), box(29, 49, 8, 10, color), box(46, 48, 8, 12, color));
  else if (shape === 'bear') parts.push(box(7, 6, 13, 19, color), box(44, 6, 13, 19, color), box(7, 29, 50, 28, color));
  else if (shape === 'blob') parts.push(box(8, 35, 48, 19, color));
  else if (shape === 'legendary') parts.push(box(7, 3, 11, 28, color), box(46, 3, 11, 28, color), box(21, 2, 22, 15, color));
  else if (shape === 'lizard') parts.push(box(45, 44, 17, 10, color), box(53, 36, 8, 10, '#ec9a4b'));
  else if (shape === 'mouse') parts.push(box(47, 45, 15, 7, color));
  parts.push(box(15, 21, 34, 26, color), box(20, 42, 10, 12, color), box(36, 42, 10, 12, color));
  if (shape === 'fish') parts.push(box(12, 21, 40, 26, color));
  parts.push(box(21, 30, 5, 6, '#24343a'), box(40, 30, 5, 6, '#24343a'), box(22, 31, 2, 2, accent), box(41, 31, 2, 2, accent));
  if (shape === 'fish') parts.push(box(31, 40, 8, 3, '#a45c5c'));
  return parts.join('');
}

export function monArt(species) {
  const pokemon = POKEMON[species];
  if (!pokemon) return '';
  return `<svg viewBox="0 0 64 64" role="img" aria-label="${pokemon.name}" shape-rendering="crispEdges"><rect width="64" height="64" rx="8" fill="#fff9e8"/><rect x="4" y="50" width="56" height="6" fill="#c6e0bd"/>${silhouette(pokemon.shape, pokemon.color)}</svg>`;
}
