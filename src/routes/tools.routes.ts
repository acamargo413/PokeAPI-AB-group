import { Router } from "express";

import { searchPokemon } from "../tools/search-pokemon.tool.js";
import { getPokemonDetails } from "../tools/get-pokemon-details.tool.js";
import { comparePokemon } from "../tools/compare-pokemon.tool.js";

const router = Router();

router.post("/search", async (req, res) => {
  const result = await searchPokemon(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/details", async (req, res) => {
  const result = await getPokemonDetails(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/compare", async (req, res) => {
  const result = await comparePokemon(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

export default router;