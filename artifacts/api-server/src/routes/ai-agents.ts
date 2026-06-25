import { Router } from "express";
import { db } from "@workspace/db";
import { aiAgentsTable, agentConversationsTable, templateProductsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAIWithMeta } from "./ai-utils";
import { nanoid } from "nanoid";

const router = Router();

// ── Public routes (no auth) — must come before /:id catch-all ─────────────────

// GET /ai-agents/public/:agentKey — widget config
router.get("/ai-agents/public/:agentKey", async (req, res) => {
  try {
    const [agent] = await db
      .select({
        agentKey: aiAgentsTable.agentKey,
        name: aiAgentsTable.name,
        agentType: aiAgentsTable.agentType,
        welcomeMessage: aiAgentsTable.welcomeMessage,
        primaryColor: aiAgentsTable.primaryColor,
        position: aiAgentsTable.position,
        avatarEmoji: aiAgentsTable.avatarEmoji,
        isActive: aiAgentsTable.isActive,
        collectLeads: aiAgentsTable.collectLeads,
      })
      .from(aiAgentsTable)
      .where(eq(aiAgentsTable.agentKey, req.params.agentKey))
      .limit(1);

    if (!agent || !agent.isActive) res.status(404).json({ error: "Agent not found" }); return;
    res.json({ agent });
  } catch {
    res.status(500).json({ error: "Failed to load agent" });
  }
});

// POST /ai-agents/public/:agentKey/chat — chat endpoint for the widget
router.post("/ai-agents/public/:agentKey/chat", async (req: any, res) => {
  try {
    const { messages, sessionId, visitorName, visitorEmail } = req.body;

    const [agent] = await db
      .select()
      .from(aiAgentsTable)
      .where(and(eq(aiAgentsTable.agentKey, req.params.agentKey), eq(aiAgentsTable.isActive, true)))
      .limit(1);

    if (!agent) res.status(404).json({ error: "Agent not found or inactive" }); return;

    const sid = sessionId || nanoid(12);

    const aiMessages = (messages || []).map((m: any) => ({ role: m.role, content: m.content }));
    if (!aiMessages.length || aiMessages[aiMessages.length - 1]?.role !== "user") {
      res.status(400).json({ error: "No user message provided" }); return;
    }

    const result = await callAIWithMeta(aiMessages, agent.systemPrompt, 600, 0.7, "[Agent]", "ai_agent");
    const reply = result?.text || "I'm sorry, I couldn't process your request right now. Please try again.";

    const existing = await db
      .select({ id: agentConversationsTable.id })
      .from(agentConversationsTable)
      .where(and(eq(agentConversationsTable.agentId, agent.id), eq(agentConversationsTable.sessionId, sid)))
      .limit(1);

    const updatedMessages = [
      ...(messages || []),
      { role: "assistant", content: reply, timestamp: new Date().toISOString() },
    ];

    const isNewConversation = existing.length === 0;
    const isNewLead = isNewConversation && !!visitorEmail;

    if (!isNewConversation) {
      await db
        .update(agentConversationsTable)
        .set({ messages: updatedMessages, visitorName, visitorEmail, updatedAt: new Date() })
        .where(eq(agentConversationsTable.id, existing[0].id));
    } else {
      await db.insert(agentConversationsTable).values({
        agentId: agent.id,
        sessionId: sid,
        visitorName: visitorName || null,
        visitorEmail: visitorEmail || null,
        messages: updatedMessages,
      });
      await db
        .update(aiAgentsTable)
        .set({
          totalConversations: agent.totalConversations + 1,
          ...(isNewLead ? { totalLeads: agent.totalLeads + 1 } : {}),
        })
        .where(eq(aiAgentsTable.id, agent.id));
    }

    res.json({ reply, sessionId: sid });
  } catch (err: any) {
    console.error("Agent chat error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

// GET /ai-agents/embed/:agentKey.js — the embeddable JS widget
router.get("/ai-agents/embed/:agentKey.js", async (req, res) => {
  const { agentKey } = req.params;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) || (req.headers.host as string);
  const apiBase = `${proto}://${host}`;

  const js = `(function(){
'use strict';
var K='${agentKey}',B='${apiBase}',agent=null,sid=null,msgs=[],open=false;
function init(){
  fetch(B+'/api/ai-agents/public/'+K).then(function(r){return r.json();}).then(function(d){
    if(d.agent&&d.agent.isActive){agent=d.agent;render();}
  }).catch(function(){});
}
function render(){
  var c=agent.primaryColor||'#7c3aed';
  var isLeft=agent.position==='bottom-left';
  var ps=isLeft?'left:20px':'right:20px';
  var ws=isLeft?'left:0':'right:0';
  var st=document.createElement('style');
  st.textContent='#_sxa{position:fixed;bottom:20px;'+ps+';z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}'
    +'#_sxb{width:58px;height:58px;border-radius:50%;background:'+c+';cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 4px 24px rgba(0,0,0,.22);border:none;transition:transform .15s}'
    +'#_sxb:hover{transform:scale(1.08)}'
    +'#_sxw{position:absolute;bottom:72px;'+ws+';width:340px;height:500px;background:#fff;border-radius:18px;box-shadow:0 8px 48px rgba(0,0,0,.18);display:none;flex-direction:column;overflow:hidden}'
    +'#_sxh{background:'+c+';color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}'
    +'#_sxhname{font-weight:700;font-size:14px;flex:1}'
    +'#_sxdot{width:8px;height:8px;background:#4ade80;border-radius:50%}'
    +'#_sxcl{background:none;border:none;color:#fff;cursor:pointer;font-size:22px;padding:0;line-height:1}'
    +'#_sxm{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}'
    +'.sxmsg{max-width:80%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;word-break:break-word}'
    +'.sxbot{background:#f3f4f6;color:#111;align-self:flex-start;border-bottom-left-radius:3px}'
    +'.sxuser{background:'+c+';color:#fff;align-self:flex-end;border-bottom-right-radius:3px}'
    +'#_sxlf{padding:12px;background:#f9fafb;border-top:1px solid #e5e7eb;flex-shrink:0}'
    +'#_sxlf input{width:100%;padding:9px 11px;border:1px solid #d1d5db;border-radius:9px;font-size:12px;margin-bottom:7px;box-sizing:border-box;outline:none;font-family:inherit}'
    +'#_sxlf button{width:100%;padding:10px;background:'+c+';color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer}'
    +'#_sxia{padding:10px 12px;border-top:1px solid #f0f0f0;display:flex;gap:8px;align-items:flex-end;flex-shrink:0}'
    +'#_sxin{flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:9px 12px;font-size:13px;outline:none;resize:none;max-height:80px;font-family:inherit}'
    +'#_sxsd{background:'+c+';border:none;border-radius:10px;padding:9px 14px;color:#fff;cursor:pointer;font-size:15px;line-height:1}'
    +'#_sxsd:disabled{opacity:.45}'
    +'#_sxty{display:flex;gap:5px;padding:10px 14px;background:#f3f4f6;border-radius:14px;border-bottom-left-radius:3px;align-self:flex-start}'
    +'.sxdot{width:7px;height:7px;background:#9ca3af;border-radius:50%;animation:_sxb 1.2s infinite}'
    +'.sxdot:nth-child(2){animation-delay:.2s}.sxdot:nth-child(3){animation-delay:.4s}'
    +'@keyframes _sxb{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}';
  document.head.appendChild(st);
  var w=document.createElement('div');
  w.id='_sxa';
  var lf=agent.collectLeads
    ?'<div id="_sxlf"><input id="_sxn" placeholder="Your name (optional)" autocomplete="name"><input id="_sxe" placeholder="Your email (optional)" type="email" autocomplete="email"><button onclick="_sxSkip()">Start chatting \u2192</button></div>'
    :'';
  var ia=agent.collectLeads?'style="display:none"':'';
  w.innerHTML='<div id="_sxw">'
    +'<div id="_sxh"><span style="font-size:22px">'+agent.avatarEmoji+'</span><span id="_sxhname">'+agent.name+'</span><span id="_sxdot"></span><button id="_sxcl">\u00d7</button></div>'
    +'<div id="_sxm"></div>'
    +lf
    +'<div id="_sxia" '+ia+'><textarea id="_sxin" rows="1" placeholder="Type a message..."></textarea><button id="_sxsd">\u27a4</button></div>'
    +'</div>'
    +'<button id="_sxb">'+agent.avatarEmoji+'</button>';
  document.body.appendChild(w);
  document.getElementById('_sxb').onclick=toggle;
  document.getElementById('_sxcl').onclick=function(e){e.stopPropagation();toggle();};
  document.getElementById('_sxsd').onclick=send;
  document.getElementById('_sxin').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}};
  if(!agent.collectLeads)addMsg('bot',agent.welcomeMessage);
}
window._sxSkip=function(){
  var n=(document.getElementById('_sxn')||{}).value||'';
  var e=(document.getElementById('_sxe')||{}).value||'';
  window._sxName=n||null;window._sxEmail=e||null;
  var lf=document.getElementById('_sxlf');
  if(lf)lf.style.display='none';
  var ia=document.getElementById('_sxia');
  if(ia)ia.style.display='flex';
  addMsg('bot',agent.welcomeMessage);
};
function toggle(){
  open=!open;
  var w=document.getElementById('_sxw');
  if(w)w.style.display=open?'flex':'none';
}
function addMsg(role,text){
  var c=document.getElementById('_sxm');
  if(!c)return;
  var d=document.createElement('div');
  d.className='sxmsg '+(role==='bot'?'sxbot':'sxuser');
  d.textContent=text;
  c.appendChild(d);
  c.scrollTop=c.scrollHeight;
  msgs.push({role:role==='bot'?'assistant':'user',content:text,timestamp:new Date().toISOString()});
}
function addTyping(){
  var c=document.getElementById('_sxm');
  if(!c)return;
  var d=document.createElement('div');
  d.id='_sxty';d.className='sxdot';
  d.innerHTML='<div class="sxdot"></div><div class="sxdot"></div><div class="sxdot"></div>';
  c.appendChild(d);c.scrollTop=c.scrollHeight;
}
function rmTyping(){var t=document.getElementById('_sxty');if(t)t.remove();}
function send(){
  var inp=document.getElementById('_sxin');
  var txt=inp?inp.value.trim():'';
  if(!txt)return;
  inp.value='';
  var btn=document.getElementById('_sxsd');
  if(btn)btn.disabled=true;
  addMsg('user',txt);
  addTyping();
  fetch(B+'/api/ai-agents/public/'+K+'/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({messages:msgs.slice(-20),sessionId:sid,visitorName:window._sxName||null,visitorEmail:window._sxEmail||null})
  }).then(function(r){return r.json();}).then(function(d){
    rmTyping();
    if(d.sessionId)sid=d.sessionId;
    addMsg('bot',d.reply||'Sorry, I could not process that.');
    if(btn)btn.disabled=false;
  }).catch(function(){
    rmTyping();addMsg('bot','Connection error. Please try again.');
    if(btn)btn.disabled=false;
  });
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();`;

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=30");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(js);
});

// ── Authenticated routes ──────────────────────────────────────────────────────

// GET /ai-agents — list user's deployed agents
router.get("/ai-agents", requireAuth, async (req: any, res) => {
  try {
    const agents = await db
      .select()
      .from(aiAgentsTable)
      .where(eq(aiAgentsTable.userId, req.userId))
      .orderBy(desc(aiAgentsTable.createdAt));
    res.json({ agents });
  } catch (err: any) {
    req.log.error({ err }, "List agents error");
    res.status(500).json({ error: "Failed to load agents" });
  }
});

// POST /ai-agents/deploy/:templateId — deploy an AI agent from a template
router.post("/ai-agents/deploy/:templateId", requireAuth, async (req: any, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const [template] = await db
      .select()
      .from(templateProductsTable)
      .where(
        and(
          eq(templateProductsTable.id, templateId),
          eq(templateProductsTable.userId, req.userId),
          eq(templateProductsTable.type, "ai_agent"),
        ),
      )
      .limit(1);

    if (!template) res.status(404).json({ error: "Template not found" }); return;

    const existing = await db
      .select({ id: aiAgentsTable.id })
      .from(aiAgentsTable)
      .where(and(eq(aiAgentsTable.templateId, templateId), eq(aiAgentsTable.userId, req.userId)))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Agent already deployed from this template", agentId: existing[0].id }); return;
    }

    const content = template.templateContent as any;
    const agentKey = nanoid(16);

    const [agent] = await db
      .insert(aiAgentsTable)
      .values({
        userId: req.userId,
        templateId,
        agentKey,
        name: content?.title || template.title,
        agentType: content?.agentType || "custom",
        systemPrompt:
          content?.systemPrompt ||
          `You are a helpful AI assistant called ${template.title}. ${template.description || ""}`,
        welcomeMessage:
          content?.welcomeMessage || `Hi! I'm ${content?.title || template.title}. How can I help you today?`,
        primaryColor: "#7c3aed",
        position: "bottom-right",
        avatarEmoji: "🤖",
        isActive: true,
        collectLeads: true,
      })
      .returning();

    res.json({ agent });
  } catch (err: any) {
    req.log.error({ err }, "Deploy agent error");
    res.status(500).json({ error: "Failed to deploy agent" });
  }
});

// POST /ai-agents — create a custom agent directly
router.post("/ai-agents", requireAuth, async (req: any, res) => {
  try {
    const { name, agentType, systemPrompt, welcomeMessage, primaryColor, position, avatarEmoji } = req.body;
    const agentKey = nanoid(16);

    const [agent] = await db
      .insert(aiAgentsTable)
      .values({
        userId: req.userId,
        agentKey,
        name: name || "My AI Agent",
        agentType: agentType || "custom",
        systemPrompt: systemPrompt || "You are a helpful AI assistant.",
        welcomeMessage: welcomeMessage || "Hi! How can I help you today?",
        primaryColor: primaryColor || "#7c3aed",
        position: position || "bottom-right",
        avatarEmoji: avatarEmoji || "🤖",
        isActive: true,
        collectLeads: true,
      })
      .returning();

    res.json({ agent });
  } catch (err: any) {
    req.log.error({ err }, "Create agent error");
    res.status(500).json({ error: "Failed to create agent" });
  }
});

// GET /ai-agents/:id/conversations — must come before /:id to avoid ambiguity
router.get("/ai-agents/:id/conversations", requireAuth, async (req: any, res) => {
  const agentId = parseInt(req.params.id);
  if (isNaN(agentId)) res.status(400).json({ error: "Invalid id" }); return;
  try {
    const [agent] = await db
      .select({ id: aiAgentsTable.id })
      .from(aiAgentsTable)
      .where(and(eq(aiAgentsTable.id, agentId), eq(aiAgentsTable.userId, req.userId)))
      .limit(1);
    if (!agent) res.status(404).json({ error: "Agent not found" }); return;

    const conversations = await db
      .select()
      .from(agentConversationsTable)
      .where(eq(agentConversationsTable.agentId, agent.id))
      .orderBy(desc(agentConversationsTable.createdAt))
      .limit(100);

    res.json({ conversations });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// GET /ai-agents/:id — get single agent (owner only)
router.get("/ai-agents/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) res.status(400).json({ error: "Invalid id" }); return;
  try {
    const [agent] = await db
      .select()
      .from(aiAgentsTable)
      .where(and(eq(aiAgentsTable.id, id), eq(aiAgentsTable.userId, req.userId)))
      .limit(1);

    if (!agent) res.status(404).json({ error: "Agent not found" }); return;
    res.json({ agent });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load agent" });
  }
});

// PUT /ai-agents/:id — update agent settings
router.put("/ai-agents/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) res.status(400).json({ error: "Invalid id" }); return;
  try {
    const { name, systemPrompt, welcomeMessage, primaryColor, position, avatarEmoji, isActive, collectLeads } =
      req.body;
    const [agent] = await db
      .update(aiAgentsTable)
      .set({
        ...(name !== undefined && { name }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(position !== undefined && { position }),
        ...(avatarEmoji !== undefined && { avatarEmoji }),
        ...(isActive !== undefined && { isActive }),
        ...(collectLeads !== undefined && { collectLeads }),
        updatedAt: new Date(),
      })
      .where(and(eq(aiAgentsTable.id, id), eq(aiAgentsTable.userId, req.userId)))
      .returning();

    if (!agent) res.status(404).json({ error: "Agent not found" }); return;
    res.json({ agent });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update agent" });
  }
});

// DELETE /ai-agents/:id
router.delete("/ai-agents/:id", requireAuth, async (req: any, res) => {
  const agentId = parseInt(req.params.id);
  if (isNaN(agentId)) res.status(400).json({ error: "Invalid id" }); return;
  try {
    const [agent] = await db
      .select({ id: aiAgentsTable.id })
      .from(aiAgentsTable)
      .where(and(eq(aiAgentsTable.id, agentId), eq(aiAgentsTable.userId, req.userId)))
      .limit(1);
    if (!agent) res.status(404).json({ error: "Agent not found" }); return;

    await db.delete(agentConversationsTable).where(eq(agentConversationsTable.agentId, agentId));
    await db.delete(aiAgentsTable).where(eq(aiAgentsTable.id, agentId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

export default router;
