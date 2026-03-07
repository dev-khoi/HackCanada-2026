import { Router } from "express";
import { generateOutfitHandler } from "../controllers/outfitController";

const router = Router();

router.post("/generate", generateOutfitHandler);

export default router;
