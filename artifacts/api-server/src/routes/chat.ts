import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, chatMessagesTable, usersTable } from "@workspace/db";
import { eq, desc, and, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { callAI } from "./content";

const router = Router();

// List conversations
router.get("/chat/conversations", requireAuth, async (req: any, res) => {
  try {
    const isAdmin = req.userRole === "admin";
    const convs = isAdmin
      ? await db.select().from(conversationsTable).orderBy(desc(conversationsTable.updatedAt))
      : await db.select().from(conversationsTable)
          .where(eq(conversationsTable.userId, req.userId))
          .orderBy(desc(conversationsTable.updatedAt));

    const enriched = await Promise.all(convs.map(async (c) => {
      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
      const [lastMsg] = await db.select().from(chatMessagesTable)
        .where(eq(chatMessagesTable.conversationId, c.id))
        .orderBy(desc(chatMessagesTable.createdAt)).limit(1);
      const [{ unread }] = await db.select({ unread: count() }).from(chatMessagesTable)
        .where(and(
          eq(chatMessagesTable.conversationId, c.id),
          eq(chatMessagesTable.isRead, false),
          eq(chatMessagesTable.senderRole, isAdmin ? "user" : "admin")
        ));
      return {
        id: c.id,
        userId: c.userId,
        userName: user?.name ?? null,
        status: c.status,
        lastMessage: lastMsg?.content ?? null,
        unreadCount: Number(unread),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "ListConversations error");
    res.status(500).json({ error: "Server error" });
  }
});

// Create conversation
router.post("/chat/conversations", requireAuth, async (req: any, res) => {
  try {
    const { initialMessage } = req.body;
    // Check if user already has an open conversation
    const existing = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.userId, req.userId), eq(conversationsTable.status, "open")))
      .limit(1);

    let conv = existing[0];
    if (!conv) {
      [conv] = await db.insert(conversationsTable).values({ userId: req.userId }).returning();
    }

    if (initialMessage) {
      await db.insert(chatMessagesTable).values({
        conversationId: conv.id,
        senderRole: "user",
        content: initialMessage,
        isRead: false,
      });
      await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conv.id));
    }

    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, conv.userId)).limit(1);
    res.status(201).json({
      id: conv.id,
      userId: conv.userId,
      userName: user?.name ?? null,
      status: conv.status,
      lastMessage: initialMessage ?? null,
      unreadCount: 0,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "CreateConversation error");
    res.status(500).json({ error: "Server error" });
  }
});

// List messages
router.get("/chat/conversations/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdmin = req.userRole === "admin";

    // Verify ownership for non-admins
    const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    if (!isAdmin && conv.userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }

    const msgs = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, id))
      .orderBy(chatMessagesTable.createdAt);

    // Mark messages as read
    const senderRole = isAdmin ? "user" : "admin";
    await db.update(chatMessagesTable).set({ isRead: true })
      .where(and(eq(chatMessagesTable.conversationId, id), eq(chatMessagesTable.senderRole, senderRole)));

    res.json(msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "ListMessages error");
    res.status(500).json({ error: "Server error" });
  }
});

// Send message
router.post("/chat/conversations/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdmin = req.userRole === "admin";

    // Verify ownership for non-admins
    const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    if (!isAdmin && conv.userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }

    const { content } = req.body;
    const senderRole = isAdmin ? "admin" : "user";
    const [msg] = await db.insert(chatMessagesTable).values({
      conversationId: id,
      senderRole: senderRole as any,
      content,
      isRead: false,
    }).returning();
    await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, id));
    res.status(201).json({ ...msg, createdAt: msg.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "SendMessage error");
    res.status(500).json({ error: "Server error" });
  }
});

// AI Chatbot
router.post("/chat/bot", async (req: any, res) => {
  try {
    const { message } = req.body;

    const systemPrompt = `You are Selovox AI — the built-in intelligent assistant for Selovox, an all-in-one AI-powered digital product creation and monetization platform for creators, marketers, and digital entrepreneurs.

YOUR IDENTITY:
- Friendly, knowledgeable, and genuinely helpful — like a smart friend who knows the platform inside-out
- Concise but complete — never leave a question unanswered
- You speak in plain English, never corporate jargon
- You give specific, actionable guidance — not generic advice

PLATFORM OVERVIEW:
Selovox is a full-stack digital business platform. Users create AI-generated products, sell them in a marketplace, build landing pages, grow their audience, and get paid — all in one place.

CORE PRODUCT CREATION TOOLS:
- Content Creator: Generates viral scripts, titles, descriptions, tags, and hashtags for YouTube, TikTok, Facebook, Instagram, and Twitter. 8 tone modes: Viral Hook, Emotional Storytelling, Motivational, Comedic, Conversational, Friendly, Educational, Suspenseful.
- PDF Studio: Creates downloadable premium digital guides (eBooks, playbooks, checklists) with professional cover pages, chapter illustrations, and real PDF export. Best niches: make money online, fitness, digital marketing, mindset.
- Thumbnail Generator: AI-powered thumbnail concept generation using DALL-E / Gemini Imagen. Produces eye-catching visuals for YouTube and social media.
- Script Studio: Movie scripts, short-film scripts, and video idea generators for content creators.
- Landing Page Generator: High-conversion sales page copy with HTML export for any digital product.
- Video Marketing Agent: Generates a 4-part video script (hook / problem / solution / CTA) and renders a marketing video using AI voiceover.
- AI Dev Studio (Workspace): A Replit-style browser IDE. Builds fully working web apps, tools, and scripts using AI. Supports coding projects with file management.
- SaaS Builder: Generates complete SaaS business blueprints, landing pages, voiceovers, and YouTube scripts for 6 business types: SaaS tool, coaching, daily plan, course, community, newsletter.
- Scryvox Writing Engine: An advanced AI writing engine with 7 stages (Research → Architect → Content → Critic → Sellability → Marketing → Landing Page). Produces human-like, deeply researched long-form content. No API key needed — uses built-in AI.
- Prompt Package Studio: Generates professional prompt bundles (50 prompts across 10 categories) for ChatGPT / Claude power users. Includes quality gate scoring.
- Automation Engine: Visual no-code automation builder with 25+ AI blocks. Build, publish, and sell automation workflows. Also has a marketplace of pre-built automations.
- Template Generators: AI-generated templates for AI agents, n8n workflows, Replit templates, and Chrome extensions.

MONETIZATION & SELLING:
- Products Marketplace: Users publish AI-generated products and sell them publicly. Supports digital downloads, prompt packs, templates, scripts, and courses.
- Store: Each user gets a personal storefront showing all their published products.
- Wallet System: Earnings tracked in a built-in wallet. Revenue splits applied based on tier (Free / Pro / Enterprise).
- Checkout: Supports card payments and crypto payments (7 coins — Bitcoin, Ethereum, USDC, etc.).
- Revenue Sharing: Configurable tier-based splits between creator and platform.
- Subscriptions & Orders: Full purchase history, order management, and subscription tracking.

MARKETING & GROWTH TOOLS:
- Email Marketing: Automated email sequences, subscriber management, and receipt emails. SMTP-based. Auto-enrolls buyers.
- Viral Campaign Engine: Referral and viral campaign tools to grow audience.
- AI Agents (Chatbots): Users can create and deploy embeddable AI chatbot widgets with one line of code. Each agent is fully customizable with its own system prompt, color, avatar, and welcome message. Supports lead capture.
- Custom Offers: Create personalized deals for specific customers.

USER TIERS:
- Free: Limited product generation, basic features
- Pro: Full PDF studio, video agent, AI dev studio, SaaS builder, all generators
- Enterprise: All features + higher limits + priority AI

ACCOUNT & SETTINGS:
- Dashboard: Overview of products, wallet balance, orders, and recent activity
- My Products: Manage all created products, edit, publish, unpublish
- History: All AI-generated content saved and searchable
- Profile: Username, bio, wallet address
- Billing: Subscription management

HELPFUL TIPS YOU GIVE:
- "PDF Studio works best for 'how to make money', 'weight loss', 'mindset', and 'digital marketing' — these niches convert the highest"
- "Use Viral Hook tone on YouTube, POV / conversational for TikTok, and Emotional Storytelling for Facebook"
- "Scryvox Writing Engine produces the most human-like content — use it for flagship eBooks or blog content"
- "The Video Marketing Agent is great for product launches — it handles script + voiceover + video render in one click"
- "Publish to the marketplace to earn from your products — buyers can find you without any marketing"
- "Prompt Package Studio is one of the fastest products to create and sell — takes under 2 minutes"

WHAT YOU DON'T DO:
- Never claim access to the internet or real-time data
- Never give medical, legal, or financial advice
- Never make up features that don't exist
- Keep responses under 220 words unless a detailed explanation is genuinely needed
- If unsure about something, say so honestly and direct the user to support

When someone asks a content strategy or platform question, give a real specific answer with examples — not vague tips.`;

    const reply = await callAI(message, systemPrompt, "chat");
    res.json({ reply, sessionId: `session_${Date.now()}` });
  } catch (err) {
    req.log.error({ err }, "AskChatbot error");
    res.json({ reply: "I'm here to help! Ask me anything about creating products, growing your audience, or using any Selovox feature.", sessionId: `session_${Date.now()}` });
  }
});

export default router;
