export const BUCKET = "product-images";

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Public URL -> path inside the bucket (so the file can be deleted)
export function storagePathFromUrl(url) {
  const marker = `/object/public/${BUCKET}/`;
  const i = String(url).indexOf(marker);
  if (i < 0) return null;
  return decodeURIComponent(String(url).slice(i + marker.length));
}

// Shrinks a photo in the browser before upload (max 1400px, WebP).
export async function resizeImage(file, maxSize = 1400, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Could not process this image.");
  const ext = blob.type === "image/webp" ? "webp" : "png";
  return { blob, ext, contentType: blob.type };
}

// "03001234567" -> "923001234567" for wa.me links
export function waNumber(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  return d.startsWith("0") ? "92" + d.slice(1) : d;
}
