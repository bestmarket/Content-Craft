/**
 * Cloudflare R2 Storage Service
 * Uses the S3-compatible API via @aws-sdk/client-s3
 *
 * Credentials are read exclusively from environment variables:
 *   CLOUDFLARE_R2_ACCOUNT_ID
 *   CLOUDFLARE_R2_ACCESS_KEY_ID
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET_NAME
 *   CLOUDFLARE_R2_PUBLIC_DOMAIN
 *
 * These are set as Replit Secrets and automatically available on Vercel
 * when added to the project's environment variables there.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

export function getR2Config(): R2Config | null {
  const {
    CLOUDFLARE_R2_ACCOUNT_ID: accountId,
    CLOUDFLARE_R2_ACCESS_KEY_ID: accessKeyId,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: secretAccessKey,
    CLOUDFLARE_R2_BUCKET_NAME: bucketName,
    CLOUDFLARE_R2_PUBLIC_DOMAIN: publicDomain,
  } = process.env;

  if (accountId && accessKeyId && secretAccessKey && bucketName && publicDomain) {
    return { accountId, accessKeyId, secretAccessKey, bucketName, publicDomain };
  }

  return null;
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

// Cache the S3 client so we don't re-create it on every call
let _cachedClient: { client: S3Client; accountId: string } | null = null;

function getS3Client(): { client: S3Client; config: R2Config } {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      "Cloudflare R2 is not configured. Add the CLOUDFLARE_R2_* environment variables.",
    );
  }

  if (!_cachedClient || _cachedClient.accountId !== config.accountId) {
    _cachedClient = {
      client: new S3Client({
        region: "auto",
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: true,
      }),
      accountId: config.accountId,
    };
  }

  return { client: _cachedClient.client, config };
}

/** Call this if credentials change at runtime (e.g. env reload). */
export function invalidateR2ClientCache() {
  _cachedClient = null;
}

/**
 * Upload a file buffer to Cloudflare R2.
 */
export async function uploadFileToR2(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const { client, config } = getS3Client();

  const params: PutObjectCommandInput = {
    Bucket: config.bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  await client.send(new PutObjectCommand(params));
  return buildPublicUrl(config.publicDomain, fileName);
}

/**
 * Upload a base64 data URI to R2.
 * Returns the public CDN URL, or null if R2 is not configured or upload fails.
 */
export async function uploadBase64ToR2(
  dataUri: string,
  folder: string,
  fallbackExt = "bin",
): Promise<string | null> {
  try {
    const config = getR2Config();
    if (!config) return null;

    let mimeType = "application/octet-stream";
    let base64Data = dataUri;

    const match = dataUri.match(/^data:([^;]+);base64,(.+)$/s);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const ext = mimeToExt(mimeType) || fallbackExt;
    const key = `${folder}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(base64Data, "base64");

    return await uploadFileToR2(buffer, key, mimeType);
  } catch (err) {
    console.error("[R2] uploadBase64ToR2 failed:", err);
    return null;
  }
}

/**
 * Try to upload a buffer to R2; returns the public URL or null on any failure.
 * Silently swallows errors — callers can fall back to streaming.
 */
export async function tryUploadBufferToR2(
  buffer: Buffer,
  folder: string,
  ext: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const config = getR2Config();
    if (!config) return null;
    const key = `${folder}/${randomUUID()}.${ext}`;
    return await uploadFileToR2(buffer, key, mimeType);
  } catch (err) {
    console.error("[R2] tryUploadBufferToR2 failed:", err);
    return null;
  }
}

/**
 * Delete an object from R2 by its key.
 */
export async function deleteFileFromR2(fileName: string): Promise<void> {
  const { client, config } = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: fileName }));
}

/**
 * Build the public CDN URL for a stored object.
 */
export function getPublicUrl(fileName: string): string {
  const config = getR2Config();
  if (!config) throw new Error("R2 not configured");
  return buildPublicUrl(config.publicDomain, fileName);
}

function buildPublicUrl(publicDomain: string, fileName: string): string {
  const domain = publicDomain.replace(/\/$/, "");
  const key = fileName.startsWith("/") ? fileName.slice(1) : fileName;
  return `${domain}/${key}`;
}

/** Map common MIME types to file extensions. */
function mimeToExt(mime: string): string | null {
  const map: Record<string, string> = {
    "image/png":       "png",
    "image/jpeg":      "jpg",
    "image/jpg":       "jpg",
    "image/webp":      "webp",
    "image/gif":       "gif",
    "image/svg+xml":   "svg",
    "video/mp4":       "mp4",
    "video/webm":      "webm",
    "audio/wav":       "wav",
    "audio/mpeg":      "mp3",
    "audio/mp3":       "mp3",
    "audio/ogg":       "ogg",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/epub+zip": "epub",
  };
  return map[mime] ?? null;
}
