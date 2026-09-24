"""Refresh the static Gen I roster and official artwork from PokéAPI's public data."""

import csv
import io
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_ROOT = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/"
ART_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"
EXISTING = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19, 20, 25, 26, 29, 30, 31, 43, 44, 45, 113, 115, 123, 128, 129, 130, 131, 132, 142, 143, 144, 145, 146, 147, 148, 149, 150}
RARE = {83, 95, 106, 107, 108, 113, 114, 115, 122, 123, 124, 125, 126, 127, 128, 131, 132, 137, 138, 139, 140, 141, 142, 143}
COLORS = {1: '#46505b', 2: '#6eadd2', 3: '#a78b6d', 4: '#9aa5a7', 5: '#75ae78', 6: '#dea2bc', 7: '#a48ec0', 8: '#d88179', 9: '#d7d8d0', 10: '#dfbf63'}
SHAPES = {1: 'blob', 2: 'fish', 3: 'fish', 4: 'lizard', 5: 'blob', 6: 'bear', 7: 'bear', 8: 'bear', 9: 'bird', 10: 'bug', 11: 'bear', 12: 'ghost', 13: 'dragon', 14: 'mouse'}
ABILITIES = [('heal', 'หลังชนะฟื้น 1 HP'), ('power', 'โจมตีครั้งแรก +1'), ('dodge', 'ลดความเสียหายครั้งแรก 1'), ('sale', 'ขายได้เพิ่ม 1 เหรียญ')]


def fetch_csv(filename):
    with urllib.request.urlopen(CSV_ROOT + filename, timeout=30) as response:
        return list(csv.DictReader(io.StringIO(response.read().decode('utf-8'))))


species = {int(row['id']): row for row in fetch_csv('pokemon_species.csv') if int(row['id']) <= 151}
names = {(int(row['pokemon_species_id']), int(row['local_language_id'])): row['name'] for row in fetch_csv('pokemon_species_names.csv') if int(row['pokemon_species_id']) <= 151}
stats = {(int(row['pokemon_id']), int(row['stat_id'])): int(row['base_stat']) for row in fetch_csv('pokemon_stats.csv') if int(row['pokemon_id']) <= 151}
children = {number: [] for number in species}
for number, row in species.items():
    parent = int(row['evolves_from_species_id'] or 0)
    if parent in children:
        children[parent].append(number)


def depth(number):
    parent = int(species[number]['evolves_from_species_id'] or 0)
    return 0 if parent not in species else depth(parent) + 1


def identifier(number):
    return 'nidoran' if number == 29 else species[number]['identifier']


def zone(number):
    row = species[number]
    if row['is_legendary'] == '1' or row['is_mythical'] == '1':
        return 'legendary'
    if number in RARE or (depth(number) == 0 and not children[number]):
        return 'red'
    return ('green', 'blue', 'purple')[min(depth(number), 2)]


def clamp(value, low, high):
    return max(low, min(high, value))


extra = []
for number, row in species.items():
    if number in EXISTING:
        continue
    key = identifier(number)
    name = names.get((number, 9), key.title())
    band = zone(number)
    hp_base = stats.get((number, 1), 50)
    attack_base = stats.get((number, 2), 50)
    if band == 'green':
        hp, power, price = clamp(round(hp_base / 18 + 2), 4, 8), clamp(round(attack_base / 35 + 1), 1, 3), clamp(round((hp_base + attack_base) / 35), 2, 6)
    elif band == 'blue':
        hp, power, price = clamp(round(hp_base / 16 + 4), 7, 11), clamp(round(attack_base / 35 + 1), 2, 5), clamp(round((hp_base + attack_base) / 21), 7, 12)
    elif band == 'purple':
        hp, power, price = clamp(round(hp_base / 15 + 6), 10, 15), clamp(round(attack_base / 29 + 2), 4, 7), clamp(round((hp_base + attack_base) / 12), 13, 20)
    elif band == 'red':
        hp, power, price = clamp(round(hp_base / 15 + 7), 10, 18), clamp(round(attack_base / 27 + 2), 4, 7), clamp(round((hp_base + attack_base) / 10), 17, 23)
    else:
        hp, power, price = clamp(round(hp_base / 16 + 9), 12, 18), clamp(round(attack_base / 25 + 2), 6, 8), 25
    ability, ability_text = ABILITIES[number % len(ABILITIES)]
    args = [name, band, hp, power, price, COLORS.get(int(row['color_id']), '#9fa8a0'), SHAPES.get(int(row['shape_id']), 'bear'), ability, ability_text]
    extra.append(f"  {json.dumps(key)}: p({', '.join(json.dumps(value, ensure_ascii=False) for value in args)}),")

evolutions = []
for parent, offspring in children.items():
    for child in offspring[:1]:
        if parent not in EXISTING or child not in EXISTING:
            evolutions.append(f"  {json.dumps(identifier(parent))}: {json.dumps(identifier(child))},")

file = ROOT / 'src/game/gen1-extra.js'
file.write_text("// Generated from PokéAPI Gen I species, English names and base stats.\n"
                "// Existing hand-tuned Pokémon in data.js take precedence.\n"
                "const p = (name, zone, hp, power, price, color, shape, ability, abilityText) => ({ name, zone, hp, power, price, color, shape, ability, abilityText });\n"
                "export const EXTRA_POKEMON = {\n" + "\n".join(extra) + "\n};\n"
                "export const EXTRA_EVOLUTIONS = {\n" + "\n".join(evolutions) + "\n};\n"
                "export const EXTRA_POKEDEX = {\n" + "\n".join(f"  {json.dumps(species[number]['identifier'])}: {number}," for number in species if number not in EXISTING) + "\n};\n", encoding='utf-8')

art_dir = ROOT / 'public/pokemon-art'
art_dir.mkdir(exist_ok=True)


def fetch_art(number):
    target = art_dir / f'{number}.png'
    if target.exists():
        return
    with urllib.request.urlopen(ART_ROOT + f'{number}.png', timeout=30) as response:
        content = response.read()
    if not content.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError(f'Bad artwork for #{number}')
    target.write_bytes(content)


with ThreadPoolExecutor(max_workers=12) as workers:
    for future in as_completed([workers.submit(fetch_art, number) for number in species]):
        future.result()

print(f'Generated {len(extra)} new Pokémon and {len(evolutions)} evolution links; {len(list(art_dir.glob("*.png")))} artwork files')
