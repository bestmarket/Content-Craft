import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { nanoid } from "nanoid";
import { creditAffiliateCommission } from "./affiliate";
import { sendEmail } from "../services/email";

// ── Streak helper ─────────────────────────────────────────────────────────────
function computeStreak(user: { currentStreak?: number | null; longestStreak?: number | null; lastActiveDate?: string | null }): { currentStreak: number; longestStreak: number; lastActiveDate: string } | null {
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastActiveDate === today) return null; // already updated today

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = user.lastActiveDate === yesterday ? (user.currentStreak ?? 0) + 1 : 1;
  const longestStreak = Math.max(newStreak, user.longestStreak ?? 0);
  return { currentStreak: newStreak, longestStreak, lastActiveDate: today };
}

const router = Router();

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required but not set. Set it in your environment/secrets.");
  }
  return secret;
}

export function signToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: "90d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  req.userId = payload.userId;
  req.userRole = payload.role;
  req.user = { id: payload.userId, role: payload.role };
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    next();
  });
}

async function isEmailVerificationEnabled(): Promise<boolean> {
  try {
    const [setting] = await db.select().from(settingsTable).where(eq(settingsTable.key, "email_verification_required")).limit(1);
    return setting?.value === "true";
  } catch {
    return false;
  }
}

async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://viralcraft.studio";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  logger.info({ email, verifyUrl }, "Email verification link generated");
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, ref } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "All fields required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    let referrerId: number | undefined;
    if (ref) {
      const [referrer] = await db.select({ id: usersTable.id })
        .from(usersTable).where(eq(usersTable.affiliateCode, ref.trim().toUpperCase())).limit(1);
      if (referrer) referrerId = referrer.id;
    }

    const base = name.replace(/\s+/g, "").toLowerCase().slice(0, 6);
    const affiliateCode = (base + nanoid(4)).toUpperCase();
    const verificationToken = nanoid(32);

    const requireVerification = await isEmailVerificationEnabled();

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      password: hashed,
      name,
      role: "user",
      isActive: true,
      affiliateCode,
      referredBy: referrerId,
      emailVerified: !requireVerification,
      emailVerificationToken: requireVerification ? verificationToken : null,
    }).returning();

    if (referrerId) {
      await creditAffiliateCommission(user.id, "signup");
    }

    if (requireVerification) {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    }

    const token = signToken(user.id, user.role);
    const { password: _p, ...safeUser } = user;
    res.status(201).json({
      user: safeUser,
      token,
      requiresVerification: requireVerification,
      message: requireVerification
        ? "Account created! Please check your email to verify your account."
        : "Account created successfully!"
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/auth/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400).json({ error: "Verification token required" });
      return;
    }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.emailVerificationToken, token as string)).limit(1);

    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }

    await db.update(usersTable).set({
      emailVerified: true,
      emailVerificationToken: null,
    }).where(eq(usersTable.id, user.id));

    res.redirect("/?verified=1");
  } catch (err) {
    req.log.error({ err }, "VerifyEmail error");
    res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/auth/resend-verification", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (user.emailVerified) { res.json({ message: "Email already verified" }); return; }

    const verificationToken = nanoid(32);
    await db.update(usersTable).set({ emailVerificationToken: verificationToken }).where(eq(usersTable.id, user.id));
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.json({ message: "Verification email sent" });
  } catch (err) {
    req.log.error({ err }, "ResendVerification error");
    res.status(500).json({ error: "Failed to resend verification" });
  }
});

router.post("/auth/admin-verify-user", requireAuth, async (req: any, res) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const { userId } = req.body;
    await db.update(usersTable).set({ emailVerified: true, emailVerificationToken: null }).where(eq(usersTable.id, userId));
    res.json({ message: "User verified" });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email?.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!user.isActive) {
      res.status(401).json({ error: "Account deactivated" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const requireVerification = await isEmailVerificationEnabled();
    if (requireVerification && !user.emailVerified && user.role !== "admin") {
      res.status(403).json({
        error: "Please verify your email before logging in. Check your inbox for the verification link.",
        requiresVerification: true
      });
      return;
    }

    const streakUpdate = computeStreak(user);
    await db.update(usersTable).set({ lastLogin: new Date(), ...streakUpdate }).where(eq(usersTable.id, user.id));
    const token = signToken(user.id, user.role);
    const { password: _p, ...safeUser } = user;
    res.json({ user: { ...safeUser, lastLogin: new Date().toISOString(), ...streakUpdate }, token });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) { res.status(400).json({ error: "Google credential required" }); return; }

    // Read client ID from DB settings first, fall back to env var
    let clientId: string | null = process.env.GOOGLE_CLIENT_ID ?? null;
    try {
      const { settingsTable: st } = await import("@workspace/db");
      const { eq: eqFn } = await import("drizzle-orm");
      const [row] = await db.select({ value: st.value }).from(st).where(eqFn(st.key, "google_client_id")).limit(1);
      if (row?.value) clientId = row.value;
    } catch { /* fall through to env var */ }

    if (!clientId) { res.status(503).json({ error: "Google sign-in not configured on this server" }); return; }

    // Verify the Google ID token via Google's public endpoint
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await verifyRes.json() as any;

    if (!verifyRes.ok || !payload.email_verified || payload.aud !== clientId) {
      res.status(401).json({ error: "Invalid Google token" }); return;
    }

    const email = (payload.email as string).toLowerCase();
    const name = (payload.name as string) ?? email.split("@")[0];

    // Find existing user or create one
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) {
      const base = name.replace(/\s+/g, "").toLowerCase().slice(0, 6);
      const affiliateCode = (base + nanoid(4)).toUpperCase();
      const [created] = await db.insert(usersTable).values({
        email,
        password: await bcrypt.hash(nanoid(32), 10), // random unusable password
        name,
        role: "user",
        isActive: true,
        emailVerified: true, // Google already verified the email
        affiliateCode,
      }).returning();
      user = created;
    } else if (!user.isActive) {
      res.status(401).json({ error: "Account deactivated" }); return;
    }

    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));
    const token = signToken(user.id, user.role);
    const { password: _p, ...safeUser } = user;
    res.json({ user: { ...safeUser, lastLogin: new Date().toISOString() }, token });
  } catch (err) {
    req.log.error({ err }, "GoogleAuth error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);

    // Always respond the same way — don't reveal if email exists
    if (!user) { res.json({ message: "If that email exists, a reset link has been sent." }); return; }

    const token = nanoid(40);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(usersTable).set({
      passwordResetToken: token,
      passwordResetExpires: expires,
    }).where(eq(usersTable.id, user.id));

    const appUrl = process.env.APP_URL ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://selovox.vercel.app");
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      toName: user.name,
      subject: "Reset your Selovox password",
      htmlBody: `
        <h2 style="margin:0 0 16px">Reset your password</h2>
        <p>Hi ${user.name},</p>
        <p>Someone requested a password reset for your Selovox account. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Reset Password</a>
        </p>
        <p style="color:#94a3b8;font-size:13px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="color:#94a3b8;font-size:12px;word-break:break-all">Or copy this link: ${resetUrl}</p>
      `,
    });

    logger.info({ userId: user.id }, "Password reset email sent");
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    req.log.error({ err }, "ForgotPassword error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) { res.status(400).json({ error: "Token and password are required" }); return; }
    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" }); return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.passwordResetToken, token)).limit(1);

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      res.status(400).json({ error: "Reset link is invalid or has expired. Please request a new one." }); return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.update(usersTable).set({
      password: hashed,
      passwordResetToken: null,
      passwordResetExpires: null,
    }).where(eq(usersTable.id, user.id));

    logger.info({ userId: user.id }, "Password reset successful");
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    req.log.error({ err }, "ResetPassword error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/change-password", requireAuth, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ password: hashed }).where(eq(usersTable.id, req.userId));
    req.log.info({ userId: req.userId }, "Password changed");
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/auth/me", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const streakUpdate = computeStreak(user);
    if (streakUpdate) {
      await db.update(usersTable).set(streakUpdate).where(eq(usersTable.id, req.userId));
    }
    const { password: _p, ...safeUser } = user;
    res.json({ ...safeUser, ...(streakUpdate ?? {}) });
  } catch (err) {
    req.log.error({ err }, "GetMe error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
