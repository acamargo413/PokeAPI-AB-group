import { Router } from "express";
import {
  buscarContextoPokemon,
} from "../rag/rag.service.js";
import {
  createRagContext,
  deleteRagContext,
  getRagContext,
  listRagContexts,
  listRagContextGroups,
  renameRagContextGroup,
  deleteRagContextGroup,
  searchRagContexts,
  updateRagContext,
} from "./context.store.js";

const router = Router();

router.get("/contexts", async (_req, res) => {
  try {
    const contexts = await listRagContexts();
    return res.json({ success: true, data: contexts.map(({ content, ...metadata }) => ({ ...metadata, groupName: metadata.groupName || "Sin grupo", size: content.length })) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudieron consultar los contextos." });
  }
});

router.get("/context-groups", async (_req, res) => {
  try {
    return res.json({ success: true, data: await listRagContextGroups() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudieron consultar los contextos." });
  }
});

router.put("/context-groups/:name", async (req, res) => {
  const nextName = (req.body as { name?: string }).name?.trim();
  if (!nextName) return res.status(400).json({ success: false, error: "El nuevo nombre del contexto es obligatorio." });
  try {
    const count = await renameRagContextGroup(req.params.name, nextName);
    if (!count) return res.status(404).json({ success: false, error: "No se encontró el contexto." });
    return res.json({ success: true, updatedDocuments: count });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudo renombrar el contexto." });
  }
});

router.delete("/context-groups/:name", async (req, res) => {
  try {
    const count = await deleteRagContextGroup(req.params.name);
    if (!count) return res.status(404).json({ success: false, error: "No se encontró el contexto." });
    return res.json({ success: true, deletedDocuments: count });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudo eliminar el contexto." });
  }
});

router.get("/contexts/:id", async (req, res) => {
  try {
    const document = await getRagContext(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: "No se encontró el contexto." });
    return res.json({ success: true, data: document });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudo consultar el contexto." });
  }
});

router.post("/contexts", async (req, res) => {
  const { name, groupName, content, sourceName } = req.body as { name?: string; groupName?: string; content?: string; sourceName?: string };
  if (!name?.trim() || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ success: false, error: "El nombre y el contenido son obligatorios." });
  }
  try {
    const document = await createRagContext({ name, groupName, content, sourceName });
    return res.status(201).json({ success: true, data: { ...document, size: document.content.length } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudo crear el contexto." });
  }
});

router.put("/contexts/:id", async (req, res) => {
  const { name, groupName, content, sourceName } = req.body as { name?: string; groupName?: string; content?: string; sourceName?: string };
  if (!name?.trim() || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ success: false, error: "El nombre y el contenido son obligatorios." });
  }
  try {
    const document = await updateRagContext(req.params.id, { name, groupName, content, sourceName });
    if (!document) return res.status(404).json({ success: false, error: "No se encontró el contexto." });
    return res.json({ success: true, data: { ...document, size: document.content.length } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudo actualizar el contexto." });
  }
});

router.delete("/contexts/:id", async (req, res) => {
  try {
    const deleted = await deleteRagContext(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "No se encontró el contexto." });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudo eliminar el contexto." });
  }
});

router.post("/contexts/query", async (req, res) => {
  const { consulta, contextIds } = req.body as { consulta?: string; contextIds?: string[] };
  if (!consulta?.trim() || !Array.isArray(contextIds) || !contextIds.every(id => typeof id === "string")) {
    return res.status(400).json({ success: false, error: "La consulta y la lista de contextIds son obligatorias." });
  }
  try {
    const resultados = await searchRagContexts(contextIds, consulta);
    return res.json({ success: true, consulta, resultados });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "No se pudieron consultar los contextos." });
  }
});

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
