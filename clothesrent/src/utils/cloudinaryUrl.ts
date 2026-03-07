/**
 * Cloudinary URL transformation utility.
 *
 * Inserts transformation params into an existing Cloudinary `secure_url`.
 * URL pattern: .../image/upload/{transformations}/v{ver}/{publicId}.{ext}
 */

const UPLOAD_SEGMENT = "/image/upload/";

/** Insert transformation string into a Cloudinary URL */
function insertTransform(url: string, transform: string): string {
  const idx = url.indexOf(UPLOAD_SEGMENT);
  if (idx === -1) return url; // not a Cloudinary URL — return as-is
  const insertAt = idx + UPLOAD_SEGMENT.length;
  return url.slice(0, insertAt) + transform + "/" + url.slice(insertAt);
}

/** Chain multiple transformation groups (each separated by /) */
function chainTransforms(url: string, transforms: string[]): string {
  const filtered = transforms.filter(Boolean);
  if (filtered.length === 0) return url;
  return insertTransform(url, filtered.join("/"));
}

// ---------------------------------------------------------------------------
// Individual transformation builders
// ---------------------------------------------------------------------------

/** Auto quality + auto format — free on all Cloudinary plans */
export function optimizeUrl(url: string): string {
  return insertTransform(url, "q_auto,f_auto");
}

/** Smart crop to exact dimensions with automatic subject-aware gravity */
export function smartCropUrl(url: string, w: number, h: number): string {
  return insertTransform(url, `c_fill,g_auto,w_${w},h_${h},q_auto,f_auto`);
}

/** AI background removal (requires Cloudinary AI Background Removal add-on) */
export function removeBgUrl(url: string): string {
  return insertTransform(url, "e_background_removal");
}

/** Replace background with AI-generated scene (requires Generative AI add-on) */
export function replaceBgUrl(url: string, prompt: string): string {
  const encoded = encodeURIComponent(prompt).replace(/%20/g, " ");
  return insertTransform(url, `e_gen_background_replace:prompt_${encoded}`);
}

/** Add a text badge overlay — top-right corner */
export function addBadge(
  url: string,
  text: string,
  bgColor = "e74c3c",
  textColor = "white"
): string {
  const encoded = text.replace(/ /g, "%20");
  return insertTransform(
    url,
    `l_text:Arial_16_bold:${encoded},co_${textColor},b_rgb:${bgColor},bo_4px_solid_rgb:${bgColor},g_north_east,x_8,y_8`
  );
}

// ---------------------------------------------------------------------------
// Composite display URL builder
// ---------------------------------------------------------------------------

export interface DisplayUrlOptions {
  width?: number;
  height?: number;
  removeBg?: boolean;
  replaceBg?: string;        // prompt for AI background replacement
  badge?: string;            // text to overlay, e.g. "NEW", "SALE"
  badgeColor?: string;       // hex without #, default "e74c3c" (red)
}

/**
 * Build a fully-transformed display URL combining:
 *   1. Background removal or replacement (if requested)
 *   2. Smart crop to target dimensions
 *   3. Auto quality + format optimization
 *   4. Conditional badge overlay
 */
export function buildDisplayUrl(
  url: string,
  opts: DisplayUrlOptions = {}
): string {
  const {
    width = 400,
    height = 533,
    removeBg = false,
    replaceBg,
    badge,
    badgeColor = "e74c3c",
  } = opts;

  const transforms: string[] = [];

  // AI background operations (chained as separate transform groups)
  if (replaceBg) {
    const encoded = encodeURIComponent(replaceBg).replace(/%20/g, " ");
    transforms.push(`e_gen_background_replace:prompt_${encoded}`);
  } else if (removeBg) {
    transforms.push("e_background_removal");
  }

  // Smart crop + optimization
  transforms.push(`c_fill,g_auto,w_${width},h_${height},q_auto,f_auto`);

  // Conditional badge overlay
  if (badge) {
    const encoded = badge.replace(/ /g, "%20");
    transforms.push(
      `l_text:Arial_16_bold:${encoded},co_white,b_rgb:${badgeColor},bo_4px_solid_rgb:${badgeColor},g_north_east,x_8,y_8`
    );
  }

  return chainTransforms(url, transforms);
}

/** Thumbnail for table views */
export function thumbnailUrl(url: string, size = 64): string {
  return insertTransform(url, `c_fill,g_auto,w_${size},h_${size},q_auto,f_auto`);
}
