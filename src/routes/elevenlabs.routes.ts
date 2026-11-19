import { Router } from "express";

import {
  getAgentPrompt,
  updateAgentPrompt,
  getAgentConfiguration,
  getAgentFirstMessage,
  updateAgentFirstMessage,
  makeTestCall,
  crearHerramientaRag,
  configurarHerramientaRag,
  listarHerramientas,
  verificarHerramientaRag,
  asociarHerramientaRag
} from "../services/elevenlabs.service.js";

const router =
  Router();

// ============================================================
// PROMPT
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

      console.error(
        "Error obteniendo prompt:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error obteniendo el prompt."
      });

    }

  }
);

// ============================================================
// ACTUALIZAR PROMPT
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
          error:
            "El prompt es obligatorio."
        });

      }

      const result =
        await updateAgentPrompt(
          prompt
        );

      return res.json({
        success: true,
        message:
          "Prompt actualizado correctamente.",
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
        error:
          error instanceof Error
            ? error.message
            : "Error actualizando el prompt."
      });

    }

  }
);

// ============================================================
// CONFIGURACIÓN
// ============================================================

router.get(
  "/config",
  async (_req, res) => {

    try {

      const config =
        await getAgentConfiguration();

      return res.json({
        success: true,
        config
      });

    } catch (error) {

      console.error(
        "Error obteniendo configuración:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error obteniendo configuración."
      });

    }

  }
);

// ============================================================
// FIRST MESSAGE
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
        "Error obteniendo primer mensaje:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error obteniendo primer mensaje."
      });

    }

  }
);

// ============================================================
// ACTUALIZAR FIRST MESSAGE
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
          error:
            "El primer mensaje es obligatorio."
        });

      }

      const result =
        await updateAgentFirstMessage(
          firstMessage
        );

      return res.json({
        success: true,
        message:
          "Primer mensaje actualizado correctamente.",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error actualizando primer mensaje:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error actualizando primer mensaje."
      });

    }

  }
);

// ============================================================
// LLAMADA
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
          error:
            "El número de destino es obligatorio."
        });

      }

      const result =
        await makeTestCall(
          toNumber.trim(),
          temporaryPrompt,
          temporaryFirstMessage
        );

      return res.json({
        success: true,
        message:
          "Llamada iniciada correctamente.",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error realizando llamada:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error realizando la llamada."
      });

    }

  }
);

// ============================================================
// CREAR HERRAMIENTA RAG
// ============================================================

router.post(
  "/create-rag-tool",
  async (_req, res) => {

    try {

      const result =
        await configurarHerramientaRag();

      return res.json({
        success: true,
        message:
          "Herramienta RAG configurada, actualizada y asociada correctamente.",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error configurando herramienta RAG:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error configurando herramienta RAG."
      });

    }

  }
);

// ============================================================
// LISTAR / BUSCAR HERRAMIENTAS
// ============================================================

router.get(
  "/tools",
  async (_req, res) => {

    try {

      const result =
        await listarHerramientas();

      return res.json({
        success: true,
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error listando herramientas:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error listando herramientas."
      });

    }

  }
);

// ============================================================
// VERIFICAR HERRAMIENTA
// ============================================================

router.get(
  "/rag-tool/:toolId",
  async (req, res) => {

    try {

      const {
        toolId
      } = req.params;

      const environment =
        typeof req.query.environment === "string"
          ? req.query.environment
          : "production";

      const result =
        await verificarHerramientaRag(
          toolId,
          environment
        );

      return res.json({
        success: true,
        message:
          "Herramienta encontrada.",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error verificando herramienta RAG:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error verificando herramienta RAG."
      });

    }

  }
);

// ============================================================
// ASOCIAR HERRAMIENTA RAG
// ============================================================

router.post(
  "/attach-rag-tool",
  async (req, res) => {

    try {

      const {
        toolId
      } = req.body ?? {};

      const result =
        await asociarHerramientaRag(
          typeof toolId === "string"
            ? toolId
            : undefined
        );

      return res.json({
        success: true,
        message:
          "Herramienta RAG asociada correctamente.",
        data:
          result
      });

    } catch (error) {

      console.error(
        "Error asociando herramienta RAG:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error asociando herramienta RAG."
      });

    }

  }
);

export default router;