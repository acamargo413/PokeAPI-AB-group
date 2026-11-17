import { getPokemonFromApi } from "../services/pokemon.service.js";

export interface ToolResponse {
  success: boolean;
  tool: string;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export const searchPokemon = async (
  params: unknown
): Promise<ToolResponse> => {

  if (
    typeof params !== "object" ||
    params === null
  ) {
    return {
      success: false,
      tool: "search_pokemon",
      error: {
        code: "INVALID_PARAMETERS",
        message:
          "Los parámetros deben ser un objeto"
      }
    };
  }

  const { name } =
    params as {
      name?: unknown;
    };

  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return {
      success: false,
      tool: "search_pokemon",
      error: {
        code: "INVALID_NAME",
        message:
          "El parámetro name es obligatorio"
      }
    };
  }

  try {

    const pokemon =
      await getPokemonFromApi(
        name.trim().toLowerCase()
      );

    return {
      success: true,
      tool: "search_pokemon",
      data: {
        id: pokemon.id,
        name: pokemon.name,
        types: pokemon.types,
        image: pokemon.image
      }
    };

  } catch (error) {

    return {
      success: false,
      tool: "search_pokemon",
      error: {
        code: "POKEMON_NOT_FOUND",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo encontrar el Pokémon"
      }
    };
  }
};