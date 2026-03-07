import { Request, Response } from "express";
import { analyzeStyle } from "../services/geminiService";
import { searchByStyle, recommendListings } from "../services/backboardService";
import UserItemSell from "../models/UserItemSell";
import User from "../models/User";

async function attachProfileNames<T extends { sellerId?: string; sellerName?: string }>(
  listings: T[]
): Promise<Array<T & { sellerName: string }>> {
  const sellerIds = Array.from(
    new Set(
      listings
        .map((listing) => listing.sellerId?.trim() || "")
        .filter((id) => id.length > 0)
    )
  );

  if (!sellerIds.length) {
    return listings.map((listing) => ({
      ...listing,
      sellerName: listing.sellerName?.trim() || listing.sellerId?.trim() || "",
    }));
  }

  const users = await User.find({ auth0Id: { $in: sellerIds } })
    .select({ auth0Id: 1, username: 1 })
    .lean();
  const namesById = new Map(users.map((user) => [user.auth0Id, user.username?.trim() || ""]));

  return listings.map((listing) => ({
    ...listing,
    sellerName:
      namesById.get(listing.sellerId?.trim() || "") ||
      listing.sellerName?.trim() ||
      listing.sellerId?.trim() ||
      "",
  }));
}

export const analyzeStyleFromImages = async (req: Request, res: Response) => {
  try {
    const { images } = req.body as { images: string[] };
    if (!images || !images.length) {
      res.status(400).json({ error: "images array is required" });
      return;
    }
    const result = await analyzeStyle(images);
    res.json(result); // { descriptions: string[] }
  } catch (error: any) {
    console.error("Style analysis error:", error?.message || error);
    res.status(500).json({ error: "Style analysis failed" });
  }
};

/**
 * POST /api/style/recommend
 * Body: { descriptions?: string[], prompt?: string }
 * Accepts either an array of Gemini descriptions or a raw text prompt.
 * Fetches all live listings, sends them + input to Backboard,
 * returns the best matching listings.
 */
export const recommendFromDescriptions = async (req: Request, res: Response) => {
  try {
    const { descriptions, prompt } = req.body as {
      descriptions?: string[];
      prompt?: string;
    };

    // Accept either descriptions array or a text prompt
    let descArray: string[];
    if (descriptions && descriptions.length > 0) {
      descArray = descriptions;
    } else if (prompt && prompt.trim()) {
      descArray = [prompt.trim()];
    } else {
      res.status(400).json({ error: "descriptions array or prompt string is required" });
      return;
    }

    // Fetch all live listings from MongoDB
    const allListings = await UserItemSell.find({ status: "Live" }).lean();

    const catalog = allListings.map((l: any) => ({
      _id: l._id.toString(),
      title: l.title,
      description: l.description,
      tags: l.tags || [],
    }));

    if (catalog.length === 0) {
      res.json({ recommendations: [] });
      return;
    }

    // Ask Backboard (or fallback) to pick the best matches
    const matchedIds = await recommendListings(descArray, catalog);

    // Fetch the full listing documents for the matched IDs
    const recommendations = await UserItemSell.find({
      _id: { $in: matchedIds },
    }).lean();

    // Preserve the ranked order from Backboard
    const idOrder = new Map(matchedIds.map((id, i) => [id, i]));
    recommendations.sort(
      (a: any, b: any) =>
        (idOrder.get(a._id.toString()) ?? 99) -
        (idOrder.get(b._id.toString()) ?? 99)
    );

    res.json({ recommendations });
  } catch (error: any) {
    console.error("Recommend error:", error?.message || error);
    res.status(500).json({ error: "Recommendation failed" });
  }
};

export const searchListingsByStyle = async (req: Request, res: Response) => {
  try {
    const { query } = req.body as { query: string };
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const listingIds = await searchByStyle(query);

    if (listingIds.length === 0) {
      const listings = await UserItemSell.find({
        status: "Live",
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      }).limit(20).lean();
      const listingsWithNames = await attachProfileNames(listings);
      res.json(listingsWithNames);
      return;
    }

    const listings = await UserItemSell.find({ _id: { $in: listingIds } }).lean();
    const listingsWithNames = await attachProfileNames(listings);
    res.json(listingsWithNames);
  } catch (error) {
    res.status(500).json({ error: "Style search failed" });
  }
};
