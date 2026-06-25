import { Router } from "express";
import { db } from "@workspace/db";
import {
  emailSequencesTable,
  emailSubscribersTable,
  emailSendsTable,
  productsTable,
  usersTable,
  settingsTable,
} from "@workspace/db";
import { eq, and, desc, count, sql, lte, gte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { sendEmail, getSmtpConfig, getEmailGlobalSettings } from "../services/email";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger";

const router = Router();

const BASE_URL = () => process.env.APP_URL ?? "https://selovox.com";

// ─── OPEN TRACKING PIXEL (public) ────────────────────────────────────────────

router.get("/email/track/open/:token", async (req: any, res) => {
  try {
    const token = req.params.token;
    const [send] = await db.select().from(emailSendsTable)
      .where(eq(emailSendsTable.trackingToken, token)).limit(1);

    if (send && !send.opened) {
      await db.update(emailSendsTable).set({
        opened: true,
        openedAt: new Date(),
      }).where(eq(emailSendsTable.id, send.id));

      await db.update(emailSequencesTable).set({
        totalOpened: sql`${emailSequencesTable.totalOpened} + 1`,
      }).where(eq(emailSequencesTable.id, send.sequenceId));
    }
  } catch {}

  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.end(pixel);
});

// ─── CLICK TRACKING REDIRECT (public) ────────────────────────────────────────

router.get("/email/track/click/:token", async (req: any, res) => {
  try {
    const token = req.params.token;
    const url = req.query.url as string;

    const [send] = await db.select().from(emailSendsTable)
      .where(eq(emailSendsTable.trackingToken, token)).limit(1);

    if (send && !send.clicked) {
      await db.update(emailSendsTable).set({
        clicked: true,
        clickedAt: new Date(),
      }).where(eq(emailSendsTable.id, send.id));

      await db.update(emailSequencesTable).set({
        totalClicked: sql`${emailSequencesTable.totalClicked} + 1`,
      }).where(eq(emailSequencesTable.id, send.sequenceId));
    }

    if (url) return res.redirect(302, url);
    res.redirect(302, BASE_URL());
  } catch {
    res.redirect(302, BASE_URL());
  }
});

// ─── UNSUBSCRIBE (public) ─────────────────────────────────────────────────────

router.get("/unsubscribe/:token", async (req: any, res) => {
  try {
    const [sub] = await db.select().from(emailSubscribersTable)
      .where(eq(emailSubscribersTable.unsubscribeToken, req.params.token)).limit(1);
    if (!sub) { res.status(404).send("Link not found or already unsubscribed."); return; }

    await db.update(emailSubscribersTable).set({
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    }).where(eq(emailSubscribersTable.id, sub.id));

    await db.update(emailSequencesTable).set({
      totalUnsubscribed: sql`${emailSequencesTable.totalUnsubscribed} + 1`,
    }).where(eq(emailSequencesTable.id, sub.sequenceId));

    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f1a;color:#e2e8f0;margin:0}
.box{text-align:center;max-width:420px;padding:40px}</style></head>
<body><div class="box">
<div style="font-size:3rem;margin-bottom:16px">✅</div>
<h2 style="color:#f1f5f9;margin-bottom:8px">You're unsubscribed</h2>
<p style="color:#94a3b8">You won't receive any more emails from this sequence.</p>
</div></body></html>`);
  } catch {
    res.status(500).send("An error occurred.");
  }
});

// ─── SMTP CONFIG (admin) ──────────────────────────────────────────────────────

router.get("/admin/email/smtp", requireAdmin, async (req: any, res) => {
  try {
    const [row] = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "smtp_config")).limit(1);
    const cfg = row ? JSON.parse(row.value ?? "{}") : {};
    res.json({ ...cfg, pass: cfg.pass ? "••••••••" : "" });
  } catch { res.json({}); }
});

router.post("/admin/email/smtp", requireAdmin, async (req: any, res) => {
  try {
    const { host, port, user, pass, fromName, fromEmail } = req.body;
    const existing = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "smtp_config")).limit(1);

    const prevCfg = existing.length ? JSON.parse(existing[0].value ?? "{}") : {};
    const newCfg = {
      host: host ?? prevCfg.host ?? "",
      port: parseInt(port ?? prevCfg.port ?? "587"),
      user: user ?? prevCfg.user ?? "",
      pass: pass && pass !== "••••••••" ? pass : (prevCfg.pass ?? ""),
      fromName: fromName ?? prevCfg.fromName ?? "Selovox",
      fromEmail: fromEmail ?? prevCfg.fromEmail ?? user ?? "",
    };

    if (existing.length) {
      await db.update(settingsTable).set({ value: JSON.stringify(newCfg), updatedAt: new Date() })
        .where(eq(settingsTable.key, "smtp_config"));
    } else {
      await db.insert(settingsTable).values({ key: "smtp_config", value: JSON.stringify(newCfg) });
    }
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/email/smtp/test", requireAdmin, async (req: any, res) => {
  try {
    const { testEmail } = req.body;
    if (!testEmail) { res.status(400).json({ error: "testEmail required" }); return; }
    const result = await sendEmail({
      to: testEmail,
      subject: "✅ Selovox — SMTP Test",
      htmlBody: `Your SMTP configuration is working correctly! 🎉\n\nEmails will be delivered from this server.\n\nPowered by **Selovox**`,
      fromName: "Selovox",
    });
    if (result.ok) {
      res.json({ ok: true, message: "Test email sent successfully" });
    } else {
      res.status(500).json({ error: result.error ?? "Failed to send" });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GLOBAL EMAIL SETTINGS (admin) ───────────────────────────────────────────

router.get("/admin/email/settings", requireAdmin, async (req: any, res) => {
  try {
    const [row] = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "email_global_settings")).limit(1);
    res.json(row ? JSON.parse(row.value ?? "{}") : {});
  } catch { res.json({}); }
});

router.post("/admin/email/settings", requireAdmin, async (req: any, res) => {
  try {
    const settings = req.body;
    const existing = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "email_global_settings")).limit(1);

    const value = JSON.stringify(settings);
    if (existing.length) {
      await db.update(settingsTable).set({ value, updatedAt: new Date() })
        .where(eq(settingsTable.key, "email_global_settings"));
    } else {
      await db.insert(settingsTable).values({ key: "email_global_settings", value });
    }
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN STATS ──────────────────────────────────────────────────────────────

router.get("/admin/email/stats", requireAdmin, async (req: any, res) => {
  try {
    const [totalSeqs] = await db.select({ count: count() }).from(emailSequencesTable);
    const [totalSubs] = await db.select({ count: count() }).from(emailSubscribersTable);
    const [totalSent] = await db.select({ count: count() }).from(emailSendsTable)
      .where(eq(emailSendsTable.status, "sent"));
    const [totalFailed] = await db.select({ count: count() }).from(emailSendsTable)
      .where(eq(emailSendsTable.status, "failed"));
    const [activeSubs] = await db.select({ count: count() }).from(emailSubscribersTable)
      .where(eq(emailSubscribersTable.status, "active"));
    const [totalOpened] = await db.select({ count: count() }).from(emailSendsTable)
      .where(eq(emailSendsTable.opened, true));
    const [totalClicked] = await db.select({ count: count() }).from(emailSendsTable)
      .where(eq(emailSendsTable.clicked, true));
    const [unsubSubs] = await db.select({ count: count() }).from(emailSubscribersTable)
      .where(eq(emailSubscribersTable.status, "unsubscribed"));
    const smtpCfg = await getSmtpConfig();

    const sentN = Number(totalSent.count);
    const openRate = sentN > 0 ? Math.round((Number(totalOpened.count) / sentN) * 100) : 0;
    const clickRate = sentN > 0 ? Math.round((Number(totalClicked.count) / sentN) * 100) : 0;

    res.json({
      totalSequences: Number(totalSeqs.count),
      totalSubscribers: Number(totalSubs.count),
      totalSent: sentN,
      totalFailed: Number(totalFailed.count),
      totalOpened: Number(totalOpened.count),
      totalClicked: Number(totalClicked.count),
      totalUnsubscribed: Number(unsubSubs.count),
      activeSubscribers: Number(activeSubs.count),
      openRate,
      clickRate,
      smtpConfigured: !!smtpCfg,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN SEQUENCES ──────────────────────────────────────────────────────────

router.get("/admin/email/sequences", requireAdmin, async (req: any, res) => {
  try {
    const seqs = await db.select().from(emailSequencesTable)
      .orderBy(desc(emailSequencesTable.createdAt));

    const withOwners = await Promise.all(seqs.map(async (seq) => {
      const [owner] = seq.userId
        ? await db.select({ name: usersTable.name, email: usersTable.email })
            .from(usersTable).where(eq(usersTable.id, seq.userId!)).limit(1)
        : [null];
      const [product] = seq.productId
        ? await db.select({ title: productsTable.title })
            .from(productsTable).where(eq(productsTable.id, seq.productId!)).limit(1)
        : [null];

      const sent = seq.totalSent ?? 0;
      const openRate = sent > 0 ? Math.round(((seq.totalOpened ?? 0) / sent) * 100) : 0;
      const clickRate = sent > 0 ? Math.round(((seq.totalClicked ?? 0) / sent) * 100) : 0;
      const unsubRate = sent > 0 ? Math.round(((seq.totalUnsubscribed ?? 0) / sent) * 100) : 0;

      return { ...serialize(seq), owner, productTitle: product?.title ?? null, openRate, clickRate, unsubRate };
    }));

    res.json(withOwners);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/email/sequences/:id/status", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [updated] = await db.update(emailSequencesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(emailSequencesTable.id, id)).returning();
    res.json(serialize(updated));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/email/sequences/:id/emails/:idx", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const idx = parseInt(req.params.idx);
    const [seq] = await db.select().from(emailSequencesTable)
      .where(eq(emailSequencesTable.id, id)).limit(1);
    if (!seq) { res.status(404).json({ error: "Not found" }); return; }

    const emails = Array.isArray(seq.emails) ? [...seq.emails as any[]] : [];
    if (idx < 0 || idx >= emails.length) { res.status(400).json({ error: "Invalid index" }); return; }

    emails[idx] = { ...emails[idx], ...req.body };
    await db.update(emailSequencesTable).set({ emails, updatedAt: new Date() })
      .where(eq(emailSequencesTable.id, id));
    res.json({ ok: true, email: emails[idx] });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/admin/email/sequences/:id/analytics", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [seq] = await db.select().from(emailSequencesTable)
      .where(eq(emailSequencesTable.id, id)).limit(1);
    if (!seq) { res.status(404).json({ error: "Not found" }); return; }

    const sends = await db.select().from(emailSendsTable)
      .where(and(eq(emailSendsTable.sequenceId, id), eq(emailSendsTable.status, "sent")));

    const emails = Array.isArray(seq.emails) ? seq.emails as any[] : [];
    const perEmail = emails.map((email: any, idx: number) => {
      const emailSends = sends.filter((s: any) => s.emailIndex === idx);
      const sentCount = emailSends.length;
      const openCount = emailSends.filter((s: any) => s.opened).length;
      const clickCount = emailSends.filter((s: any) => s.clicked).length;
      return {
        index: idx,
        day: email.day ?? idx + 1,
        subject: email.subject ?? `Email ${idx + 1}`,
        type: email.type ?? "email",
        sent: sentCount,
        opened: openCount,
        clicked: clickCount,
        openRate: sentCount > 0 ? Math.round((openCount / sentCount) * 100) : 0,
        clickRate: sentCount > 0 ? Math.round((clickCount / sentCount) * 100) : 0,
      };
    });

    res.json({ sequence: serialize(seq), perEmail });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/email/sequences/:id/preview", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { emailIndex, sendTo } = req.body;
    if (!sendTo) { res.status(400).json({ error: "sendTo required" }); return; }

    const [seq] = await db.select().from(emailSequencesTable)
      .where(eq(emailSequencesTable.id, id)).limit(1);
    if (!seq) { res.status(404).json({ error: "Not found" }); return; }

    const emails = Array.isArray(seq.emails) ? seq.emails as any[] : [];
    const idx = emailIndex ?? 0;
    const email = emails[idx];
    if (!email) { res.status(400).json({ error: "Email index out of range" }); return; }

    const result = await sendEmail({
      to: sendTo,
      subject: `[PREVIEW] ${email.subject ?? `Email #${idx + 1}`}`,
      htmlBody: email.body ?? email.preview ?? "(No content)",
      fromName: seq.fromName ?? "Selovox",
      fromEmail: seq.fromEmail,
    });

    res.json(result.ok ? { ok: true } : { ok: false, error: result.error });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/email/sequences/:id/resend-unopened", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { emailIndex, altSubject } = req.body;
    if (emailIndex === undefined) { res.status(400).json({ error: "emailIndex required" }); return; }

    const [seq] = await db.select().from(emailSequencesTable)
      .where(eq(emailSequencesTable.id, id)).limit(1);
    if (!seq) { res.status(404).json({ error: "Not found" }); return; }

    const emails = Array.isArray(seq.emails) ? seq.emails as any[] : [];
    const emailData = emails[emailIndex];
    if (!emailData) { res.status(400).json({ error: "Email index out of range" }); return; }

    const sentIds = await db.select({ subscriberId: emailSendsTable.subscriberId })
      .from(emailSendsTable)
      .where(and(
        eq(emailSendsTable.sequenceId, id),
        eq(emailSendsTable.emailIndex, emailIndex),
        eq(emailSendsTable.status, "sent"),
        eq(emailSendsTable.opened, false),
      ));

    const unopenedSubIds = new Set(sentIds.map(s => s.subscriberId));

    const subscribers = await db.select().from(emailSubscribersTable)
      .where(and(
        eq(emailSubscribersTable.sequenceId, id),
        eq(emailSubscribersTable.status, "active"),
      ));

    const toResend = subscribers.filter(s => unopenedSubIds.has(s.id));
    const subject = altSubject ?? emailData.subject;
    const baseUrl = BASE_URL();
    let sent = 0;

    for (const sub of toResend) {
      const token = nanoid(32);
      const pixelUrl = `${baseUrl}/api/email/track/open/${token}`;
      const result = await sendEmail({
        to: sub.email,
        toName: sub.name ?? undefined,
        subject,
        htmlBody: emailData.body ?? emailData.preview ?? "",
        fromName: seq.fromName ?? "Selovox",
        fromEmail: seq.fromEmail,
        unsubscribeUrl: `${baseUrl}/api/unsubscribe/${sub.unsubscribeToken}`,
        trackingPixelUrl: pixelUrl,
      });
      if (result.ok) {
        await db.insert(emailSendsTable).values({
          subscriberId: sub.id,
          sequenceId: seq.id,
          emailIndex,
          subject,
          status: "sent",
          sentAt: new Date(),
          trackingToken: token,
        });
        sent++;
      }
    }

    res.json({ ok: true, sent, total: toResend.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── BROADCAST (admin) ────────────────────────────────────────────────────────

router.post("/admin/email/broadcast", requireAdmin, async (req: any, res) => {
  try {
    const { sequenceId, subject, body, fromName, fromEmail, segment } = req.body;
    if (!subject || !body) { res.status(400).json({ error: "subject and body required" }); return; }

    let subscribers: any[] = [];

    if (sequenceId) {
      subscribers = await db.select().from(emailSubscribersTable)
        .where(and(
          eq(emailSubscribersTable.sequenceId, parseInt(sequenceId)),
          segment === "active" ? eq(emailSubscribersTable.status, "active") : undefined as any,
        ));
    } else {
      subscribers = await db.select().from(emailSubscribersTable)
        .where(eq(emailSubscribersTable.status, "active"));
    }

    // Filter by segment
    if (segment === "active") subscribers = subscribers.filter(s => s.status === "active");
    if (segment === "completed") subscribers = subscribers.filter(s => s.status === "completed");
    if (segment === "all") {} // include all

    let sent = 0, failed = 0;
    const baseUrl = BASE_URL();

    for (const sub of subscribers) {
      const token = nanoid(32);
      const pixelUrl = `${baseUrl}/api/email/track/open/${token}`;
      const result = await sendEmail({
        to: sub.email,
        toName: sub.name ?? undefined,
        subject,
        htmlBody: body,
        fromName: fromName ?? "Selovox",
        fromEmail: fromEmail ?? undefined,
        unsubscribeUrl: sub.unsubscribeToken
          ? `${baseUrl}/api/unsubscribe/${sub.unsubscribeToken}`
          : undefined,
        trackingPixelUrl: pixelUrl,
      });

      if (result.ok) {
        if (sequenceId) {
          await db.insert(emailSendsTable).values({
            subscriberId: sub.id,
            sequenceId: parseInt(sequenceId),
            emailIndex: -1,
            subject,
            status: "sent",
            sentAt: new Date(),
            trackingToken: token,
          });
        }
        sent++;
      } else {
        failed++;
      }
    }

    res.json({ ok: true, sent, failed, total: subscribers.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN SEND LOG ───────────────────────────────────────────────────────────

router.get("/admin/email/sends", requireAdmin, async (req: any, res) => {
  try {
    const sends = await db.select().from(emailSendsTable)
      .orderBy(desc(emailSendsTable.sentAt)).limit(200);
    res.json(sends);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN SUBSCRIBERS ────────────────────────────────────────────────────────

router.get("/admin/email/subscribers", requireAdmin, async (req: any, res) => {
  try {
    const subs = await db.select().from(emailSubscribersTable)
      .orderBy(desc(emailSubscribersTable.subscribedAt)).limit(500);
    res.json(subs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── CSV EXPORT: all subscribers ─────────────────────────────────────────────
router.get("/admin/email/subscribers/export.csv", requireAdmin, async (req: any, res) => {
  try {
    const subs = await db.execute(sql`
      SELECT
        es.email, es.name, es.status, es.source,
        eq.name AS sequence_name,
        es.subscribed_at, es.last_email_sent_at,
        es.order_id
      FROM email_subscribers es
      LEFT JOIN email_sequences eq ON eq.id = es.sequence_id
      ORDER BY es.subscribed_at DESC
    `);
    const rows = ((subs as any).rows ?? subs) as any[];
    const headers = ["email", "name", "status", "source", "sequence_name", "subscribed_at", "last_email_sent_at", "order_id"];
    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => escape(r[h])).join(",")),
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="subscribers_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── USER-LEVEL SEQUENCE CRUD ─────────────────────────────────────────────────

router.get("/email-sequences", requireAuth, async (req: any, res) => {
  try {
    const seqs = await db.select().from(emailSequencesTable)
      .where(eq(emailSequencesTable.userId, req.userId))
      .orderBy(desc(emailSequencesTable.createdAt));
    res.json(seqs.map(serialize));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/email-sequences/:id", requireAuth, async (req: any, res) => {
  try {
    const [seq] = await db.select().from(emailSequencesTable)
      .where(and(eq(emailSequencesTable.id, parseInt(req.params.id)), eq(emailSequencesTable.userId, req.userId))).limit(1);
    if (!seq) { res.status(404).json({ error: "Not found" }); return; }
    const subscribers = await db.select().from(emailSubscribersTable)
      .where(eq(emailSubscribersTable.sequenceId, seq.id))
      .orderBy(desc(emailSubscribersTable.subscribedAt));
    const sends = await db.select().from(emailSendsTable)
      .where(eq(emailSendsTable.sequenceId, seq.id))
      .orderBy(desc(emailSendsTable.sentAt)).limit(100);
    res.json({ ...serialize(seq), subscribers, sends });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/email-sequences", requireAuth, async (req: any, res) => {
  try {
    const { name, description, emails, fromName, fromEmail, replyTo, productId, status } = req.body;
    if (!name) { res.status(400).json({ error: "Name required" }); return; }
    const [seq] = await db.insert(emailSequencesTable).values({
      userId: req.userId,
      name,
      description: description ?? "",
      emails: Array.isArray(emails) ? emails : [],
      fromName: fromName ?? "Selovox",
      fromEmail: fromEmail ?? "noreply@selovox.com",
      replyTo: replyTo ?? null,
      productId: productId ? parseInt(productId) : null,
      status: status ?? "draft",
      source: "manual",
    }).returning();
    res.json(serialize(seq));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/email-sequences/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(emailSequencesTable)
      .where(and(eq(emailSequencesTable.id, id), eq(emailSequencesTable.userId, req.userId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const { name, description, emails, fromName, fromEmail, replyTo, status } = req.body;
    const [updated] = await db.update(emailSequencesTable).set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(emails !== undefined && { emails }),
      ...(fromName !== undefined && { fromName }),
      ...(fromEmail !== undefined && { fromEmail }),
      ...(replyTo !== undefined && { replyTo }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    }).where(eq(emailSequencesTable.id, id)).returning();
    res.json(serialize(updated));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/email-sequences/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(emailSendsTable).where(eq(emailSendsTable.sequenceId, id));
    await db.delete(emailSubscribersTable).where(eq(emailSubscribersTable.sequenceId, id));
    await db.delete(emailSequencesTable)
      .where(and(eq(emailSequencesTable.id, id), eq(emailSequencesTable.userId, req.userId)));
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/email-sequences/:id/subscribers", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [seq] = await db.select({ id: emailSequencesTable.id })
      .from(emailSequencesTable)
      .where(and(eq(emailSequencesTable.id, id), eq(emailSequencesTable.userId, req.userId))).limit(1);
    if (!seq) { res.status(404).json({ error: "Not found" }); return; }
    const subs = await db.select().from(emailSubscribersTable)
      .where(eq(emailSubscribersTable.sequenceId, id))
      .orderBy(desc(emailSubscribersTable.subscribedAt));
    res.json(subs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/email-sequences/:id/subscribers", requireAuth, async (req: any, res) => {
  try {
    const sequenceId = parseInt(req.params.id);
    const [seq] = await db.select().from(emailSequencesTable)
      .where(and(eq(emailSequencesTable.id, sequenceId), eq(emailSequencesTable.userId, req.userId))).limit(1);
    if (!seq) { res.status(404).json({ error: "Sequence not found" }); return; }
    const { email, name } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    const emails = Array.isArray(seq.emails) ? seq.emails as any[] : [];
    const nextSendAt = emails.length > 0 ? computeNextSendAt(emails[0]) : null;
    const token = nanoid(32);
    const [sub] = await db.insert(emailSubscribersTable).values({
      sequenceId,
      email: email.toLowerCase().trim(),
      name: name ?? null,
      status: "active",
      currentEmailIndex: 0,
      nextSendAt,
      unsubscribeToken: token,
    }).returning();
    await db.update(emailSequencesTable).set({
      totalSubscribers: sql`${emailSequencesTable.totalSubscribers} + 1`,
      updatedAt: new Date(),
    }).where(eq(emailSequencesTable.id, sequenceId));
    res.json(sub);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/email-sequences/:id/trigger", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [seq] = await db.select().from(emailSequencesTable)
      .where(and(eq(emailSequencesTable.id, id), eq(emailSequencesTable.userId, req.userId))).limit(1);
    if (!seq) { res.status(404).json({ error: "Not found" }); return; }
    const sent = await processSequence(seq);
    res.json({ ok: true, emailsSent: sent });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── INTERNAL EXPORTS ─────────────────────────────────────────────────────────

export async function createSequenceFromProduct(productId: number): Promise<number | null> {
  try {
    const [product] = await db.select().from(productsTable)
      .where(eq(productsTable.id, productId)).limit(1);
    if (!product || !product.emailSequence30Days) return null;
    const emails = Array.isArray(product.emailSequence30Days) ? product.emailSequence30Days : [];
    if (emails.length === 0) return null;

    const [owner] = await db.select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, product.userId)).limit(1);

    const existing = await db.select({ id: emailSequencesTable.id })
      .from(emailSequencesTable)
      .where(and(eq(emailSequencesTable.productId, productId), eq(emailSequencesTable.source, "product"))).limit(1);

    if (existing.length > 0) {
      await db.update(emailSequencesTable).set({ emails, status: "active", updatedAt: new Date() })
        .where(eq(emailSequencesTable.id, existing[0].id));
      await db.update(productsTable).set({ emailStatus: "scheduled" }).where(eq(productsTable.id, productId));
      return existing[0].id;
    }

    const [seq] = await db.insert(emailSequencesTable).values({
      userId: product.userId,
      productId,
      name: `${product.title} — 30-Day Email Sequence`,
      description: `Auto-generated email sequence for: ${product.title}`,
      emails,
      fromName: owner?.name ?? "Selovox",
      fromEmail: owner?.email ?? "noreply@selovox.com",
      status: "active",
      source: "product",
    }).returning();

    await db.update(productsTable).set({ emailStatus: "scheduled" }).where(eq(productsTable.id, productId));
    logger.info({ seqId: seq.id, productId }, "✉️ Email sequence created from product");
    return seq.id;
  } catch (err: any) {
    logger.error({ err: err.message, productId }, "createSequenceFromProduct error");
    return null;
  }
}

export async function createSequenceFromAutomation(opts: {
  userId: number; name: string; emails: any[]; automationRunId?: number;
}): Promise<number | null> {
  try {
    if (!opts.emails || opts.emails.length === 0) return null;
    const [owner] = await db.select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, opts.userId)).limit(1);
    const [seq] = await db.insert(emailSequencesTable).values({
      userId: opts.userId,
      automationRunId: opts.automationRunId ?? null,
      name: opts.name,
      emails: opts.emails,
      fromName: owner?.name ?? "Selovox",
      fromEmail: owner?.email ?? "noreply@selovox.com",
      status: "active",
      source: "automation",
    }).returning();
    logger.info({ seqId: seq.id }, "✉️ Email sequence created from automation");
    return seq.id;
  } catch (err: any) {
    logger.error({ err: err.message }, "createSequenceFromAutomation error");
    return null;
  }
}

export async function subscribeToProductSequence(opts: {
  productId: number; email: string; name?: string; orderId?: number;
}): Promise<void> {
  try {
    const [seq] = await db.select().from(emailSequencesTable)
      .where(and(
        eq(emailSequencesTable.productId, opts.productId),
        eq(emailSequencesTable.source, "product"),
        eq(emailSequencesTable.status, "active"),
      )).limit(1);
    if (!seq) return;

    const emails = Array.isArray(seq.emails) ? seq.emails as any[] : [];
    if (emails.length === 0) return;

    const alreadySubscribed = await db.select({ id: emailSubscribersTable.id })
      .from(emailSubscribersTable)
      .where(and(
        eq(emailSubscribersTable.sequenceId, seq.id),
        eq(emailSubscribersTable.email, opts.email.toLowerCase().trim()),
      )).limit(1);
    if (alreadySubscribed.length > 0) return;

    const nextSendAt = computeNextSendAt(emails[0]);
    const token = nanoid(32);

    await db.insert(emailSubscribersTable).values({
      sequenceId: seq.id,
      productId: opts.productId,
      orderId: opts.orderId ?? null,
      email: opts.email.toLowerCase().trim(),
      name: opts.name ?? null,
      status: "active",
      currentEmailIndex: 0,
      nextSendAt,
      unsubscribeToken: token,
    });

    await db.update(emailSequencesTable).set({
      totalSubscribers: sql`${emailSequencesTable.totalSubscribers} + 1`,
      updatedAt: new Date(),
    }).where(eq(emailSequencesTable.id, seq.id));

    const baseUrl = BASE_URL();
    await sendEmail({
      to: opts.email,
      toName: opts.name,
      subject: `🎉 Welcome! Here's what's coming over the next 30 days`,
      htmlBody: `Hi ${opts.name ? opts.name.split(" ")[0] : "there"}! 👋\n\nThank you for your purchase! We're thrilled to have you on board.\n\n**What happens next:**\n- You'll receive a curated series of emails over the next 30 days\n- Each email delivers real value: tips, case studies, and strategies\n- You can unsubscribe anytime — no hard feelings\n\nYour first email arrives very soon. Stay tuned! 🚀\n\n<div class="cta-block"><a href="${baseUrl}/api/unsubscribe/${token}" class="cta-btn" style="background:#475569;padding:10px 24px;font-size:13px">Manage Email Preferences</a></div>`,
      fromName: seq.fromName ?? "Selovox",
      fromEmail: seq.fromEmail,
      unsubscribeUrl: `${baseUrl}/api/unsubscribe/${token}`,
    });

    logger.info({ sequenceId: seq.id, email: opts.email }, "✉️ Subscriber enrolled in product sequence");
  } catch (err: any) {
    logger.error({ err: err.message }, "subscribeToProductSequence error");
  }
}

export async function processAllDueEmails(): Promise<void> {
  try {
    const activeSeqs = await db.select().from(emailSequencesTable)
      .where(eq(emailSequencesTable.status, "active"));
    let totalSent = 0;
    for (const seq of activeSeqs) {
      const sent = await processSequence(seq);
      totalSent += sent;
    }
    if (totalSent > 0) {
      logger.info({ totalSent }, "✉️ Email scheduler: sent emails");
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "processAllDueEmails error");
  }
}

// ─── INTERNAL: process one sequence ──────────────────────────────────────────

async function processSequence(seq: any): Promise<number> {
  const emails = Array.isArray(seq.emails) ? seq.emails as any[] : [];
  if (emails.length === 0) return 0;

  const now = new Date();
  const dueSubscribers = await db.select().from(emailSubscribersTable)
    .where(and(
      eq(emailSubscribersTable.sequenceId, seq.id),
      eq(emailSubscribersTable.status, "active"),
    ));

  const globalSettings = await getEmailGlobalSettings();
  const sendHourStart = globalSettings.sendHourStart ?? 6;
  const sendHourEnd = globalSettings.sendHourEnd ?? 22;
  const currentHour = now.getUTCHours();
  if (currentHour < sendHourStart || currentHour > sendHourEnd) return 0;

  const due = dueSubscribers.filter(s =>
    s.nextSendAt && new Date(s.nextSendAt) <= now &&
    s.currentEmailIndex < emails.length
  );

  let sent = 0;
  const baseUrl = BASE_URL();

  for (const sub of due) {
    const emailData = emails[sub.currentEmailIndex];
    if (!emailData) continue;

    const subject = emailData.subject ?? `Email ${sub.currentEmailIndex + 1}`;
    const body = emailData.body ?? emailData.preview ?? "";
    const trackingToken = nanoid(32);
    const pixelUrl = `${baseUrl}/api/email/track/open/${trackingToken}`;

    const result = await sendEmail({
      to: sub.email,
      toName: sub.name ?? undefined,
      subject,
      htmlBody: body,
      fromName: seq.fromName ?? "Selovox",
      fromEmail: seq.fromEmail,
      replyTo: seq.replyTo ?? undefined,
      unsubscribeUrl: `${baseUrl}/api/unsubscribe/${sub.unsubscribeToken}`,
      trackingPixelUrl: pixelUrl,
    });

    const [sendRecord] = await db.insert(emailSendsTable).values({
      subscriberId: sub.id,
      sequenceId: seq.id,
      emailIndex: sub.currentEmailIndex,
      subject,
      status: result.ok ? "sent" : "failed",
      error: result.error ?? null,
      sentAt: new Date(),
      trackingToken,
    }).returning();

    if (result.ok) {
      sent++;
      await db.update(emailSequencesTable).set({
        totalSent: sql`${emailSequencesTable.totalSent} + 1`,
      }).where(eq(emailSequencesTable.id, seq.id));
    }

    const nextIndex = sub.currentEmailIndex + 1;
    if (nextIndex >= emails.length) {
      await db.update(emailSubscribersTable).set({
        status: "completed",
        completedAt: new Date(),
        currentEmailIndex: nextIndex,
        nextSendAt: null,
      }).where(eq(emailSubscribersTable.id, sub.id));
    } else {
      const nextEmail = emails[nextIndex];
      const nextSendAt = computeNextSendAt(nextEmail, sub.subscribedAt);
      await db.update(emailSubscribersTable).set({
        currentEmailIndex: nextIndex,
        nextSendAt,
      }).where(eq(emailSubscribersTable.id, sub.id));
    }
  }

  return sent;
}

function computeNextSendAt(email: any, subscribedAt?: Date | string | null): Date {
  const base = subscribedAt ? new Date(subscribedAt) : new Date();
  const day = typeof email?.day === "number" ? email.day : 0;
  const sendAt = new Date(base);
  sendAt.setDate(sendAt.getDate() + day);
  sendAt.setHours(10, 0, 0, 0);
  if (sendAt <= new Date()) {
    const future = new Date();
    future.setMinutes(future.getMinutes() + 5);
    return future;
  }
  return sendAt;
}

function serialize(seq: any) {
  return {
    ...seq,
    emails: Array.isArray(seq.emails) ? seq.emails : [],
    createdAt: seq.createdAt?.toISOString?.() ?? seq.createdAt,
    updatedAt: seq.updatedAt?.toISOString?.() ?? seq.updatedAt,
  };
}

export default router;
