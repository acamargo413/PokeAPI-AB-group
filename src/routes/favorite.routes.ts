import { Router } from "express";

import {
  addFavoriteController,
  getFavoritesController,
  deleteFavoriteController
} from "../controllers/favorite.controller.js";

const router = Router();

router.post(
  "/:collectionId/favorites",
  addFavoriteController
);

router.get(
  "/:collectionId/favorites",
  getFavoritesController
);

router.delete(
  "/:collectionId/favorites/:pokemonId",
  deleteFavoriteController
);

export default router;