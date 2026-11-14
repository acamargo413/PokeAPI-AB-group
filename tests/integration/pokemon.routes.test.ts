import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

import app from "../../src/app.js";

describe("Pokémon API - pruebas de integración", () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/pokemon debe devolver una lista de Pokémon", async () => {

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              {
                name: "pikachu",
                url: "https://pokeapi.co/api/v2/pokemon/25/"
              },
              {
                name: "bulbasaur",
                url: "https://pokeapi.co/api/v2/pokemon/1/"
              }
            ]
          }),
          {
            status: 200
          }
        )
      );

    const response =
      await request(app)
        .get("/api/pokemon")
        .expect(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(2);

    expect(
      response.body.data[0].name
    ).toBe("pikachu");

  });

});