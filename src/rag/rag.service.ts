const TOOLS_URL = "http://localhost:3000/api/tools";

export interface RagPokemon {
  id: number;
  name: string;
  image?: string;
  types: string[];
  abilities: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    "special-attack": number;
    "special-defense": number;
    speed: number;
  };
  evolution?: string[];
}

export const obtenerPokemonParaRag = async (
  id: string
): Promise<RagPokemon> => {
  const response = await fetch(`${TOOLS_URL}/details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error(
      `Error consultando la API de Pokémon: ${response.status}`
    );
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error("La API no devolvió información del Pokémon.");
  }

  return result.data;
};

export const construirContextoPokemon = (
  pokemon: RagPokemon
): string => {
  return `
Información del Pokémon:

Nombre: ${pokemon.name}
ID: ${pokemon.id}
Tipos: ${pokemon.types.join(", ")}
Habilidades: ${pokemon.abilities.join(", ")}

Estadísticas:
HP: ${pokemon.stats.hp}
Ataque: ${pokemon.stats.attack}
Defensa: ${pokemon.stats.defense}
Ataque especial: ${pokemon.stats["special-attack"]}
Defensa especial: ${pokemon.stats["special-defense"]}
Velocidad: ${pokemon.stats.speed}

Evolución: ${pokemon.evolution?.join(" → ") || "No disponible"}
`.trim();
};

export const buscarContextoPokemon = async (
  consulta: string
): Promise<string> => {
  const pokemon = consulta.trim().toLowerCase();

  const data = await obtenerPokemonParaRag(pokemon);

  return construirContextoPokemon(data);
};