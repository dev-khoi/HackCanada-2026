import { Router } from "express";
import { getUserStyle, saveUserStyle } from "../controllers/userController";

const router = Router();

router.get("/:auth0Id/style", getUserStyle);
router.put("/:auth0Id/style", saveUserStyle);

export default router;
