import { describe, expect, it } from "vitest";
import { normalizeApiItem } from "../../src/services/api-adapter.service.js";

describe("normalizeApiItem", () => {
  it("normaliza un personaje de Rick and Morty mediante un mapa declarativo", () => {
    const result = normalizeApiItem({
      id: 1,
      name: "Rick Sanchez",
      image: "https://example.test/rick.jpg",
      species: "Human",
      status: "Alive",
      episode: ["a", "b"]
    }, {
      id: "id",
      name: "name",
      image: "image",
      types: ["species"],
      abilities: ["status"],
      stats: { episodios: "episode.length" }
    });

    expect(result).toEqual({
      id: 1,
      name: "Rick Sanchez",
      image: "https://example.test/rick.jpg",
      types: ["Human"],
      abilities: ["Alive"],
      stats: { episodios: 2 },
      evolution: []
    });
  });
});
