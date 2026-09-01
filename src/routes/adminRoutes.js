import express from "express";
import { loginAdmin } from "../controller/adminController.js";
import validate from "../middlewares/validate.js";
import { loginAdminSchema } from "../validators/admin.validator.js";

const router = express.Router();

router.post("/login", validate(loginAdminSchema), loginAdmin);

export default router;
