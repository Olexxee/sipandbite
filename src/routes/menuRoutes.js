import express from "express";

import { verifyAdmin } from "../middlewares/auth.js";
import processMedia from "../middlewares/processMedia.js";
import validate from "../middlewares/validate.js";

import {
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controller/menuController.js";

import {
  createMenuSchema,
  updateMenuSchema,
} from "../validators/menu.validator.js";

const router = express.Router();

// Public
router.get("/", getMenu);

// Protected
router.post(
  "/",
  verifyAdmin,
  processMedia, // Parse multipart/form-data first
  validate(createMenuSchema), // Then validate req.body
  createMenuItem,
);

router.patch(
  "/:id",
  verifyAdmin,
  processMedia, // Parse multipart/form-data first
  validate(updateMenuSchema),
  updateMenuItem,
);

router.delete(
  "/:id",
  verifyAdmin,
  deleteMenuItem,
);

export default router;

