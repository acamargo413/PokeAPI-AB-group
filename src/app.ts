import express from "express";
import cors from "cors";
import collectionRoutes
  from "./routes/collection.routes.js";
import pokemonRoutes
  from "./routes/pokemon.routes.js";
import favoriteRoutes
  from "./routes/favorite.routes.js";


const app = express();


app.use(cors());

app.use(express.json());


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


const PORT = 3000;


app.listen(
  PORT,
  () => {

    console.log(
      `Servidor ejecutándose en http://localhost:${PORT}`
    );

  }
);