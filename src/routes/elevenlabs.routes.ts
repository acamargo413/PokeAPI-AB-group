
import { Router } from "express";

import {
  getAgentPrompt,
  getAgentConfiguration,
  getAgentFirstMessage,
  updateAgentPrompt,
  updateAgentFirstMessage,
  makeTestCall
} from "../services/elevenlabs.service.js";

const router = Router();


// ============================================================
// GET PROMPT
// ============================================================

router.get(
  "/prompt",
  async (_req, res) => {

    try {

      const prompt =
        await getAgentPrompt();

      return res.json({
        success: true,
        prompt
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo obtener el prompt"
      });
    }
  }
);


// ============================================================
// PATCH PROMPT
// ============================================================

router.patch(
  "/prompt",
  async (req, res) => {

    try {

      const {
        prompt
      } = req.body;

      if (
        typeof prompt !== "string" ||
        !prompt.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "El campo prompt es obligatorio"
        });
      }

      const result =
        await updateAgentPrompt(
          prompt
        );

      return res.json({
        success: true,
        message:
          "Prompt actualizado correctamente",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error actualizando prompt:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el prompt"
      });
    }
  }
);


// ============================================================
// GET CONFIGURACIÓN COMPLETA
// ============================================================

router.get(
  "/config",
  async (_req, res) => {

    try {

      const config =
        await getAgentConfiguration();

      return res.json({
        success: true,
        data: config
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo obtener la configuración"
      });
    }
  }
);


// ============================================================
// GET MENSAJE INICIAL
// ============================================================

router.get(
  "/first-message",
  async (_req, res) => {

    try {

      const firstMessage =
        await getAgentFirstMessage();

      return res.json({
        success: true,
        firstMessage
      });

    } catch (error) {

      console.error(
        "Error obteniendo mensaje inicial:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo obtener el mensaje inicial"
      });
    }
  }
);


// ============================================================
// PATCH MENSAJE INICIAL
// ============================================================

router.patch(
  "/first-message",
  async (req, res) => {

    try {

      const {
        firstMessage
      } = req.body;

      if (
        typeof firstMessage !== "string" ||
        !firstMessage.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "El campo firstMessage es obligatorio"
        });
      }

      const result =
        await updateAgentFirstMessage(
          firstMessage
        );

      return res.json({
        success: true,
        message:
          "Mensaje inicial actualizado correctamente",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error actualizando mensaje inicial:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el mensaje inicial"
      });
    }
  }
);


// ============================================================
// REALIZAR LLAMADA DE PRUEBA
// ============================================================

router.post(
  "/test-call",
  async (req, res) => {

    try {

      const {
        toNumber,
        temporaryPrompt,
        temporaryFirstMessage
      } = req.body;

      if (
        typeof toNumber !== "string" ||
        !toNumber.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "El campo toNumber es obligatorio"
        });
      }

      if (
        temporaryPrompt !== undefined &&
        (
          typeof temporaryPrompt !== "string" ||
          !temporaryPrompt.trim()
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "temporaryPrompt debe ser un texto válido"
        });
      }

      if (
        temporaryFirstMessage !== undefined &&
        (
          typeof temporaryFirstMessage !== "string" ||
          !temporaryFirstMessage.trim()
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "temporaryFirstMessage debe ser un texto válido"
        });
      }

      const result =
        await makeTestCall(
          toNumber.trim(),
          temporaryPrompt?.trim() ||
            undefined,
          temporaryFirstMessage?.trim() ||
            undefined
        );

      return res.json({
        success: true,
        message:
          "Llamada enviada correctamente",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error en /test-call:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo realizar la llamada"
      });
    }
  }
);


export default router;
