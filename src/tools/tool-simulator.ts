import { searchPokemon } from "./search-pokemon.tool.js";
import { getPokemonDetails } from "./get-pokemon-details.tool.js";
import { comparePokemon } from "./compare-pokemon.tool.js";

const run = async () => {
  console.log("\n=== search_pokemon ===");

  console.log(
    JSON.stringify(
      await searchPokemon({
        name: "pikachu"
      }),
      null,
      2
    )
  );

  console.log("\n=== get_pokemon_details ===");

  console.log(
    JSON.stringify(
      await getPokemonDetails({
        id: 25
      }),
      null,
      2
    )
  );

  console.log("\n=== compare_pokemon ===");

  console.log(
    JSON.stringify(
      await comparePokemon({
        pokemon1: "pikachu",
        pokemon2: "charizard"
      }),
      null,
      2
    )
  );
};

run();