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

      const {
        name,
        organizationId
      } = req.body;

      const orgId = Number(organizationId);

      if (
        typeof name !== "string" ||
        !name.trim() ||
        !Number.isInteger(orgId) ||
        orgId < 1
      ) {
        res.status(400).json({
          message:
            "name y organizationId son obligatorios"
        });

        return;
      }

      const collection =
        await createCollection(
          name.trim(),
          orgId
        );

      res.status(201).json(collection);

    } catch (error) {

      console.error(
        "Error al crear colección:",
        error
      );

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

      const organizationId =
        Number(req.query.organizationId);

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

      const collections =
        await getCollections(
          organizationId
        );

      res.status(200).json(collections);

    } catch (error) {

      console.error(
        "Error al obtener colecciones:",
        error
      );

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

      const {
        name,
        organizationId
      } = req.body;

      const orgId =
        Number(organizationId);

      if (
        !Number.isInteger(id) ||
        id < 1 ||
        typeof name !== "string" ||
        !name.trim() ||
        !Number.isInteger(orgId) ||
        orgId < 1
      ) {
        res.status(400).json({
          message:
            "id, name y organizationId son obligatorios"
        });

        return;
      }

      const collection =
        await updateCollection(
          id,
          name.trim(),
          orgId
        );

      if (!collection) {

        res.status(404).json({
          message:
            "Colección no encontrada en esta organización"
        });

        return;
      }

      res.status(200).json(collection);

    } catch (error) {

      console.error(
        "Error al actualizar colección:",
        error
      );

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

      const organizationId =
        Number(req.query.organizationId);

      if (
        !Number.isInteger(id) ||
        id < 1 ||
        !Number.isInteger(organizationId) ||
        organizationId < 1
      ) {
        res.status(400).json({
          message:
            "id y organizationId son obligatorios"
        });

        return;
      }

      const deleted =
        await deleteCollection(
          id,
          organizationId
        );

      if (!deleted) {

        res.status(404).json({
          message:
            "Colección no encontrada en esta organización"
        });

        return;
      }

      res.status(204).send();

    } catch (error) {

      console.error(
        "Error al eliminar colección:",
        error
      );

      res.status(500).json({
        message:
          "Error al eliminar la colección"
      });
    }
  };