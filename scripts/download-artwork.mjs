import { mkdir, writeFile } from 'node:fs/promises';
import { POKEDEX } from '../src/game/artwork.js';

const ids = [...new Set(Object.values(POKEDEX))];
const output = new URL('../public/pokemon-art/', import.meta.url);
await mkdir(output, { recursive: true });
for (const id of ids) {
  const source = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  const response = await fetch(source);
  if (!response.ok || !response.headers.get('content-type')?.includes('image/png')) throw new Error(`Artwork ${id}: ${response.status}`);
  await writeFile(new URL(`${id}.png`, output), Buffer.from(await response.arrayBuffer()));
  process.stdout.write(`${id} `);
}
console.log(`\nSaved ${ids.length} Pokémon illustrations from PokeAPI sprites.`);
