/**
 * Pure client/isomorphic frame utility functions.
 * Does not import 'fs' or 'path' so it is safe to use in Client Components.
 */

/**
 * Returns the formatted public URL for a given 1-based frame index.
 * Defaults to WebP format for lossless-feel high-efficiency compression,
 * with fallback support to jpg if needed.
 * e.g., 1 -> "/frames/frame_0001.webp"
 */
export function getFrameUrl(frameIndex: number, extension: "webp" | "jpg" = "webp"): string {
  const padded = String(frameIndex).padStart(4, "0");
  return `/frames/frame_${padded}.${extension}`;
}
