import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import pokemonRoutes from "./routes/pokemon.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Obtener rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir frontend
app.use(
  express.static(
    path.join(__dirname, "../..")
  )
);

// Rutas API
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

export default app;