import { Router } from "express";

import {
  createCollectionController,
  getCollectionsController,
  updateCollectionController,
  deleteCollectionController
} from "../controllers/collection.controller.js";

const router = Router();

router.post(
  "/",
  createCollectionController
);

router.get(
  "/",
  getCollectionsController
);

router.put(
  "/:id",
  updateCollectionController
);

router.delete(
  "/:id",
  deleteCollectionController
);

export default router;