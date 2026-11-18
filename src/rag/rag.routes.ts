import { Router } from "express";
import {
  buscarContextoPokemon,
} from "../rag/rag.service.js";

const router = Router();

router.post("/query", async (req, res) => {
  try {
    const { consulta } = req.body;

    if (!consulta) {
      return res.status(400).json({
        success: false,
        error: "La consulta es obligatoria.",
      });
    }

    const contexto = await buscarContextoPokemon(consulta);

    return res.json({
      success: true,
      consulta,
      contexto,
    });

  } catch (error) {
    console.error("Error en RAG:", error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error consultando el RAG.",
    });
  }
});

export default router;