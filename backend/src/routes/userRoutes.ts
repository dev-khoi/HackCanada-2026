import { Router } from "express";
import {
  getPublicUserProfile,
  savePublicUserProfile,
  getUserStyle,
  saveUserStyle,
} from "../controllers/userController";

const router = Router();

router.get("/:auth0Id/public", getPublicUserProfile);
router.put("/:auth0Id/public", savePublicUserProfile);
router.get("/:auth0Id/style", getUserStyle);
router.put("/:auth0Id/style", saveUserStyle);

export default router;
