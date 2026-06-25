/**
 * Cloudflare R2 Upload Routes
 *
 * POST /api/products/upload-author-image   — author photo (max 10 MB)
 * POST /api/products/upload-cover-image    — book/product cover (max 10 MB)
 * POST /api/products/upload-file           — PDF / any binary asset (max 50 MB)
 *
 * All three routes accept multipart/form-data with:
 *   file      — the file itself (required)
 *   productId — (optional) product ID to update in the DB after upload.
 *               When provided and invalid/unowned the request returns 400/403.
 *
 * Memory safety:
 *   multer memoryStorage is used with per-route size caps. Files are buffered
 *   once in RAM, forwarded to R2, then released. For very large assets a
 *   presigned-URL flow would bypass the server entirely; this implementation
 *   is appropriate for typical author images, covers, and PDF ebooks.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import multer, { MulterError } from "multer";
import { nanoid } from "nanoid";
import path from "path";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth";
import { uploadFileToR2, isR2Configured } from "../lib/r2Storage";

const router = Router();

// ── Multer factory: in-memory, per-route size cap ────────────────────────────
function makeUpload(maxBytes: number) {
  return multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes } });
}

const imageUpload = makeUpload(10 * 1024 * 1024);   // 10 MB for images
const fileUpload  = makeUpload(200 * 1024 * 1024);  // 200 MB for documents / media / video

// ── Multer error handler: converts MulterError to a JSON 400/413 ─────────────
function multerErrorHandler(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: `Upload error: ${err.message}` });
    return;
  }
  next(err);
}

// ── Guard: reject all upload requests when R2 is not configured ──────────────
function requireR2(_req: Request, res: Response, next: NextFunction) {
  if (!isR2Configured()) {
    res.status(503).json({
      error: "File storage is not configured. Contact support.",
    });
    return;
  }
  next();
}

// ── Helper: derive a safe, collision-resistant object key ────────────────────
function buildKey(prefix: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || "";
  return `${prefix}/${nanoid(16)}${ext}`;
}

// ── Helper: validate and update a product column after upload ─────────────────
// Returns the resolved product URL on success, throws on any validation failure.
async function patchProduct(
  productId: string | undefined,
  userId: number,
  field: "authorPhotoUrl" | "coverImageUrl" | "uploadedFileUrl",
  url: string,
): Promise<{ attached: boolean }> {
  if (!productId) return { attached: false };

  const id = parseInt(productId, 10);
  if (isNaN(id) || id <= 0) {
    throw Object.assign(new Error("Invalid productId — must be a positive integer."), { status: 400 });
  }

  // Verify the product belongs to this user before touching it
  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(and(eq(productsTable.id, id), eq(productsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    throw Object.assign(
      new Error("Product not found or does not belong to you."),
      { status: 403 },
    );
  }

  const extra: Record<string, any> = { updatedAt: new Date() };
  if (field === "uploadedFileUrl") extra.isUploaded = true;

  await db
    .update(productsTable)
    .set({ [field]: url, ...extra })
    .where(eq(productsTable.id, id));

  return { attached: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products/upload-author-image
// Updates authorPhotoUrl on the product when a valid productId is provided
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/products/upload-author-image",
  requireAuth,
  requireR2,
  imageUpload.single("file"),
  multerErrorHandler,
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file received. Send the image as a multipart field named 'file'." });
        return;
      }

      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(req.file.mimetype)) {
        res.status(400).json({ error: `Unsupported image type '${req.file.mimetype}'. Allowed: JPEG, PNG, WEBP, GIF.` });
        return;
      }

      const key = buildKey("author-images", req.file.originalname);
      const url = await uploadFileToR2(req.file.buffer, key, req.file.mimetype);

      const { attached } = await patchProduct(req.body.productId, req.userId, "authorPhotoUrl", url);

      res.json({ url, key, field: "authorPhotoUrl", attached });
    } catch (err: any) {
      req.log.error({ err }, "upload-author-image error");
      res.status(err?.status ?? 500).json({ error: err?.message ?? "Author image upload failed" });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products/upload-cover-image
// Updates coverImageUrl on the product when a valid productId is provided
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/products/upload-cover-image",
  requireAuth,
  requireR2,
  imageUpload.single("file"),
  multerErrorHandler,
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file received. Send the image as a multipart field named 'file'." });
        return;
      }

      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(req.file.mimetype)) {
        res.status(400).json({ error: `Unsupported image type '${req.file.mimetype}'. Allowed: JPEG, PNG, WEBP, GIF.` });
        return;
      }

      const key = buildKey("cover-images", req.file.originalname);
      const url = await uploadFileToR2(req.file.buffer, key, req.file.mimetype);

      const { attached } = await patchProduct(req.body.productId, req.userId, "coverImageUrl", url);

      res.json({ url, key, field: "coverImageUrl", attached });
    } catch (err: any) {
      req.log.error({ err }, "upload-cover-image error");
      res.status(err?.status ?? 500).json({ error: err?.message ?? "Cover image upload failed" });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products/upload-file
// Accepts PDFs and common document/media types.
// Updates uploadedFileUrl (and sets isUploaded=true) when productId is given.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/products/upload-file",
  requireAuth,
  requireR2,
  fileUpload.single("file"),
  multerErrorHandler,
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file received. Send the file as a multipart field named 'file'." });
        return;
      }

      const allowed = [
        "application/pdf",
        "application/epub+zip",
        "application/zip",
        "application/octet-stream",
        "video/mp4",
        "video/webm",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowed.includes(req.file.mimetype)) {
        res.status(400).json({ error: `Unsupported file type '${req.file.mimetype}'.` });
        return;
      }

      const key = buildKey("uploads", req.file.originalname);
      const url = await uploadFileToR2(req.file.buffer, key, req.file.mimetype);

      const { attached } = await patchProduct(req.body.productId, req.userId, "uploadedFileUrl", url);

      res.json({ url, key, field: "uploadedFileUrl", attached });
    } catch (err: any) {
      req.log.error({ err }, "upload-file error");
      res.status(err?.status ?? 500).json({ error: err?.message ?? "File upload failed" });
    }
  },
);

export default router;
