import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import UserItemSell from "../models/UserItemSell";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const VALID_SLOTS = [
    "top",
    "bottom",
    "shoes",
    "outerwear",
    "dress",
    "accessory",
    "bag",
    "hat",
    "fullbody",
];

/**
 * Tag-based fallback for slot assignment when Gemini is unavailable.
 */
function getSlotFromTags(tags: string[]): string {
    const lower = tags.map((t) => t.toLowerCase());
    if (lower.some((t) => ["shoe", "shoes", "sneaker", "sneakers", "boot", "boots", "sandal", "sandals", "heels"].includes(t))) return "shoes";
    if (lower.some((t) => ["jacket", "coat", "outerwear", "blazer", "parka", "hoodie"].includes(t))) return "outerwear";
    if (lower.some((t) => ["dress", "gown", "romper", "jumpsuit"].includes(t))) return "dress";
    if (lower.some((t) => ["pants", "jeans", "shorts", "bottom", "trousers", "skirt", "leggings"].includes(t))) return "bottom";
    if (lower.some((t) => ["top", "shirt", "tee", "t-shirt", "blouse", "sweater", "tank", "polo", "crop"].includes(t))) return "top";
    if (lower.some((t) => ["hat", "cap", "beanie", "beret", "headwear"].includes(t))) return "hat";
    if (lower.some((t) => ["bag", "purse", "backpack", "tote", "clutch", "handbag"].includes(t))) return "bag";
    if (lower.some((t) => ["accessory", "scarf", "belt", "jewelry", "necklace", "bracelet", "watch", "sunglasses", "glasses", "ring", "earring"].includes(t))) return "accessory";
    return "fullbody";
}

/**
 * POST /api/outfit/generate
 * Body: { prompt: string }
 *
 * Uses Gemini to pick one item per outfit slot from all live listings,
 * ensuring no duplicate categories (e.g. no two hats).
 */
export const generateOutfitHandler = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body as { prompt?: string };
        if (!prompt?.trim()) {
            res.status(400).json({ error: "prompt is required" });
            return;
        }

        // Fetch all live listings
        const allListings = await UserItemSell.find({ status: "Live" }).lean();
        if (allListings.length === 0) {
            res.json({ items: [], stylistNote: "No listings available yet." });
            return;
        }

        // Build a compact catalog for the Gemini prompt
        const catalog = allListings.map((l: any) => ({
            id: l._id.toString(),
            title: l.title,
            description: l.description,
            tags: l.tags || [],
            price: l.price,
            dailyRate: l.dailyRate || 0,
        }));

        const catalogStr = catalog
            .map((c) => `ID:${c.id} | "${c.title}" | tags:[${c.tags.join(",")}] | $${c.price}`)
            .join("\n");

        // Ask Gemini to build a coherent outfit
        const geminiPrompt =
            `You are a fashion stylist AI. A user wants an outfit for: "${prompt.trim()}"\n\n` +
            `Here are the available clothing items:\n${catalogStr}\n\n` +
            `Build a coherent outfit by selecting ONE item per slot. ` +
            `Valid slots: ${VALID_SLOTS.join(", ")}.\n` +
            `Rules:\n` +
            `- Pick at most ONE item per slot (no duplicates — e.g. never two hats or two tops).\n` +
            `- Only include slots that make sense for the requested look.\n` +
            `- Use the item tags and titles to determine which slot each item belongs to.\n` +
            `- Write a short stylist note (1-2 sentences) explaining the look.\n\n` +
            `Return ONLY valid JSON in this exact format, no extra text:\n` +
            `{\n` +
            `  "selections": [\n` +
            `    { "id": "<listing_id>", "slot": "<slot>", "reason": "<why this item fits>" }\n` +
            `  ],\n` +
            `  "stylistNote": "<your note>"\n` +
            `}`;

        let selections: Array<{ id: string; slot: string; reason: string }> = [];
        let stylistNote = "";

        try {
            const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
            const result = await model.generateContent(geminiPrompt);
            const text = result.response.text().trim();

            // Parse JSON from Gemini response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                selections = parsed.selections || [];
                stylistNote = parsed.stylistNote || "";
            }
        } catch (geminiErr: any) {
            console.error("Gemini outfit generation failed, using tag fallback:", geminiErr?.message);
        }

        // If Gemini didn't produce results, use tag-based fallback
        if (selections.length === 0) {
            const slotMap = new Map<string, any>();

            for (const listing of allListings) {
                const slot = getSlotFromTags((listing as any).tags || []);
                if (!slotMap.has(slot)) {
                    slotMap.set(slot, {
                        id: (listing as any)._id.toString(),
                        slot,
                        reason: `Matched to "${prompt.trim()}"`,
                    });
                }
            }

            selections = Array.from(slotMap.values()).slice(0, 6);
            stylistNote = `Here's a look built from items matching "${prompt.trim()}."`;
        }

        // De-duplicate by slot (Gemini should already do this, but enforce it)
        const seenSlots = new Set<string>();
        const dedupedSelections = selections.filter((s) => {
            const slot = VALID_SLOTS.includes(s.slot) ? s.slot : "accessory";
            if (seenSlots.has(slot)) return false;
            seenSlots.add(slot);
            return true;
        });

        // Map selections back to full listing data
        const listingMap = new Map(
            allListings.map((l: any) => [l._id.toString(), l])
        );

        const items = dedupedSelections
            .map((sel) => {
                const listing = listingMap.get(sel.id);
                if (!listing) return null;
                return {
                    listingId: sel.id,
                    listing,
                    slot: VALID_SLOTS.includes(sel.slot) ? sel.slot : "accessory",
                    reason: sel.reason,
                };
            })
            .filter(Boolean);

        res.json({ items, stylistNote });
    } catch (error: any) {
        console.error("Outfit generation error:", error?.message || error);
        res.status(500).json({ error: "Outfit generation failed" });
    }
};
