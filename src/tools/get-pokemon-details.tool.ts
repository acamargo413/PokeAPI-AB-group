import { getPokemonFromApi } from "../services/pokemon.service.js";
import type { ToolResponse } from "./search-pokemon.tool.js";

export const getPokemonDetails = async (
  params: unknown
): Promise<ToolResponse> => {

  if (
    typeof params !== "object" ||
    params === null
  ) {
    return {
      success: false,
      tool: "get_pokemon_details",
      error: {
        code: "INVALID_PARAMETERS",
        message: "Los parámetros deben ser un objeto"
      }
    };
  }

  const { id } =
    params as {
      id?: unknown;
    };

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    String(id).trim() === ""
  ) {
    return {
      success: false,
      tool: "get_pokemon_details",
      error: {
        code: "INVALID_ID",
        message: "El parámetro id es obligatorio"
      }
    };
  }

  try {
    const pokemon = await getPokemonFromApi(
      String(id).trim().toLowerCase()
    );

    return {
      success: true,
      tool: "get_pokemon_details",
      data: pokemon
    };

  } catch (error) {

    return {
      success: false,
      tool: "get_pokemon_details",
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