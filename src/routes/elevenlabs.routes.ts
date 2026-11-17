import { Router } from "express";
import { makeTestCall } from "../services/elevenlabs.service.js";

const router = Router();

router.post("/test-call", async (req, res) => {
  try {
    const { toNumber } = req.body;

    if (
      typeof toNumber !== "string" ||
      !toNumber.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "El número de destino es obligatorio"
      });
    }

    const result = await makeTestCall(
      toNumber.trim()
    );

    return res.status(200).json({
      success: true,
      message: "Llamada de prueba iniciada",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al iniciar la llamada"
    });
  }
});

export default router;