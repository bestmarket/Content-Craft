import { Router } from "express";
import { requireAdmin } from "./auth";
import {
  getR2Config,
  uploadFileToR2,
  deleteFileFromR2,
  isR2Configured,
} from "../lib/r2Storage";
import {
  S3Client,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const FOLDERS = ["images", "hero-images", "thumbnails", "cover-images", "author-images", "videos", "audio", "uploads", "pdfs"];

function getAdminS3(): { client: S3Client; config: NonNullable<ReturnType<typeof getR2Config>> } {
  const config = getR2Config();
  if (!config) throw new Error("R2 not configured — add CLOUDFLARE_R2_* environment variables.");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true,
  });
  return { client, config };
}

function mimeLabel(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return "other";
}

function extToMime(ext: string): string {
  const m: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    wav: "audio/wav", mp3: "audio/mpeg", ogg: "audio/ogg",
    pdf: "application/pdf", zip: "application/zip",
  };
  return m[ext.toLowerCase()] ?? "application/octet-stream";
}

function extractR2Error(err: any): string {
  if (!err) return "Unknown error";
  const raw: string = err.message ?? err.Message ?? "";
  const code = err.Code ?? err.code ?? err.name ?? "";

  if (raw.includes("EPROTO") || raw.toLowerCase().includes("ssl") || raw.toLowerCase().includes("tls") || raw.includes("handshake")) {
    return "SSL handshake failed — your Account ID is likely wrong. Copy the 32-character hex ID from the right sidebar at dash.cloudflare.com.";
  }
  if (raw.includes("ENOTFOUND") || raw.includes("ECONNREFUSED")) {
    return "Could not reach Cloudflare — check your Account ID and internet connection.";
  }
  if (code === "InvalidAccessKeyId" || code === "SignatureDoesNotMatch") {
    return `${code}: Your Access Key ID or Secret Access Key is incorrect.`;
  }
  if (code === "NoSuchBucket") {
    return "NoSuchBucket: The bucket name does not exist in your Cloudflare account.";
  }
  if (code === "AccessDenied" || code === "Forbidden") {
    return "AccessDenied: Your API token does not have read/write permission on this bucket.";
  }
  if (code && raw && code !== raw) return `${code}: ${raw}`;
  if (raw) return raw;
  if (code) return code;
  if (err.$metadata?.httpStatusCode) return `HTTP ${err.$metadata.httpStatusCode} — check your credentials`;
  try { return JSON.stringify(err); } catch { return "Unknown error"; }
}

// ── GET /api/admin/r2/status ─────────────────────────────────────────────────
router.get("/admin/r2/status", requireAdmin, async (_req, res) => {
  if (!isR2Configured()) {
    res.json({ configured: false, connected: false, error: "CLOUDFLARE_R2_* environment variables are not set." });
    return;
  }
  try {
    const { client, config } = getAdminS3();
    const cmd = new ListObjectsV2Command({ Bucket: config.bucketName, MaxKeys: 1 });
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Connection timed out (8s) — check Account ID and bucket name")), 8000)
    );
    await Promise.race([client.send(cmd), timeout]);
    res.json({
      configured: true,
      connected: true,
      bucketName: config.bucketName,
      publicDomain: config.publicDomain,
      accountId: config.accountId.slice(0, 8) + "…",
    });
  } catch (err: any) {
    res.json({ configured: true, connected: false, error: extractR2Error(err) });
  }
});

// ── GET /api/admin/r2/stats ──────────────────────────────────────────────────
router.get("/admin/r2/stats", requireAdmin, async (_req, res) => {
  if (!isR2Configured()) { res.json({ totalFiles: 0, totalBytes: 0, byFolder: {} }); return; }
  try {
    const { client, config } = getAdminS3();
    const byFolder: Record<string, { count: number; bytes: number }> = {};
    let totalFiles = 0;
    let totalBytes = 0;

    for (const folder of FOLDERS) {
      byFolder[folder] = { count: 0, bytes: 0 };
      let token: string | undefined;
      do {
        const cmd = new ListObjectsV2Command({
          Bucket: config.bucketName,
          Prefix: `${folder}/`,
          ContinuationToken: token,
          MaxKeys: 1000,
        });
        const out = await client.send(cmd);
        for (const obj of out.Contents ?? []) {
          byFolder[folder].count++;
          byFolder[folder].bytes += obj.Size ?? 0;
          totalFiles++;
          totalBytes += obj.Size ?? 0;
        }
        token = out.IsTruncated ? out.NextContinuationToken : undefined;
      } while (token);
    }

    res.json({ totalFiles, totalBytes, byFolder });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/r2/files ──────────────────────────────────────────────────
router.get("/admin/r2/files", requireAdmin, async (req, res) => {
  if (!isR2Configured()) { res.json({ files: [], nextCursor: null }); return; }
  try {
    const { client, config } = getAdminS3();
    const folder = (req.query.folder as string) || "";
    const limit = Math.min(parseInt((req.query.limit as string) || "48", 10), 200);
    const cursor = (req.query.cursor as string) || undefined;

    const cmd = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: folder ? `${folder}/` : undefined,
      MaxKeys: limit,
      ContinuationToken: cursor,
    });
    const out = await client.send(cmd);

    const domain = config.publicDomain.replace(/\/$/, "");
    const files = (out.Contents ?? [])
      .filter(obj => obj.Key && !obj.Key.endsWith("/"))
      .map(obj => {
        const key = obj.Key!;
        const ext = key.split(".").pop() ?? "";
        const mime = extToMime(ext);
        return {
          key,
          url: `${domain}/${key}`,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString() ?? null,
          mime,
          type: mimeLabel(mime),
          folder: key.split("/")[0] ?? "root",
          name: key.split("/").pop() ?? key,
        };
      });

    res.json({
      files,
      nextCursor: out.IsTruncated ? out.NextContinuationToken : null,
      total: out.KeyCount ?? files.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/r2/file ────────────────────────────────────────────────
router.delete("/admin/r2/file", requireAdmin, async (req, res) => {
  const { key } = req.body;
  if (!key) { res.status(400).json({ error: "key is required" }); return; }
  try {
    await deleteFileFromR2(key);
    res.json({ deleted: true, key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/r2/upload ─────────────────────────────────────────────────
// Accepts images, video, audio, PDF — all file types, up to 500 MB
router.post("/admin/r2/upload", requireAdmin, upload.array("files", 20), async (req, res) => {
  if (!isR2Configured()) { res.status(503).json({ error: "R2 not configured — add CLOUDFLARE_R2_* environment variables." }); return; }
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) { res.status(400).json({ error: "No files provided" }); return; }

  const folder = (req.body.folder as string) || "uploads";
  const { randomUUID } = await import("crypto");
  const results: any[] = [];

  for (const file of files) {
    const ext = file.originalname.split(".").pop() ?? "bin";
    const key = `${folder}/${randomUUID()}.${ext}`;
    try {
      const url = await uploadFileToR2(file.buffer, key, file.mimetype);
      results.push({ key, url, name: file.originalname, size: file.size, mime: file.mimetype, type: mimeLabel(file.mimetype) });
    } catch (err: any) {
      results.push({ error: extractR2Error(err), name: file.originalname });
    }
  }

  res.json({ uploaded: results.filter(r => !r.error), failed: results.filter(r => r.error) });
});

export default router;
