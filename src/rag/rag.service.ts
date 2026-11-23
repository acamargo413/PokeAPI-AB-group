import { getCharacterFromApi } from "../services/pokemon.service.js";

export interface RagPokemon {
  id: number;
  name: string;
  image?: string | null;
  types: string[];
  abilities: string[];
  stats: Record<string, number>;
  evolution?: string[];
}

export const obtenerPokemonParaRag = async (
  id: string,
  source: "pokemon" | "rickandmorty" | "auto" = "auto"
): Promise<RagPokemon> => {
  return getCharacterFromApi(id, source);
};

export const construirContextoPokemon = (
  pokemon: RagPokemon
): string => {
  return `
Información del personaje:

Nombre: ${pokemon.name}
ID: ${pokemon.id}
Imagen: ${pokemon.image || ""}
Tipos: ${pokemon.types.join(", ")}
Habilidades: ${pokemon.abilities.join(", ")}

Estadísticas:
${Object.entries(pokemon.stats).map(([name, value]) => `${name}: ${value}`).join("\n") || "No disponibles"}

Evolución: ${pokemon.evolution?.join(" → ") || "No disponible"}
`.trim();
};

export const buscarContextoPokemon = async (
  consulta: string,
  source: "pokemon" | "rickandmorty" | "auto" = "auto"
): Promise<string> => {
  const pokemon = consulta.trim().toLowerCase();

  const data = await obtenerPokemonParaRag(pokemon, source);

  return construirContextoPokemon(data);
};
