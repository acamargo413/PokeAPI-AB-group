import { Router } from "express";

import {
  createCollectionController,
  getCollectionsController,
  updateCollectionController,
  deleteCollectionController
} from "../controllers/collection.controller.js";

const router =
  Router();

//POST


router.post(
  "/",
  createCollectionController
);

//GET

router.get(
  "/",
  getCollectionsController
);

//PUT

router.put(
  "/:id",
  updateCollectionController
);

//DELETE

router.delete(
  "/:id",
  deleteCollectionController
);

export default router;