import { Request, Response } from "express";
import User from "../models/User";

/**
 * GET /api/users/:auth0Id/style
 * Returns the user's styleProfileJSON (prompt + descriptions).
 */
export const getUserStyle = async (req: Request, res: Response) => {
  try {
    const { auth0Id } = req.params;
    const user = await User.findOne({ auth0Id }).lean();

    if (!user) {
      res.json({ prompt: "", descriptions: [] });
      return;
    }

    const style = (user.styleProfileJSON as any) ?? {};
    res.json({
      prompt: style.prompt ?? "",
      descriptions: style.descriptions ?? [],
    });
  } catch (error: any) {
    console.error("getUserStyle error:", error?.message || error);
    res.status(500).json({ error: "Failed to load style profile" });
  }
};

/**
 * PUT /api/users/:auth0Id/style
 * Upserts the user's styleProfileJSON.
 * Body: { prompt?: string, descriptions?: string[] }
 */
export const saveUserStyle = async (req: Request, res: Response) => {
  try {
    const { auth0Id } = req.params;
    const { prompt, descriptions } = req.body as {
      prompt?: string;
      descriptions?: string[];
    };

    const styleProfileJSON: Record<string, unknown> = {};
    if (prompt !== undefined) styleProfileJSON.prompt = prompt;
    if (descriptions !== undefined) styleProfileJSON.descriptions = descriptions;

    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: { styleProfileJSON } },
      { upsert: true, new: true }
    ).lean();

    res.json({
      prompt: (user.styleProfileJSON as any)?.prompt ?? "",
      descriptions: (user.styleProfileJSON as any)?.descriptions ?? [],
    });
  } catch (error: any) {
    console.error("saveUserStyle error:", error?.message || error);
    res.status(500).json({ error: "Failed to save style profile" });
  }
};
