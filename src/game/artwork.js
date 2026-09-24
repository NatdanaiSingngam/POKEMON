import { monArt } from './art.js';
import { EXTRA_POKEDEX } from './gen1-extra.js';

export const POKEDEX = {
  bulbasaur: 1, charmander: 4, squirtle: 7, magikarp: 129, rattata: 19, raticate: 20,
  pidgey: 16, caterpie: 10, oddish: 43, dratini: 147, nidoran: 29,
  ivysaur: 2, charmeleon: 5, wartortle: 8, metapod: 11, pidgeotto: 17,
  gloom: 44, dragonair: 148, nidorina: 30, pikachu: 25, gyarados: 130,
  venusaur: 3, charizard: 6, blastoise: 9, butterfree: 12, pidgeot: 18,
  vileplume: 45, dragonite: 149, nidoqueen: 31, raichu: 26,
  lapras: 131, snorlax: 143, ditto: 132, chansey: 113, aerodactyl: 142,
  scyther: 123, tauros: 128, kangaskhan: 115,
  mewtwo: 150, articuno: 144, zapdos: 145, moltres: 146,
  ...EXTRA_POKEDEX,
};

export function pokemonPortrait(species, size = '') {
  const id = POKEDEX[species];
  return `<span class="pokemon-portrait ${size}"><span class="pokemon-pixel">${monArt(species)}</span>${id ? `<img class="pokemon-art" src="/pokemon-art/${id}.png" alt="" loading="eager">` : ''}</span>`;
}
