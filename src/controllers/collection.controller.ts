import {
  Request,
  Response
} from "express";

import {
  createCollection,
  getCollections,
  updateCollection,
  deleteCollection
} from "../services/collection.service.js";


export const createCollectionController =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const name =
        typeof req.body.name === "string"
          ? req.body.name.trim()
          : "";

      if (!name) {
        res.status(400).json({
          message:
            "El nombre de la colección es obligatorio"
        });

        return;
      }

      const collection =
        await createCollection(name);

      res.status(201).json(
        collection
      );

    } catch (error) {

      res.status(500).json({
        message:
          "Error al crear la colección"
      });
    }
  };


export const getCollectionsController =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const collections =
        await getCollections();

      res.status(200).json(
        collections
      );

    } catch (error) {

      res.status(500).json({
        message:
          "Error al obtener las colecciones"
      });
    }
  };


export const updateCollectionController =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const id =
        Number(req.params.id);

      const name =
        typeof req.body.name === "string"
          ? req.body.name.trim()
          : "";

      if (
        !Number.isInteger(id) ||
        id < 1
      ) {
        res.status(400).json({
          message:
            "El ID no es válido"
        });

        return;
      }

      if (!name) {
        res.status(400).json({
          message:
            "El nombre de la colección es obligatorio"
        });

        return;
      }

      const collection =
        await updateCollection(
          id,
          name
        );

      if (!collection) {
        res.status(404).json({
          message:
            "Colección no encontrada"
        });

        return;
      }

      res.status(200).json(
        collection
      );

    } catch (error) {

      res.status(500).json({
        message:
          "Error al actualizar la colección"
      });
    }
  };


export const deleteCollectionController =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id < 1
      ) {
        res.status(400).json({
          message:
            "El ID no es válido"
        });

        return;
      }

      const deleted =
        await deleteCollection(id);

      if (!deleted) {
        res.status(404).json({
          message:
            "Colección no encontrada"
        });

        return;
      }

      res.status(204).send();

    } catch (error) {

      res.status(500).json({
        message:
          "Error al eliminar la colección"
      });
    }
  };