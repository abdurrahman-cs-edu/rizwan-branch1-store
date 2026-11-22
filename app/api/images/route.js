// Photo upload and delete for the admin panel, stored in Cloudflare R2 instead of Supabase Storage.
// Only a signed-in admin can use it. The R2 keys stay on the server (Vercel environment variables):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL (the public address of the bucket)
// Until all five are set this answers 501 and the admin panel keeps using Supabase Storage as before.

import { signRequest } from "@/lib/sigv4";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4_000_000; // photos are shrunk to well under 1 MB in the browser; Vercel allows about 4.5 MB per request
const TYPES = ["image/webp", "image/png", "image/jpeg"];
// folder/file.webp, with at most 3 folders: lower case letters, digits, dot, dash, underscore
const KEY = /^[a-z0-9][a-z0-9._-]{0,80}(?:\/[a-z0-9][a-z0-9._-]{0,80}){0,3}\.(?:webp|png|jpe?g)$/;

function config() {
  const { R2_ACCOUNT_ID: account, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET: bucket, R2_PUBLIC_URL: publicUrl } = process.env;
  if (!account || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { host: `${account}.r2.cloudflarestorage.com`, accessKeyId, secretAccessKey, bucket, publicUrl: publicUrl.replace(/\/+$/, "") };
}

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Asks Supabase whether the signed-in user is an admin (the same check the admin panel uses)
async function isAdmin(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/is_admin`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    return res.ok && (await res.json()) === true;
  } catch {
    return false;
  }
}

function r2Fetch(cfg, method, key, { headers = {}, body = "" } = {}) {
  const path = `/${cfg.bucket}/${key}`;
  const signed = signRequest({ method, host: cfg.host, path, headers, body, accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey });
  return fetch(`https://${cfg.host}${path.split("/").map(encodeURIComponent).join("/")}`, { method, headers: signed, body: method === "PUT" ? body : undefined });
}

// Upload one photo. The browser sends the file as the body, with the header x-image-path: folder/name.webp
export async function POST(request) {
  const cfg = config();
  if (!cfg) return json({ error: "not-configured" }, 501);
  if (!(await isAdmin(request))) return json({ error: "not-allowed" }, 401);

  const key = request.headers.get("x-image-path") || "";
  const type = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!KEY.test(key) || !TYPES.includes(type)) return json({ error: "bad-request" }, 400);

  const body = Buffer.from(await request.arrayBuffer());
  if (body.length === 0) return json({ error: "empty" }, 400);
  if (body.length > MAX_BYTES) return json({ error: "too-big" }, 413);

  const res = await r2Fetch(cfg, "PUT", key, { headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" }, body });
  if (!res.ok) {
    console.error("R2 upload failed", res.status);
    return json({ error: "upload-failed" }, 502);
  }
  return json({ url: `${cfg.publicUrl}/${key}` });
}

// Delete photos. Body: { urls: [...] }. Only addresses inside our own R2 public address are touched.
export async function DELETE(request) {
  const cfg = config();
  if (!cfg) return json({ error: "not-configured" }, 501);
  if (!(await isAdmin(request))) return json({ error: "not-allowed" }, 401);

  let urls = [];
  try {
    urls = (await request.json()).urls;
  } catch {}
  if (!Array.isArray(urls) || urls.length > 40) return json({ error: "bad-request" }, 400);

  let deleted = 0;
  let skipped = 0;
  for (const u of urls) {
    const prefix = cfg.publicUrl + "/";
    if (typeof u !== "string" || !u.startsWith(prefix)) {
      skipped++;
      continue;
    }
    let key = "";
    try {
      key = decodeURIComponent(u.slice(prefix.length));
    } catch {}
    if (!KEY.test(key)) {
      skipped++;
      continue;
    }
    const res = await r2Fetch(cfg, "DELETE", key);
    if (res.ok || res.status === 404) deleted++;
    else {
      console.error("R2 delete failed", res.status);
      skipped++;
    }
  }
  return json({ deleted, skipped });
}
