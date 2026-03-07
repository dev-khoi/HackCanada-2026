import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * Accepts an array of base64-encoded images (data-URI or raw base64).
 * Returns a descriptions array – one short clothing description per image.
 */
export async function analyzeStyle(
  images: string[],
): Promise<{ descriptions: string[] }> {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
  });
  const imageParts = images.map((img) => {
    // Support both "data:image/png;base64,AAA…" and raw base64
    const [meta, data] = img.includes(",") ? img.split(",", 2) : ["", img];
    const mimeMatch = meta.match(/data:(image\/\w+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    return { inlineData: { data: data as string, mimeType } };
  });

  const prompt =
    "You are a fashion expert. For each image provided, write a concise one-sentence description of the clothing item shown (color, type, style, notable features). " +
    "Return ONLY a valid JSON array of strings, one description per image, in the same order as the images. No extra text.";

  const result = await model.generateContent([prompt, ...imageParts]);
  const text = result.response.text().trim();

  // Parse the JSON array from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Gemini did not return a valid JSON array");
  }

  const descriptions: string[] = JSON.parse(jsonMatch[0]);
  console.log(descriptions);
  return { descriptions };
}

/**
 * Analyzes a single image (as base64 or Buffer) and extracts relevant clothing/fashion tags.
 * Used during image upload to auto-generate searchable tags.
 */
export async function extractImageTags(
  imageData: string | Buffer,
  mimeType: string = "image/jpeg",
): Promise<string[]> {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",
  });

  // Convert Buffer to base64 if needed
  const base64Data: string =
    imageData instanceof Buffer
      ? imageData.toString("base64")
      : (imageData as string);

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  const prompt =
    "You are an expert fashion analyst. Analyze this clothing image and extract 5-8 relevant searchable tags. " +
    "Tags should include: item type (e.g., 'blazer', 'trousers', 'dress'), color(s), style/aesthetic (e.g., 'minimalist', 'vintage', 'casual'), " +
    "material hints if visible (e.g., 'wool', 'linen', 'silk'), and any notable features. " +
    'Return ONLY a valid JSON array of lowercase tags (strings), no other text. Example: ["blazer", "navy", "wool", "minimalist", "tailored"]';

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text().trim();

  // Parse the JSON array from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("Gemini tag extraction failed. Response:", text);
    throw new Error("Gemini did not return a valid JSON array of tags");
  }

  const tags: string[] = JSON.parse(jsonMatch[0]);
  // Ensure all tags are lowercase and strings
  return tags.map((tag) => String(tag).toLowerCase());
}
