import { Router } from "express";

import {
  getPokemon,
  getPokemons,
  searchPokemon
} from "../controllers/pokemon.controller.js";

const router = Router();

router.get(
  "/",
  getPokemons
);

router.get(
  "/search",
  searchPokemon
);

router.get(
  "/:id",
  getPokemon
);

export default router;