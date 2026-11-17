import { getPokemonFromApi } from "../services/pokemon.service.js";
import type { ToolResponse } from "./search-pokemon.tool.js";

export const comparePokemon = async (
  params: unknown
): Promise<ToolResponse> => {

  if (
    typeof params !== "object" ||
    params === null
  ) {
    return {
      success: false,
      tool: "compare_pokemon",
      error: {
        code: "INVALID_PARAMETERS",
        message: "Los parámetros deben ser un objeto"
      }
    };
  }

  const { pokemon1, pokemon2 } =
    params as {
      pokemon1?: unknown;
      pokemon2?: unknown;
    };

  if (
    typeof pokemon1 !== "string" ||
    !pokemon1.trim()
  ) {
    return {
      success: false,
      tool: "compare_pokemon",
      error: {
        code: "INVALID_POKEMON_1",
        message: "El parámetro pokemon1 es obligatorio"
      }
    };
  }

  if (
    typeof pokemon2 !== "string" ||
    !pokemon2.trim()
  ) {
    return {
      success: false,
      tool: "compare_pokemon",
      error: {
        code: "INVALID_POKEMON_2",
        message: "El parámetro pokemon2 es obligatorio"
      }
    };
  }

  if (
    pokemon1.trim().toLowerCase() ===
    pokemon2.trim().toLowerCase()
  ) {
    return {
      success: false,
      tool: "compare_pokemon",
      error: {
        code: "SAME_POKEMON",
        message: "Debes comparar dos Pokémon diferentes"
      }
    };
  }

  try {
    const [first, second] = await Promise.all([
      getPokemonFromApi(
        pokemon1.trim().toLowerCase()
      ),
      getPokemonFromApi(
        pokemon2.trim().toLowerCase()
      )
    ]);

    return {
      success: true,
      tool: "compare_pokemon",
      data: {
        pokemon1: {
          id: first.id,
          name: first.name,
          types: first.types,
          stats: first.stats
        },
        pokemon2: {
          id: second.id,
          name: second.name,
          types: second.types,
          stats: second.stats
        }
      }
    };

  } catch (error) {

    return {
      success: false,
      tool: "compare_pokemon",
      error: {
        code: "COMPARISON_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron comparar los Pokémon"
      }
    };
  }
};