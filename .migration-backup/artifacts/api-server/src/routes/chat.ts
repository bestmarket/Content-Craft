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
    const msgs = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, id))
      .orderBy(chatMessagesTable.createdAt);

    // Mark messages as read
    const senderRole = req.userRole === "admin" ? "user" : "admin";
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
    const { content } = req.body;
    const senderRole = req.userRole === "admin" ? "admin" : "user";
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

    const systemPrompt = `You are ViralCraft AI, a helpful assistant for the ViralCraft Studio platform. You help users create viral content for YouTube, TikTok, Instagram, Facebook, and Twitter. You know about:
- Content generation (scripts, titles, descriptions, tags, hashtags)
- Viral strategies for each platform
- Thumbnail creation
- PDF digital product creation
- Video modeling and analysis
- Writing styles and tones
Answer questions helpfully and concisely. If asked about features, explain how to use them. Keep responses under 200 words.`;

    const reply = await callAI(message, systemPrompt);
    res.json({ reply, sessionId: `session_${Date.now()}` });
  } catch (err) {
    req.log.error({ err }, "AskChatbot error");
    res.json({ reply: "I'm here to help you create viral content! Ask me anything about YouTube, TikTok, Instagram, Facebook, or Twitter content strategies.", sessionId: `session_${Date.now()}` });
  }
});

export default router;
