// Signs a request for an S3-compatible service (Cloudflare R2) with AWS Signature Version 4.
// Server only. Uses Node's built-in crypto, so no extra package is needed.

import { createHash, createHmac } from "node:crypto";

const sha256hex = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
const encodeSegment = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

// Returns the headers to send with the request (the Authorization header included; "host" is added by fetch itself).
//   method: "PUT" | "DELETE" | "GET" ...   host: "<account>.r2.cloudflarestorage.com"   path: "/bucket/folder/file.webp"
//   headers: extra headers to sign, for example { "content-type": "image/webp" }   body: string or Buffer
export function signRequest({ method, host, path, headers = {}, body = "", accessKeyId, secretAccessKey, region = "auto", service = "s3", now = new Date() }) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20130524T000000Z
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256hex(body);

  const all = { ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])) };
  all.host = host;
  all["x-amz-content-sha256"] = payloadHash;
  all["x-amz-date"] = amzDate;

  const names = Object.keys(all).sort();
  const canonicalHeaders = names.map((n) => `${n}:${all[n]}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalUri = path.split("/").map(encodeSegment).join("/");
  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256hex(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac("AWS4" + secretAccessKey, date), region), service), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const out = { ...all };
  delete out.host;
  out.authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return out;
}
