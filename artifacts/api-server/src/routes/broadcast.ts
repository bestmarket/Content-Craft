import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and, isNotNull, ne } from "drizzle-orm";
import { requireAdmin } from "./auth";
import nodemailer from "nodemailer";
import { logger } from "../lib/logger";

const router = Router();

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user ?? "noreply@selovox.com";

  if (!host || !user || !pass) return null;

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    from,
  };
}

type Segment = "all" | "free" | "pro" | "inactive";

async function getUsersBySegment(segment: Segment) {
  const base = { isActive: true };

  if (segment === "all") {
    return db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(ne(usersTable.role, "admin"));
  }

  if (segment === "free") {
    return db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(and(eq(usersTable.subscriptionTier, "free"), eq(usersTable.isActive, true), ne(usersTable.role, "admin")));
  }

  if (segment === "pro") {
    return db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(and(eq(usersTable.subscriptionTier, "pro"), eq(usersTable.isActive, true), ne(usersTable.role, "admin")));
  }

  if (segment === "inactive") {
    return db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(and(eq(usersTable.isActive, false), ne(usersTable.role, "admin")));
  }

  return [];
}

function buildHtml(subject: string, body: string, name: string) {
  const escapedBody = body
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px 0;color:#374151;font-size:15px;line-height:1.6">${line || "&nbsp;"}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 32px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">⚡ Selovox</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 20px 0;font-size:18px;font-weight:700;color:#0f172a">${subject}</p>
            <p style="margin:0 0 16px 0;color:#374151;font-size:15px">Hi ${name},</p>
            ${escapedBody}
            <table cellpadding="0" cellspacing="0" style="margin-top:28px">
              <tr>
                <td style="background:#7c3aed;border-radius:8px;padding:12px 24px">
                  <a href="https://selovox.com" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Open Selovox →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              You're receiving this because you have a Selovox account.<br>
              © ${new Date().getFullYear()} Selovox
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

router.post("/broadcast", requireAdmin, async (req: any, res) => {
  try {
    const { subject, body, segment = "all" } = req.body as {
      subject: string;
      body: string;
      segment: Segment;
    };

    if (!subject?.trim() || !body?.trim()) {
      res.status(400).json({ error: "Subject and body are required" });
      return;
    }

    const smtp = getTransporter();
    if (!smtp) {
      res.status(503).json({
        error: "smtp_not_configured",
        message: "SMTP credentials not set. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to your environment variables.",
      });
      return;
    }

    const users = await getUsersBySegment(segment as Segment);
    if (!users.length) {
      res.json({ sent: 0, failed: 0, total: 0, message: "No users in this segment." });
      return;
    }

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await smtp.transporter.sendMail({
          from: `Selovox <${smtp.from}>`,
          to: user.email,
          subject,
          html: buildHtml(subject, body, user.name),
          text: `Hi ${user.name},\n\n${body}\n\n— Selovox`,
        });
        sent++;
      } catch (mailErr) {
        logger.warn({ mailErr, email: user.email }, "Failed to send broadcast to user");
        failed++;
      }
    }

    logger.info({ sent, failed, segment }, "Broadcast completed");
    res.json({ sent, failed, total: users.length });
  } catch (err) {
    req.log.error({ err }, "Broadcast error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/broadcast/preview-count", requireAdmin, async (req: any, res) => {
  try {
    const segment = (req.query.segment ?? "all") as Segment;
    const users = await getUsersBySegment(segment);
    res.json({ count: users.length });
  } catch (err) {
    req.log.error({ err }, "BroadcastPreviewCount error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
