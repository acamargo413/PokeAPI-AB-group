interface PokemonApiResponse {
  id: number;

  name: string;

  sprites: {
    front_default: string | null;
  };

  types: {
    type: {
      name: string;
    };
  }[];

  abilities: {
    ability: {
      name: string;
    };
  }[];

  stats: {
    base_stat: number;

    stat: {
      name: string;
    };
  }[];
}

interface SpeciesResponse {
  evolution_chain: {
    url: string;
  };
}

interface EvolutionNode {
  species: {
    name: string;
  };

  evolves_to:
    EvolutionNode[];
}

interface EvolutionResponse {
  chain:
    EvolutionNode;
}

interface CacheItem {
  data: any;
  expires: number;
}

const CACHE_TIME =
  5 * 60 * 1000;

const pokemonCache =
  new Map<string, CacheItem>();

export const getPokemonFromApi =
  async (
    id: string
  ) => {

    const key =
      id.toLowerCase();

    const cached =
      pokemonCache.get(key);

    if (
      cached &&
      cached.expires > Date.now()
    ) {
      return cached.data;
    }

    const response =
      await fetch(
        `https://pokeapi.co/api/v2/pokemon/${key}`
      );

    if (!response.ok) {
      throw new Error(
        "Pokemon no encontrado"
      );
    }

    const pokemon:
      PokemonApiResponse =
      await response.json();

    const speciesResponse =
      await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${key}`
      );

    if (!speciesResponse.ok) {
      throw new Error(
        "Especie no encontrada"
      );
    }

    const species:
      SpeciesResponse =
      await speciesResponse.json();

    const evolutionResponse =
      await fetch(
        species.evolution_chain.url
      );

    if (!evolutionResponse.ok) {
      throw new Error(
        "Evolución no encontrada"
      );
    }

    const evolution:
      EvolutionResponse =
      await evolutionResponse.json();

    const result = {
      id: pokemon.id,

      name:
        pokemon.name,

      image:
        pokemon.sprites
          .front_default,

      types:
        pokemon.types.map(
          item =>
            item.type.name
        ),

      abilities:
        pokemon.abilities.map(
          item =>
            item.ability.name
        ),

      stats:
        Object.fromEntries(
          pokemon.stats.map(
            item => [
              item.stat.name,
              item.base_stat
            ]
          )
        ),

      evolution:
        extractEvolution(
          evolution.chain
        )
    };

    pokemonCache.set(
      key,
      {
        data: result,

        expires:
          Date.now() +
          CACHE_TIME
      }
    );

    return result;
  };

function extractEvolution(
  node: EvolutionNode
): string[] {

  const result = [
    node.species.name
  ];

  for (
    const next
      of node.evolves_to
  ) {

    result.push(
      ...extractEvolution(
        next
      )
    );
  }

  return result;
}

export const getPokemonsFromApi =
  async (
    page: number,
    limit: number,
    type?: string
  ) => {

    let url =
      "https://pokeapi.co/api/v2/pokemon?limit=100000";

    if (type) {

      url =
        `https://pokeapi.co/api/v2/type/${type}`;
    }

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Error consultando PokeAPI"
      );
    }

    const data =
      await response.json();

    let results:
      {
        name: string;
        url: string;
      }[] = [];

    if (type) {

      results =
        data.pokemon.map(
          (
            item: {
              pokemon: {
                name: string;
                url: string;
              };
            }
          ) =>
            item.pokemon
        );

    } else {

      results =
        data.results;
    }

    const total =
      results.length;

    const totalPages =
      Math.ceil(
        total / limit
      );

    const offset =
      (page - 1) *
      limit;

    const paginatedResults =
      results.slice(
        offset,
        offset + limit
      );

    return {

      data:
        paginatedResults,

      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  };

export const searchPokemonsFromApi =
  async (
    name: string
  ) => {

    const pokemon =
      await getPokemonFromApi(
        name.toLowerCase()
      );

    return {
      data: pokemon
    };
  };