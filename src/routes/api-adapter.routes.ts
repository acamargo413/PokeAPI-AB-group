import { Router } from "express";
import {
  previewApiAdapter,
  type ApiAdapterConfig
} from "../services/api-adapter.service.js";

const router = Router();

/**
 * Previsualiza cómo una API externa quedará en el formato de la aplicación.
 * No persiste credenciales ni configuración: el cliente decide dónde guardarla.
 */
router.post("/preview", async (req, res) => {
  try {
    const result = await previewApiAdapter(req.body as ApiAdapterConfig);
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "No se pudo interpretar la API"
    });
  }
});

export default router;
