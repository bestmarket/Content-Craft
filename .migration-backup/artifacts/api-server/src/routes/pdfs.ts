import { Router } from "express";
import { db } from "@workspace/db";
import { pdfHistoryTable, promptsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAI } from "./content";

const router = Router();

router.post("/pdfs/generate", requireAuth, async (req: any, res) => {
  try {
    const { topic, authorName, description, promptId } = req.body;

    let systemPrompt = `You are an expert digital product creator and book author. Create premium, well-structured, informative digital PDFs with professional quality content. Always respond in valid JSON format.`;

    if (promptId) {
      const [p] = await db.select().from(promptsTable).where(eq(promptsTable.id, promptId)).limit(1);
      if (p?.isActive) systemPrompt = p.systemPrompt;
    }

    const userPrompt = `Create a premium high-quality digital PDF guide about: "${topic}"
Author: ${authorName}
${description ? `Additional context: ${description}` : ""}

Create a comprehensive, well-structured digital guide that would sell for $27-97. Include all sections.

Respond ONLY in this exact JSON format:
{
  "title": "Premium Guide Title: Subtitle",
  "tableOfContents": [
    "Chapter 1: Introduction",
    "Chapter 2: Core Concepts",
    "Chapter 3: Advanced Strategies",
    "Chapter 4: Implementation Guide",
    "Chapter 5: Case Studies",
    "Chapter 6: Expert Tips",
    "Conclusion & Next Steps",
    "About the Author"
  ],
  "aboutSection": "About this guide text...",
  "authorBio": "Author bio text...",
  "content": "FULL CONTENT HERE - all chapters with detailed professional content, minimum 2000 words total..."
}`;

    const aiRaw = await callAI(userPrompt, systemPrompt);

    let parsed: any;
    try {
      const jsonMatch = aiRaw.match(/```json\n?([\s\S]*?)\n?```/) || aiRaw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? "{}");
    } catch {
      parsed = {
        title: `The Complete Guide to ${topic}`,
        tableOfContents: ["Introduction", "Core Concepts", "Advanced Strategies", "Conclusion"],
        aboutSection: `This guide covers everything you need to know about ${topic}.`,
        authorBio: `${authorName} is an expert in ${topic}.`,
        content: aiRaw,
      };
    }

    const [saved] = await db.insert(pdfHistoryTable).values({
      userId: req.userId,
      topic,
      authorName,
      title: parsed.title,
      content: parsed.content,
      tableOfContents: parsed.tableOfContents,
      aboutSection: parsed.aboutSection,
      authorBio: parsed.authorBio,
    }).returning();

    res.json({
      id: saved.id,
      title: parsed.title,
      content: parsed.content,
      tableOfContents: parsed.tableOfContents,
      aboutSection: parsed.aboutSection,
      authorBio: parsed.authorBio,
    });
  } catch (err) {
    req.log.error({ err }, "GeneratePdf error");
    res.status(500).json({ error: "PDF generation failed" });
  }
});

router.get("/pdfs/history", requireAuth, async (req: any, res) => {
  try {
    const items = await db.select({
      id: pdfHistoryTable.id,
      topic: pdfHistoryTable.topic,
      authorName: pdfHistoryTable.authorName,
      title: pdfHistoryTable.title,
      createdAt: pdfHistoryTable.createdAt,
    }).from(pdfHistoryTable)
      .where(eq(pdfHistoryTable.userId, req.userId))
      .orderBy(desc(pdfHistoryTable.createdAt));
    res.json(items.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "ListPdfHistory error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
