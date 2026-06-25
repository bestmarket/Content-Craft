import { db } from "@workspace/db";
import { scryvoxKnowledgeTable } from "@workspace/db";
import { eq, like, or, sql } from "drizzle-orm";

export type KnowledgeType = "framework" | "template" | "structure" | "formula" | "pattern";

export interface KnowledgeItem {
  id: number;
  type: KnowledgeType;
  title: string;
  description: string;
  content: Record<string, unknown>;
  tags: string[];
  domain?: string | null;
  isSystem: boolean;
  usageCount: number;
}

export interface KnowledgeQueryResult {
  items: KnowledgeItem[];
  byType: Record<KnowledgeType, KnowledgeItem[]>;
}

export async function queryKnowledge(
  topic: string,
  types?: KnowledgeType[],
  limit = 20
): Promise<KnowledgeQueryResult> {
  try {
    const topicWords = topic.toLowerCase().split(" ").filter(w => w.length > 3);
    const conditions: any[] = [];

    for (const word of topicWords.slice(0, 3)) {
      conditions.push(
        like(scryvoxKnowledgeTable.title, `%${word}%`),
        like(scryvoxKnowledgeTable.description, `%${word}%`),
        like(scryvoxKnowledgeTable.domain, `%${word}%`)
      );
    }

    let query = db.select().from(scryvoxKnowledgeTable);

    if (types && types.length > 0) {
      const typeConditions = types.map(t => eq(scryvoxKnowledgeTable.type, t));
      query = query.where(typeConditions.length === 1 ? typeConditions[0] : or(...typeConditions)) as any;
    }

    const all = await query.limit(limit);

    const items = all.map(r => ({
      id: r.id,
      type: r.type as KnowledgeType,
      title: r.title,
      description: r.description,
      content: r.content as Record<string, unknown>,
      tags: (r.tags ?? []) as string[],
      domain: r.domain,
      isSystem: r.isSystem,
      usageCount: r.usageCount,
    }));

    const byType: Record<KnowledgeType, KnowledgeItem[]> = {
      framework: [], template: [], structure: [], formula: [], pattern: [],
    };
    for (const item of items) {
      if (byType[item.type]) byType[item.type].push(item);
    }

    return { items, byType };
  } catch {
    return { items: [], byType: { framework: [], template: [], structure: [], formula: [], pattern: [] } };
  }
}

export async function addKnowledgeItem(item: {
  type: KnowledgeType;
  title: string;
  description: string;
  content: Record<string, unknown>;
  tags?: string[];
  domain?: string;
  isSystem?: boolean;
  createdBy?: number;
}): Promise<number> {
  const [inserted] = await db.insert(scryvoxKnowledgeTable).values({
    type: item.type,
    title: item.title,
    description: item.description,
    content: item.content,
    tags: item.tags ?? [],
    domain: item.domain,
    isSystem: item.isSystem ?? false,
    createdBy: item.createdBy,
  }).returning({ id: scryvoxKnowledgeTable.id });
  return inserted.id;
}

export async function incrementUsage(id: number): Promise<void> {
  await db.update(scryvoxKnowledgeTable)
    .set({ usageCount: sql`${scryvoxKnowledgeTable.usageCount} + 1` })
    .where(eq(scryvoxKnowledgeTable.id, id));
}

export async function deleteKnowledgeItem(id: number): Promise<void> {
  await db.delete(scryvoxKnowledgeTable).where(eq(scryvoxKnowledgeTable.id, id));
}

export async function seedSystemKnowledge(): Promise<void> {
  const existing = await db.select({ id: scryvoxKnowledgeTable.id })
    .from(scryvoxKnowledgeTable)
    .where(eq(scryvoxKnowledgeTable.isSystem, true))
    .limit(1);

  if (existing.length > 0) return;

  const systemItems = [
    {
      type: "framework" as KnowledgeType,
      title: "The Identity → Behavior → Results Loop",
      description: "Core behavior change framework: identity shift precedes all sustainable behavior change",
      content: { principle: "Who you believe you are determines what you do. Change the identity, behavior follows.", steps: ["Identify the target identity", "Define the behavior that identity performs", "Design the environment that makes the behavior automatic", "Collect evidence that reinforces the new identity"], application: "Use in any product focused on personal change — mindset, habits, productivity, relationships" },
      tags: ["identity", "behavior", "change", "mindset", "habits"],
      domain: "mindset",
      isSystem: true,
    },
    {
      type: "framework" as KnowledgeType,
      title: "The 80/20 Leverage Principle",
      description: "Identify the 20% of inputs that drive 80% of outputs and build the entire framework around them",
      content: { principle: "20% of inputs produce 80% of outputs in almost every system", steps: ["Audit all current activities in the domain", "Rank by output produced", "Identify the top 20% by results", "Design a system around those inputs only"], application: "Use in productivity, business, finance, learning — anywhere optimization matters" },
      tags: ["80/20", "pareto", "leverage", "efficiency", "focus"],
      domain: "productivity",
      isSystem: true,
    },
    {
      type: "formula" as KnowledgeType,
      title: "The Problem-Pain-Solution-Transformation Sales Arc",
      description: "The foundational persuasion sequence for any product or service",
      content: { formula: "Problem → Pain → Solution → Transformation", steps: ["Name the problem precisely (not generically)", "Intensify the pain (what it costs to stay there)", "Position solution as the specific bridge", "Paint the transformation (what after looks like)"], note: "The more specifically you can name someone's pain, the more they trust your solution" },
      tags: ["sales", "marketing", "persuasion", "copywriting", "launch"],
      domain: "business",
      isSystem: true,
    },
    {
      type: "template" as KnowledgeType,
      title: "The 9-Chapter Product Structure",
      description: "Proven chapter architecture for premium digital guides and ebooks",
      content: { structure: ["Intro: The Problem Nobody Talks About Honestly", "Chapter 1: Why The Standard Approach Fails", "Chapter 2: The Foundation — What Actually Works", "Chapter 3: The Identity Layer", "Chapter 4: The Core Method", "Chapter 5: The Application System", "Chapter 6: The Advanced Layer", "Chapter 7: Handling Obstacles", "Chapter 8: The Long Game", "Conclusion: Integration and Next Steps"], note: "This structure builds sequentially — each chapter creates the context for the next" },
      tags: ["ebook", "guide", "structure", "chapters", "digital product"],
      isSystem: true,
    },
    {
      type: "formula" as KnowledgeType,
      title: "The Subject Line Curiosity Formula",
      description: "Email subject line formulas that consistently drive high open rates",
      content: { formulas: ["The [X] mistake [audience] makes with [topic]", "Why [common belief] is wrong (and what to do instead)", "I was [wrong/surprised] about [topic]", "[Number] things nobody tells you about [topic]", "The [adjective] truth about [topic]"], principle: "Curiosity gaps + specificity + relevance = opens. Avoid: clickbait, vague promises, overly salesy language" },
      tags: ["email", "subject lines", "marketing", "copywriting", "open rates"],
      domain: "business",
      isSystem: true,
    },
    {
      type: "pattern" as KnowledgeType,
      title: "The Quick Win Chapter Pattern",
      description: "Structure any chapter to deliver one immediate, implementable win in the first 10 minutes of reading",
      content: { pattern: ["Open with a question the reader is already asking themselves", "Promise one specific, tangible shift by end of chapter", "Deliver core concept in 200-300 words", "Provide one concrete action step they can take today", "End with a bridge to why the next chapter matters"], principle: "Every chapter should deliver at least one thing readers can act on immediately" },
      tags: ["chapter", "structure", "ebook", "engagement", "implementation"],
      isSystem: true,
    },
    {
      type: "structure" as KnowledgeType,
      title: "The Before/After/Bridge Framework",
      description: "Universal structure for any persuasive writing, chapter, or section",
      content: { structure: { before: "Paint the current situation with specificity and emotional accuracy", after: "Paint the target situation with equal specificity and emotional resonance", bridge: "Position your content, product, or approach as the specific mechanism that moves someone from before to after" }, note: "Contrast drives desire. The bigger and more vivid the gap between before and after, the stronger the bridge needs to be" },
      tags: ["persuasion", "copywriting", "structure", "marketing", "chapter"],
      isSystem: true,
    },
    {
      type: "formula" as KnowledgeType,
      title: "The Bullet Point AIDA Formula",
      description: "Write sales bullet points that convert: Attention → Interest → Desire → Action",
      content: { formula: "Action word + Specific benefit + [Page/Chapter/Section reference]", examples: ["Discover the single mindset shift that separates consistent achievers from those who plateau (Chapter 3)", "Why everything you know about productivity is optimized for the wrong outcome — and the counterintuitive fix (Chapter 1)", "The exact 3-step framework for [outcome] without [common obstacle] (Chapter 5)"], principle: "Specificity in bullet points outperforms vague benefits by 3-5x in conversion" },
      tags: ["bullet points", "sales page", "copywriting", "conversion", "landing page"],
      domain: "business",
      isSystem: true,
    },
  ];

  for (const item of systemItems) {
    await db.insert(scryvoxKnowledgeTable).values(item);
  }
}
