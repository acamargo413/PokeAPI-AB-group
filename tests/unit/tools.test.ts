import { describe, it, expect, vi } from "vitest";

import { searchPokemon } from "../../src/tools/search-pokemon.tool.js";
import { getPokemonDetails } from "../../src/tools/get-pokemon-details.tool.js";
import { comparePokemon } from "../../src/tools/compare-pokemon.tool.js";

describe("AI Tools", () => {

  it("search_pokemon debe buscar un Pokémon correctamente", async () => {

    const result = await searchPokemon({
      name: "pikachu"
    });

    expect(result.success).toBe(true);
    expect(result.tool).toBe("search_pokemon");
    expect(result.data).toMatchObject({
      id: 25,
      name: "pikachu"
    });
  });


  it("search_pokemon debe validar el nombre", async () => {

    const result = await searchPokemon({
      name: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("INVALID_NAME");
  });


  it("get_pokemon_details debe devolver los detalles", async () => {

    const result = await getPokemonDetails({
      id: 25
    });

    expect(result.success).toBe(true);
    expect(result.tool).toBe("get_pokemon_details");
    expect(result.data).toMatchObject({
      id: 25,
      name: "pikachu"
    });
  });


  it("compare_pokemon debe comparar dos Pokémon", async () => {

    const result = await comparePokemon({
      pokemon1: "pikachu",
      pokemon2: "charizard"
    });

    expect(result.success).toBe(true);
    expect(result.tool).toBe("compare_pokemon");

    expect(result.data).toHaveProperty("pokemon1");
    expect(result.data).toHaveProperty("pokemon2");
  });


  it("compare_pokemon no debe permitir el mismo Pokémon", async () => {

    const result = await comparePokemon({
      pokemon1: "pikachu",
      pokemon2: "pikachu"
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("SAME_POKEMON");
  });

});