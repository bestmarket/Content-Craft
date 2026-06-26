const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    const hashed = await bcrypt.hash("admin123", 10);
    await client.query(`
      INSERT INTO users (email, password, name, role, is_active)
      VALUES ('admin@viralcraft.com', $1, 'ViralCraft Admin', 'admin', true)
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'admin', is_active = true
    `, [hashed]);
    console.log("✓ Admin user: admin@viralcraft.com / admin123");

    const features = [
      ["content_generation","Content Generation","AI script and title generation for all platforms"],
      ["thumbnail_generation","Thumbnail Generation","AI-powered thumbnail creation"],
      ["pdf_studio","PDF Studio","Premium digital guide creation"],
      ["video_modeler","Video Modeler","Analyze and model viral videos"],
      ["support_chat","Support Chat","Real-time user support chat"],
      ["ai_chatbot","AI Chatbot","ViralCraft AI assistant widget"],
    ];
    for (const [key, label, description] of features) {
      await client.query("INSERT INTO features (key, label, description, is_active) VALUES ($1,$2,$3,true) ON CONFLICT (key) DO NOTHING", [key,label,description]);
    }
    console.log("✓ Features seeded");

    const settings = [
      ["affiliate_link","https://www.invideo.io","Affiliate Link"],
      ["ad_text","Click Here To Create your Digital Product in Minutes with AI","Ad Banner Text"],
      ["video_tool_link","https://www.invideo.io","Video Tool Link"],
      ["support_email","support@viralcraft.com","Support Email"],
      ["platform_name","ViralCraft Studio","Platform Name"],
    ];
    for (const [key, value, label] of settings) {
      await client.query("INSERT INTO settings (key, value, label, updated_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (key) DO NOTHING", [key,value,label]);
    }
    console.log("✓ Settings seeded");

    const prompts = [
      ["MrBeast Style","content","High energy challenge-based content","You are an expert viral content creator in the style of MrBeast. Create high-energy, challenge-based scripts with big hooks, simple language, massive numbers, and surprising twists. Respond ONLY in valid JSON: {titles:[{title,viralityScore}], script, description, tags, hashtags}."],
      ["Educational Tutorial","content","Clear informative step-by-step content","You are an expert educational content creator. Create clear well-structured tutorial scripts. Use hook-teach-close format. Respond ONLY in valid JSON: {titles:[{title,viralityScore}], script, description, tags, hashtags}."],
      ["Motivational Speaker","content","Inspiring story-driven motivational content","You are an expert motivational content creator. Create inspiring story-driven content. Use personal stories, relatable struggles, triumphant conclusions. Respond ONLY in valid JSON: {titles:[{title,viralityScore}], script, description, tags, hashtags}."],
      ["Viral Thumbnail","thumbnail","Click-bait optimized thumbnail prompts","You are an expert viral thumbnail designer. Create detailed DALL-E image prompts for maximum CTR. Include bold text, high-contrast colors, strong emotions, and clear focal points."],
      ["Premium Digital Guide","pdf","Professional value-packed digital products","You are an expert digital product creator. Create premium comprehensive guides worth $47-97. Use clear chapters, actionable insights, expert tips. Respond ONLY in valid JSON: {title, tableOfContents:[], content, aboutSection, authorBio}."],
    ];
    for (const [name, type, description, systemPrompt] of prompts) {
      await client.query("INSERT INTO prompts (name, type, system_prompt, description, is_active, created_at) VALUES ($1,$2,$3,$4,true,NOW()) ON CONFLICT DO NOTHING", [name,type,systemPrompt,description]);
    }
    console.log("✓ Prompts seeded");
    console.log("✓ Seed complete!");
  } finally {
    client.release();
    await pool.end();
  }
}
seed().catch(e => { console.error(e); process.exit(1); });
