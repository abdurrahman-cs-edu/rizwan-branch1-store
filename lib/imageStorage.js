// Photo upload and delete for the admin panel.
// Photos go to Cloudflare R2 through /api/images (admin only). Until R2 is set up on the server (it answers 501),
// everything falls back to Supabase Storage exactly as before. Photos already stored in Supabase keep working
// and are still deleted from Supabase.

import { supabase } from "@/lib/supabase";
import { BUCKET, storagePathFromUrl } from "@/lib/adminHelpers";

let r2Off = false; // set once the server says R2 is not set up

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ""}` };
}

// Uploads one photo (path like "folder/name.webp") and returns its public address.
export async function uploadImage(path, blob, contentType) {
  if (!r2Off) {
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { ...(await authHeader()), "Content-Type": contentType, "x-image-path": path },
      body: blob,
    });
    if (res.ok) return (await res.json()).url;
    if (res.status === 501) r2Off = true;
    else {
      let code = "";
      try {
        code = (await res.json()).code || "";
      } catch {}
      throw new Error(`Photo upload failed (${res.status}${code ? ": " + code : ""})`);
    }
  }
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Deletes the photo files behind these public addresses (wherever they are stored). Never throws.
export async function removeImages(urls) {
  const list = (urls || []).filter(Boolean);
  const inSupabase = list.map(storagePathFromUrl).filter(Boolean);
  const others = list.filter((u) => !storagePathFromUrl(u));
  try {
    if (inSupabase.length) await supabase.storage.from(BUCKET).remove(inSupabase);
    if (others.length && !r2Off) {
      await fetch("/api/images", {
        method: "DELETE",
        headers: { ...(await authHeader()), "Content-Type": "application/json" },
        body: JSON.stringify({ urls: others }),
      });
    }
  } catch {}
}
