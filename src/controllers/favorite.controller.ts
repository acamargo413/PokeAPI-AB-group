import {
  Request,
  Response
} from "express";

import {
  addFavorite,
  getFavoritesByCollection,
  deleteFavorite
} from "../services/favorite.service.js";


export const addFavoriteController =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const collectionId =
        Number(req.params.collectionId);

      const {
        pokemonId,
        pokemonName,
        organizationId
      } = req.body;

      const orgId =
        Number(organizationId);

      if (
        !Number.isInteger(collectionId) ||
        collectionId < 1
      ) {
        res.status(400).json({
          message:
            "El ID de la colección no es válido"
        });

        return;
      }

      if (
        !Number.isInteger(pokemonId) ||
        pokemonId < 1
      ) {
        res.status(400).json({
          message:
            "El ID del Pokémon no es válido"
        });

        return;
      }

      if (
        typeof pokemonName !== "string" ||
        !pokemonName.trim()
      ) {
        res.status(400).json({
          message:
            "El nombre del Pokémon es obligatorio"
        });

        return;
      }

      if (
        !Number.isInteger(orgId) ||
        orgId < 1
      ) {
        res.status(400).json({
          message:
            "organizationId es obligatorio"
        });

        return;
      }

      const favorite =
        await addFavorite(
          pokemonId,
          pokemonName.trim(),
          collectionId,
          orgId
        );

      res.status(201).json(favorite);

    } catch (error) {

      console.error(
        "Error agregando favorito:",
        error
      );

      res.status(500).json({
        message:
          "Error al guardar el Pokémon favorito"
      });
    }
  };


export const getFavoritesController =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const collectionId =
        Number(req.params.collectionId);

      const organizationId =
        Number(req.query.organizationId);

      if (
        !Number.isInteger(collectionId) ||
        collectionId < 1
      ) {
        res.status(400).json({
          message:
            "El ID de la colección no es válido"
        });

        return;
      }

      if (
        !Number.isInteger(organizationId) ||
        organizationId < 1
      ) {
        res.status(400).json({
          message:
            "organizationId es obligatorio"
        });

        return;
      }

      const favorites =
        await getFavoritesByCollection(
          collectionId,
          organizationId
        );

      res.status(200).json(favorites);

    } catch (error) {

      console.error(
        "Error obteniendo favoritos:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener los favoritos"
      });
    }
  };


export const deleteFavoriteController =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const collectionId =
        Number(req.params.collectionId);

      const pokemonId =
        Number(req.params.pokemonId);

      const organizationId =
        Number(req.query.organizationId);

      if (
        !Number.isInteger(collectionId) ||
        collectionId < 1 ||
        !Number.isInteger(pokemonId) ||
        pokemonId < 1
      ) {
        res.status(400).json({
          message:
            "Los IDs no son válidos"
        });

        return;
      }

      if (
        !Number.isInteger(organizationId) ||
        organizationId < 1
      ) {
        res.status(400).json({
          message:
            "organizationId es obligatorio"
        });

        return;
      }

      const deleted =
        await deleteFavorite(
          collectionId,
          pokemonId,
          organizationId
        );

      if (!deleted) {

        res.status(404).json({
          message:
            "Favorito no encontrado en esta organización"
        });

        return;
      }

      res.status(204).send();

    } catch (error) {

      console.error(
        "Error eliminando favorito:",
        error
      );

      res.status(500).json({
        message:
          "Error al eliminar el favorito"
      });
    }
  };