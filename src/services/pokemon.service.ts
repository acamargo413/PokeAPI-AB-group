interface PokemonApiResponse {
  id: number;
  name: string;
  sprites: { front_default: string | null };
  types: { type: { name: string } }[];
  abilities: { ability: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
}

interface EvolutionNode {
  species: { name: string };
  evolves_to: EvolutionNode[];
}

interface RickAndMortyCharacter {
  id: number;
  name: string;
  image: string;
  species: string;
  gender: string;
  status: string;
  origin: { name: string };
  location: { name: string };
  episode: string[];
}

export interface CharacterData {
  id: number;
  name: string;
  image: string | null;
  types: string[];
  abilities: string[];
  stats: Record<string, number>;
  evolution: string[];
}

interface CacheItem { data: CharacterData; expires: number; }

const POKEMON_API = "https://pokeapi.co/api/v2";
const RICK_AND_MORTY_API = "https://rickandmortyapi.com/api/character";
const CACHE_TIME = 5 * 60 * 1000;
const characterCache = new Map<string, CacheItem>();

function extractEvolution(node: EvolutionNode): string[] {
  return [node.species.name, ...node.evolves_to.flatMap(extractEvolution)];
}

async function getPokemon(key: string) {
  const response = await fetch(`${POKEMON_API}/pokemon/${encodeURIComponent(key)}`);
  if (!response.ok) return undefined;

  const pokemon = await response.json() as PokemonApiResponse;
  const speciesResponse = await fetch(`${POKEMON_API}/pokemon-species/${encodeURIComponent(key)}`);
  if (!speciesResponse.ok) throw new Error("Especie no encontrada");

  const species = await speciesResponse.json() as { evolution_chain: { url: string } };
  const evolutionResponse = await fetch(species.evolution_chain.url);
  if (!evolutionResponse.ok) throw new Error("Evolución no encontrada");

  const evolution = await evolutionResponse.json() as { chain: EvolutionNode };
  return {
    id: pokemon.id,
    name: pokemon.name,
    image: pokemon.sprites.front_default,
    types: pokemon.types.map((item) => item.type.name),
    abilities: pokemon.abilities.map((item) => item.ability.name),
    stats: Object.fromEntries(pokemon.stats.map((item) => [item.stat.name, item.base_stat])),
    evolution: extractEvolution(evolution.chain)
  };
}

function normalizeRickAndMorty(character: RickAndMortyCharacter): CharacterData {
  const places = [character.origin.name, character.location.name]
    .filter((name) => name && name !== "unknown")
    .filter((name, index, all) => all.indexOf(name) === index);

  return {
    id: character.id,
    name: character.name,
    image: character.image,
    types: [character.species, character.gender].filter(Boolean),
    abilities: [`Estado: ${character.status}`, `Origen: ${character.origin.name || "Desconocido"}`],
    stats: { episodios: character.episode.length },
    evolution: places
  };
}

async function getRickAndMortyCharacter(key: string) {
  const isId = /^\d+$/.test(key);
  const url = isId
    ? `${RICK_AND_MORTY_API}/${key}`
    : `${RICK_AND_MORTY_API}/?name=${encodeURIComponent(key)}`;
  const response = await fetch(url);
  if (!response.ok) return undefined;

  const data = await response.json() as RickAndMortyCharacter | { results: RickAndMortyCharacter[] };
  const character = "results" in data
    ? data.results.find((item) => item.name.toLowerCase() === key) ?? data.results[0]
    : data;
  return character ? normalizeRickAndMorty(character) : undefined;
}

/** Busca en PokéAPI y, si no lo encuentra, en Rick and Morty API. */
export const getPokemonFromApi = async (id: string) => {
  return getCharacterFromApi(id, "auto");
};

export const getCharacterFromApi = async (
  id: string,
  source: "pokemon" | "rickandmorty" | "auto"
): Promise<CharacterData> => {
  const key = id.trim().toLowerCase();
  const cacheKey = `${source}:${key}`;
  const cached = characterCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  const result = source === "pokemon"
    ? await getPokemon(key)
    : source === "rickandmorty"
      ? await getRickAndMortyCharacter(key)
      : await getPokemon(key) ?? await getRickAndMortyCharacter(key);
  if (!result) throw new Error("Pokemon no encontrado");

  characterCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TIME });
  return result;
};

export const getPokemonsFromApi = async (page: number, limit: number, type?: string) => {
  let url = `${POKEMON_API}/pokemon?limit=100000`;
  if (type) url = `${POKEMON_API}/type/${encodeURIComponent(type)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Error consultando PokeAPI");
  const data = await response.json() as {
    results?: { name: string; url: string }[];
    pokemon?: { pokemon: { name: string; url: string } }[];
  };
  const results = type ? data.pokemon?.map((item) => item.pokemon) ?? [] : data.results ?? [];
  const total = results.length;
  const offset = (page - 1) * limit;

  return {
    data: results.slice(offset, offset + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

export const searchPokemonsFromApi = async (name: string) => ({
  data: await getPokemonFromApi(name)
});
