import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getPokemonFromApi
} from "../../src/services/pokemon.service.js";


describe("getPokemonFromApi", () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });


  it("debe obtener y transformar correctamente un Pokémon", async () => {

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {

        if (
          String(url).includes("/pokemon/pikachu")
        ) {
          return new Response(
            JSON.stringify({
              id: 25,
              name: "pikachu",
              sprites: {
                front_default:
                  "https://example.com/pikachu.png"
              },
              types: [
                {
                  type: {
                    name: "electric"
                  }
                }
              ],
              abilities: [
                {
                  ability: {
                    name: "static"
                  }
                }
              ],
              stats: [
                {
                  base_stat: 35,
                  stat: {
                    name: "hp"
                  }
                },
                {
                  base_stat: 55,
                  stat: {
                    name: "attack"
                  }
                }
              ]
            }),
            {
              status: 200
            }
          );
        }


        if (
          String(url).includes(
            "/pokemon-species/pikachu"
          )
        ) {
          return new Response(
            JSON.stringify({
              evolution_chain: {
                url:
                  "https://pokeapi.co/api/v2/evolution-chain/10"
              }
            }),
            {
              status: 200
            }
          );
        }


        if (
          String(url).includes(
            "/evolution-chain/10"
          )
        ) {
          return new Response(
            JSON.stringify({
              chain: {
                species: {
                  name: "pichu"
                },
                evolves_to: [
                  {
                    species: {
                      name: "pikachu"
                    },
                    evolves_to: [
                      {
                        species: {
                          name: "raichu"
                        },
                        evolves_to: []
                      }
                    ]
                  }
                ]
              }
            }),
            {
              status: 200
            }
          );
        }


        return new Response(
          JSON.stringify({}),
          {
            status: 404
          }
        );
      });


    const result =
      await getPokemonFromApi(
        "pikachu"
      );


    expect(result).toEqual({
      id: 25,

      name: "pikachu",

      image:
        "https://example.com/pikachu.png",

      types: [
        "electric"
      ],

      abilities: [
        "static"
      ],

      stats: {
        hp: 35,
        attack: 55
      },

      evolution: [
        "pichu",
        "pikachu",
        "raichu"
      ]
    });


    expect(
      fetchMock
    ).toHaveBeenCalledTimes(3);
  });


  it("debe lanzar error cuando el Pokémon no existe", async () => {

    vi.spyOn(
      globalThis,
      "fetch"
    ).mockResolvedValue(
      new Response(
        JSON.stringify({}),
        {
          status: 404
        }
      )
    );


    await expect(
      getPokemonFromApi(
        "pokemon-inexistente"
      )
    ).rejects.toThrow(
      "Pokemon no encontrado"
    );
  });

  it("debe buscar un personaje de Rick and Morty cuando no existe en PokéAPI", async () => {

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).includes("pokeapi.co")) {
        return new Response(JSON.stringify({}), { status: 404 });
      }

      return new Response(JSON.stringify({
        results: [{
          id: 1,
          name: "Rick Sanchez",
          image: "https://example.com/rick.jpg",
          species: "Human",
          gender: "Male",
          status: "Alive",
          origin: { name: "Earth (C-137)" },
          location: { name: "Citadel of Ricks" },
          episode: ["episode/1", "episode/2"]
        }]
      }), { status: 200 });
    });

    await expect(getPokemonFromApi("rick sanchez")).resolves.toMatchObject({
      id: 1,
      name: "Rick Sanchez",
      types: ["Human", "Male"],
      stats: { episodios: 2 }
    });
  });

});
