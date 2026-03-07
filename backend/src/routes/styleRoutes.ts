import { Router } from "express";
import {
  analyzeStyleFromImages,
  searchListingsByStyle,
  recommendFromDescriptions,
} from "../controllers/styleController";

const router = Router();

router.post("/analyze", analyzeStyleFromImages);
router.post("/recommend", recommendFromDescriptions);
router.post("/search", searchListingsByStyle);

export default router;
