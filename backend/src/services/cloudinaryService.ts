import cloudinary from "../config/cloudinary";
import { CloudinaryUploadResult } from "../types";

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

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "clothesrent",
        resource_type: "image",
        categorization: "imagga_tagging",
        auto_tagging: 0.6,
        // AI background removal applied at upload time
        background_removal: "cloudinary_ai",
        // Eager transformations — pre-generate optimized + smart-cropped variant
        eager: [
          {
            crop: "fill",
            gravity: "auto",
            width: 400,
            height: 533,
            quality: "auto",
            fetch_format: "auto",
          },
        ],
        eager_async: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            error || new Error("Cloudinary upload returned no result"),
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          tags: result.tags ?? [],
        });
      },
    );
    stream.end(fileBuffer);
  });
}
