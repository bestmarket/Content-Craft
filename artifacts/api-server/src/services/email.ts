import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  unsubscribeUrl?: string;
  trackingPixelUrl?: string;
  trackedLinks?: Array<{ original: string; tracked: string }>;
}

export async function getSmtpConfig(): Promise<{
  host: string; port: number; user: string; pass: string;
  fromName: string; fromEmail: string;
} | null> {
  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;

  if (envHost && envUser && envPass) {
    return {
      host: envHost,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      user: envUser,
      pass: envPass,
      fromName: process.env.SMTP_FROM_NAME ?? "Selovox",
      fromEmail: process.env.SMTP_FROM ?? envUser,
    };
  }

  try {
    const rows = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "smtp_config")).limit(1);
    if (rows.length > 0 && rows[0].value) {
      const cfg = JSON.parse(rows[0].value);
      if (cfg.host && cfg.user && cfg.pass) return cfg;
    }
  } catch {}
  return null;
}

export async function getEmailGlobalSettings(): Promise<Record<string, any>> {
  try {
    const [row] = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "email_global_settings")).limit(1);
    return row ? JSON.parse(row.value ?? "{}") : {};
  } catch { return {}; }
}

export async function sendEmail(opts: EmailOptions): Promise<{ ok: boolean; error?: string }> {
  const config = await getSmtpConfig();
  if (!config) {
    logger.warn("Email not sent — SMTP not configured");
    return { ok: false, error: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  const fromName = opts.fromName ?? config.fromName;
  const fromEmail = opts.fromEmail ?? config.fromEmail;
  const globalSettings = await getEmailGlobalSettings();

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to,
      replyTo: opts.replyTo ?? fromEmail,
      subject: opts.subject,
      html: wrapHtml({
        subject: opts.subject,
        body: opts.htmlBody,
        fromName,
        unsubscribeUrl: opts.unsubscribeUrl,
        trackingPixelUrl: opts.trackingPixelUrl,
        footerText: globalSettings.footerText,
        footerColor: globalSettings.footerColor,
        brandColor: globalSettings.brandColor,
        logoText: globalSettings.logoText,
        socialLinks: globalSettings.socialLinks,
      }),
    });
    return { ok: true };
  } catch (err: any) {
    logger.error({ err: err.message, to: opts.to }, "Email send error");
    return { ok: false, error: err.message };
  }
}

function wrapHtml(opts: {
  subject: string;
  body: string;
  fromName: string;
  unsubscribeUrl?: string;
  trackingPixelUrl?: string;
  footerText?: string;
  footerColor?: string;
  brandColor?: string;
  logoText?: string;
  socialLinks?: Array<{ label: string; url: string }>;
}): string {
  const brand = opts.brandColor ?? "#7c3aed";
  const logo = opts.logoText ?? opts.fromName;
  const footerText = opts.footerText ?? `You're receiving this because you purchased from <strong style="color:${brand}">${escHtml(opts.fromName)}</strong>`;

  const socialLinksHtml = opts.socialLinks?.length
    ? `<p style="margin:8px 0 0">${opts.socialLinks.map(s => `<a href="${s.url}" style="color:${brand};text-decoration:none;margin:0 6px">${escHtml(s.label)}</a>`).join(" · ")}</p>`
    : "";

  const pixelHtml = opts.trackingPixelUrl
    ? `<img src="${opts.trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(opts.subject)}</title>
<style>
  body { margin: 0; padding: 0; background: #0f0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 620px; margin: 0 auto; background: #0f0f1a; }
  .header { background: linear-gradient(135deg, ${brand}, #db2777); padding: 28px 40px; text-align: center; }
  .header-logo { color: #fff; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
  .body { background: #1a1a2e; padding: 40px; }
  .body p { color: #cbd5e1; line-height: 1.75; font-size: 15px; margin: 0 0 16px; }
  .body h1, .body h2, .body h3 { color: #f1f5f9; margin: 0 0 12px; }
  .body h2 { font-size: 22px; font-weight: 800; }
  .body ul, .body ol { color: #cbd5e1; line-height: 1.75; padding-left: 24px; margin: 0 0 16px; }
  .body li { margin-bottom: 6px; }
  .cta-block { text-align: center; margin: 28px 0; }
  .cta-btn { display: inline-block; background: linear-gradient(135deg, ${brand}, #db2777); color: #fff; font-weight: 800; font-size: 15px; padding: 14px 36px; border-radius: 8px; text-decoration: none; }
  .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 28px 0; }
  .footer { background: #0a0a14; padding: 24px 40px; text-align: center; }
  .footer p { color: #475569; font-size: 12px; margin: 0 0 6px; }
  .footer a { color: ${brand}; text-decoration: none; }
  blockquote { border-left: 3px solid ${brand}; padding-left: 16px; margin: 16px 0; color: #94a3b8; font-style: italic; }
  strong { color: #e2e8f0; }
  a { color: ${brand}; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-logo">⚡ ${escHtml(logo)}</div>
  </div>
  <div class="body">
    ${processBody(opts.body)}
  </div>
  <div class="footer">
    <p>${footerText}</p>
    ${opts.unsubscribeUrl ? `<p><a href="${opts.unsubscribeUrl}">Unsubscribe</a> · We'll stop emailing you immediately</p>` : ""}
    ${socialLinksHtml}
    <p style="margin-top:12px;color:#334155">Powered by <a href="https://viralcraft.studio" style="color:#7c3aed">ViralCraft Studio</a></p>
  </div>
  ${pixelHtml}
</div>
</body>
</html>`;
}

function processBody(text: string): string {
  let html = escHtml(text);
  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, '<h2 style="font-size:26px">$1</h2>')
    .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="text-decoration:none">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  }
  if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<blockquote") && !html.startsWith("<div")) {
    html = `<p>${html}</p>`;
  }
  return html;
}

function escHtml(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildPurchaseReceiptHtml(opts: {
  productTitle: string;
  buyerName: string;
  amount: number;
  downloadUrl: string;
  sellerName: string;
}): string {
  return `Thank you so much for your purchase, ${opts.buyerName ? opts.buyerName.split(" ")[0] : "friend"}! 🎉

Your access to **${opts.productTitle}** is confirmed.

<div class="cta-block">
  <a href="${opts.downloadUrl}" class="cta-btn">⬇️ Download Your Product Now</a>
</div>

<div class="divider"></div>

**Order Summary**
- Product: ${opts.productTitle}
- Amount Paid: $${opts.amount.toFixed(2)}
- Seller: ${opts.sellerName}

If you have any questions, just reply to this email — we're happy to help!

To your success,
${opts.sellerName}`;
}
