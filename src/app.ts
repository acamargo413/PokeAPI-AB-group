
import express from "express";
import cors from "cors";

import pokemonRoutes from "./routes/pokemon.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import toolsRoutes from "./routes/tools.routes.js";
import elevenlabsRoutes from "./routes/elevenlabs.routes.js";
import ragRoutes from "./rag/rag.routes.js";
import apiAdapterRoutes from "./routes/api-adapter.routes.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));


// ============================================================
// API
// ============================================================

app.use(
  "/api/pokemon",
  pokemonRoutes
);

app.use(
  "/api/collections",
  collectionRoutes
);

app.use(
  "/api/collections",
  favoriteRoutes
);

app.use(
  "/api/tools",
  toolsRoutes
);

app.use(
  "/api/elevenlabs",
  elevenlabsRoutes
);

app.use(
  "/api/rag",
  ragRoutes
);

app.use(
  "/api/api-adapter",
  apiAdapterRoutes
);

// ============================================================
// FRONTEND
// ============================================================

app.use(
  express.static(process.cwd())
);


export default app;
