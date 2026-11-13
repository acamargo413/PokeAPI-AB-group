import express from "express";
import cors from "cors";

import pokemonRoutes
  from "./routes/pokemon.routes.js";


const app = express();


app.use(cors());

app.use(express.json());


app.use(
  "/api/pokemon",
  pokemonRoutes
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