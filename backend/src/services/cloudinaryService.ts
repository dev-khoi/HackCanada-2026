import cloudinary from "../config/cloudinary";
import { CloudinaryUploadResult } from "../types";
import { extractImageTags } from "./geminiService";

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];

export async function uploadImage(
  fileBuffer: Buffer,
  originalName: string,
): Promise<CloudinaryUploadResult> {
  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_FORMATS.includes(ext)) {
    throw new Error(
      `Invalid image format "${ext}". Allowed: ${ALLOWED_FORMATS.join(", ")}`,
    );
  }

  // Determine MIME type from extension
  const mimeTypeMap: { [key: string]: string } = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const mimeType = mimeTypeMap[ext] || "image/jpeg";

  // Upload to Cloudinary
  let cloudinaryUrl = "";
  let cloudinaryPublicId = "";
  let cloudinaryTags: string[] = [];

  await new Promise<void>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "clothesrent",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            error || new Error("Cloudinary upload returned no result"),
          );
        }
        cloudinaryUrl = result.secure_url;
        cloudinaryPublicId = result.public_id;
        // Cloudinary tags from their API (if enabled)
        cloudinaryTags = result.tags ?? [];
        resolve();
      },
    );
    stream.end(fileBuffer);
  });

  // Extract tags using Gemini AI
  let geminiTags: string[] = [];
  try {
    geminiTags = await extractImageTags(fileBuffer, mimeType);
    console.log("Gemini extracted tags:", geminiTags);
  } catch (geminiError) {
    // Log the error but don't fail the upload - Gemini tag extraction is optional
    console.error("Gemini tag extraction failed:", geminiError);
  }

  // Merge tags: Gemini tags + Cloudinary tags, remove duplicates
  const allTags = [...new Set([...geminiTags, ...cloudinaryTags])];

  return {
    url: cloudinaryUrl,
    publicId: cloudinaryPublicId,
    tags: allTags,
  };
}
