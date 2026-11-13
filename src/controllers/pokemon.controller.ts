import {
  Request,
  Response
} from "express";

import {
  getPokemonFromApi,
  getPokemonsFromApi,
  searchPokemonsFromApi
} from "../services/pokemon.service.js";

export const getPokemon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id =
      req.params.id as string;

    if (!id) {
      res.status(400).json({
        message:
          "El identificador es obligatorio"
      });
      return;
    }

    const pokemon =
      await getPokemonFromApi(id);

    res.status(200).json(pokemon);

  } catch (error) {

    res.status(404).json({
      message:
        "Pokémon no encontrado"
    });
  }
};

export const getPokemons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const page =
      typeof req.query.page === "string"
        ? Number(req.query.page)
        : 1;

    const limit =
      typeof req.query.limit === "string"
        ? Number(req.query.limit)
        : 10;

    const type =
      typeof req.query.type === "string"
        ? req.query.type
        : undefined;

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      res.status(400).json({
        message:
          "Los parámetros page y limit no son válidos"
      });

      return;
    }

    const result =
      await getPokemonsFromApi(
        page,
        limit,
        type
      );

    res.status(200).json(result);

  } catch (error) {

    res.status(500).json({
      message:
        "Error al obtener los Pokémon"
    });
  }
};

export const searchPokemon = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const name =
      typeof req.query.name === "string"
        ? req.query.name
        : "";

    if (!name.trim()) {
      res.status(400).json({
        message:
          "El parámetro name es obligatorio"
      });

      return;
    }

    const result =
      await searchPokemonsFromApi(
        name
      );

    res.status(200).json(result);

  } catch (error) {

    res.status(404).json({
      message:
        "Pokémon no encontrado"
    });
  }
};