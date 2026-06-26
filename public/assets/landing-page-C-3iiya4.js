import{a as d,j as e}from"./vendor-query-aVKVmZtb.js";import{u as R,B as p,C as L,L as m,I as u}from"./index-DAq8_Tc2.js";import{T as A}from"./textarea-98GfmlNe.js";import{f as B,G as F,ad as D,ae as M,ac as G}from"./vendor-icons-BXOxJDln.js";import"./vendor-radix-CIHbzh1Q.js";import"./vendor-pdf-CeQKYnpY.js";import"./vendor-charts-hD17swBF.js";const U="/".replace(/\/$/,"")+"/api";function _(){const{toast:t}=R(),[s,y]=d.useState(""),[l,j]=d.useState(""),[x,w]=d.useState(""),[b,k]=d.useState(""),[h,o]=d.useState(""),[n,I]=d.useState(null),[N,T]=d.useState(!1),[f,S]=d.useState("form"),[E,C]=d.useState(0),P=async()=>{if(!s.trim()||!l.trim()){t({title:"Topic and product title are required",variant:"destructive"});return}T(!0);try{const i=localStorage.getItem("token"),r=await fetch(`${U}/landing-page/generate`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({topic:s,productTitle:l,price:x,targetAudience:b,benefits:h})}),c=await r.json();if(!r.ok)throw new Error(c.error);I(c),C(g=>g+1),S("preview"),t({title:"Landing page generated!",description:"JVZoo-style sales page ready"})}catch(i){t({title:i.message??"Generation failed",variant:"destructive"})}finally{T(!1)}},O=()=>{if(!n)return;const i=v(n);navigator.clipboard.writeText(i),t({title:"Full HTML copied!",description:"Paste into any web host or file"})},z=()=>{if(!n)return;const i=v(n),r=new Blob([i],{type:"text/html"}),c=URL.createObjectURL(r),g=document.createElement("a");g.href=c,g.download=`${l.slice(0,30).replace(/\s+/g,"-")}-sales-page.html`,g.click(),URL.revokeObjectURL(c)},$=()=>{if(!n)return;const i=v(n),r=new Blob([i],{type:"text/html"}),c=URL.createObjectURL(r);window.open(c,"_blank")};return e.jsxs("div",{className:"max-w-4xl mx-auto space-y-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-foreground",children:"Landing Page Generator"}),e.jsxs("p",{className:"text-muted-foreground text-sm mt-1",children:["Generate a ",e.jsx("span",{className:"font-semibold text-primary",children:"high-converting JVZoo-style sales page"})," — mobile-first, countdown timer, trust badges, 3D book mockup"]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(p,{variant:f==="form"?"default":"outline",size:"sm",onClick:()=>S("form"),children:"Build Page"}),n&&e.jsx(p,{variant:f==="preview"?"default":"outline",size:"sm",onClick:()=>S("preview"),children:"Preview"})]}),f==="form"&&e.jsxs(L,{className:"p-6 border space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx(m,{className:"text-sm font-medium mb-1.5 block",children:"Product Title *"}),e.jsx(u,{placeholder:"e.g. The 7-Figure Dropshipping Blueprint",value:l,onChange:i=>j(i.target.value)})]}),e.jsxs("div",{children:[e.jsx(m,{className:"text-sm font-medium mb-1.5 block",children:"Niche / Topic *"}),e.jsx(u,{placeholder:"e.g. E-commerce, dropshipping",value:s,onChange:i=>y(i.target.value)})]}),e.jsxs("div",{children:[e.jsx(m,{className:"text-sm font-medium mb-1.5 block",children:"Price (optional)"}),e.jsx(u,{placeholder:"e.g. $47",value:x,onChange:i=>w(i.target.value)})]}),e.jsxs("div",{children:[e.jsx(m,{className:"text-sm font-medium mb-1.5 block",children:"Target Audience (optional)"}),e.jsx(u,{placeholder:"e.g. Beginner entrepreneurs aged 18-35",value:b,onChange:i=>k(i.target.value)})]})]}),e.jsxs("div",{children:[e.jsx(m,{className:"text-sm font-medium mb-1.5 block",children:"Key Benefits (optional)"}),e.jsx(A,{placeholder:"List what customers will gain from your product...",value:h,onChange:i=>o(i.target.value),rows:3})]}),e.jsx("div",{className:"grid grid-cols-3 gap-2 py-2 border-t",children:[{icon:"⏱",text:"15-min countdown timer built-in"},{icon:"📱",text:"Mobile-first / WhatsApp ready"},{icon:"🔒",text:"Trust badges + pulsing CTA"}].map(({icon:i,text:r})=>e.jsxs("div",{className:"flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2",children:[e.jsx("span",{children:i}),e.jsx("span",{className:"text-xs text-primary font-medium leading-tight",children:r})]},r))}),e.jsx(p,{onClick:P,disabled:N,className:"w-full h-12 bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-base font-semibold",children:N?e.jsxs(e.Fragment,{children:[e.jsx(B,{className:"w-4 h-4 animate-spin mr-2"})," Building JVZoo Sales Page..."]}):e.jsxs(e.Fragment,{children:[e.jsx(F,{className:"w-4 h-4 mr-2"})," Generate High-Converting Sales Page"]})})]}),f==="preview"&&n&&e.jsxs("div",{className:"space-y-4 animate-in fade-in duration-500",children:[e.jsxs("div",{className:"flex gap-3 flex-wrap",children:[e.jsxs(p,{onClick:O,variant:"outline",children:[e.jsx(D,{className:"w-4 h-4 mr-2"})," Copy HTML"]}),e.jsxs(p,{onClick:z,variant:"outline",children:[e.jsx(M,{className:"w-4 h-4 mr-2"})," Download .html"]}),e.jsxs(p,{onClick:$,className:"bg-primary hover:bg-primary/90",children:[e.jsx(G,{className:"w-4 h-4 mr-2"})," Open Full Page"]})]}),e.jsxs("div",{className:"rounded-xl border overflow-hidden shadow-xl bg-slate-950",children:[e.jsxs("div",{className:"px-4 py-2 bg-slate-800 flex items-center gap-2 border-b border-slate-700",children:[e.jsxs("div",{className:"flex gap-1.5",children:[e.jsx("div",{className:"w-3 h-3 rounded-full bg-red-500"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-yellow-500"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-green-500"})]}),e.jsxs("div",{className:"flex-1 bg-slate-700 rounded text-xs text-muted-foreground text-center py-0.5 px-3 mx-4 font-mono",children:[l.slice(0,40)," — Sales Page"]})]}),e.jsx("iframe",{srcDoc:v(n),className:"w-full",style:{height:"700px",border:"none"},title:"Landing Page Preview",sandbox:"allow-scripts"},E)]}),e.jsx("p",{className:"text-xs text-muted-foreground text-center",children:'Preview above. Click "Open Full Page" to see it in your browser exactly as visitors will.'})]})]})}function a(t=""){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function v(t){const s=a(t.productTitle??""),y=t.pricingSection?.currentPrice??"47",l=t.pricingSection?.originalPrice??"97",x=`https://image.pollinations.ai/prompt/${encodeURIComponent(`professional premium ebook cover ${t.productTitle} dark luxury gold`)}?width=300&height=420&nologo=true&seed=42`,w=(t.benefitsSection?.benefits??[]).map(o=>`
      <div class="benefit-item">
        <div class="check-icon">✓</div>
        <div>
          <div class="benefit-title">${a(o.title)}</div>
          <div class="benefit-desc">${a(o.description)}</div>
        </div>
      </div>`).join(""),b=(t.socialProof?.testimonials??[]).map(o=>`
      <div class="testimonial-card">
        <div class="stars">${"★".repeat(o.rating??5)}</div>
        <div class="testimonial-text">"${a(o.text)}"</div>
        <div class="testimonial-author">
          <strong>${a(o.name)}</strong>
          <span>${a(o.role)}</span>
        </div>
      </div>`).join(""),k=(t.pricingSection?.includedItems??[]).map(o=>`<div class="included-item"><span class="check-green">✓</span> ${a(o)}</div>`).join(""),h=(t.problemSection?.points??[]).map(o=>`<div class="problem-item"><span class="x-red">✗</span> ${a(o)}</div>`).join("");return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="theme-color" content="#0a0a1a">
<title>${s} — Official Sales Page</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Montserrat',Arial,sans-serif;background:#0a0a1a;color:#f1f5f9;-webkit-font-smoothing:antialiased;overflow-x:hidden}

  /* ── SCARCITY BAR ────────────────────────────────── */
  .scarcity-bar{background:linear-gradient(90deg,#7f1d1d,#991b1b,#7f1d1d);text-align:center;padding:10px 16px;font-size:.78rem;font-weight:700;letter-spacing:.05em;color:#fecaca;border-bottom:2px solid #ef4444;animation:scarcity-pulse 2s ease-in-out infinite}
  @keyframes scarcity-pulse{0%,100%{background:linear-gradient(90deg,#7f1d1d,#991b1b,#7f1d1d)}50%{background:linear-gradient(90deg,#991b1b,#b91c1c,#991b1b)}}

  /* ── HERO ───────────────────────────────────────── */
  .hero{background:linear-gradient(160deg,#0a0a1a 0%,#1a0533 40%,#0d0d2b 100%);padding:50px 20px 60px;text-align:center;position:relative;overflow:hidden;border-bottom:1px solid rgba(124,58,237,.3)}
  .hero::before{content:'';position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 70%);pointer-events:none}
  .badge{display:inline-block;background:rgba(234,179,8,.15);border:1px solid rgba(234,179,8,.4);color:#fbbf24;padding:6px 18px;border-radius:50px;font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px}
  .hero-headline{font-size:clamp(1.6rem,5vw,2.6rem);font-weight:900;line-height:1.15;margin-bottom:16px;color:#fff}
  .hero-headline .highlight-yellow{color:#fbbf24;display:inline}
  .hero-headline .highlight-red{color:#f87171;display:inline}
  .hero-subline{font-size:clamp(.95rem,2.5vw,1.15rem);color:#94a3b8;max-width:600px;margin:0 auto 30px;line-height:1.6}

  /* ── BOOK MOCKUP ────────────────────────────────── */
  .book-wrap{display:flex;justify-content:center;margin:28px 0 10px;perspective:900px}
  .book-3d{position:relative;width:180px;transform:rotateY(-12deg) rotateX(3deg);transform-style:preserve-3d;transition:transform .4s ease;filter:drop-shadow(-12px 20px 40px rgba(0,0,0,.8))}
  .book-3d:hover{transform:rotateY(-5deg) rotateX(1deg) scale(1.04)}
  .book-cover{width:180px;height:252px;border-radius:4px 10px 10px 4px;overflow:hidden;position:relative;box-shadow:6px 0 20px rgba(0,0,0,.6)}
  .book-cover img{width:100%;height:100%;object-fit:cover;display:block}
  .book-cover-fallback{width:100%;height:100%;background:linear-gradient(145deg,#1e1b4b,#4c1d95,#1e1b4b);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}
  .book-cover-fallback .fallback-title{font-size:.75rem;font-weight:900;color:#e9d5ff;line-height:1.3;text-transform:uppercase;letter-spacing:.06em}
  .book-gloss{position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,.18) 0%,transparent 100%);border-radius:4px 10px 0 0;pointer-events:none}
  .book-spine{position:absolute;left:-14px;top:4px;bottom:4px;width:14px;background:linear-gradient(90deg,#1e0a4b,#3b0f8a);border-radius:3px 0 0 3px;transform:rotateY(-90deg);transform-origin:right center}

  /* ── COUNTDOWN ──────────────────────────────────── */
  .countdown-wrap{background:linear-gradient(135deg,#1c0505,#3b0404);border:2px solid #ef4444;border-radius:14px;padding:20px 24px;margin:30px auto;max-width:480px;text-align:center;box-shadow:0 0 30px rgba(239,68,68,.25)}
  .countdown-label{font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fca5a5;margin-bottom:10px}
  .countdown-digits{display:flex;justify-content:center;gap:12px;align-items:center}
  .digit-box{background:#0a0a1a;border:1px solid rgba(239,68,68,.4);border-radius:8px;padding:10px 14px;min-width:56px}
  .digit-num{font-size:2rem;font-weight:900;color:#ef4444;line-height:1;display:block}
  .digit-label{font-size:.6rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-top:2px;display:block}
  .digit-sep{font-size:1.8rem;font-weight:900;color:#ef4444;align-self:flex-start;padding-top:8px}
  .countdown-sub{font-size:.75rem;color:#94a3b8;margin-top:10px}

  /* ── CTA BUTTON ─────────────────────────────────── */
  .cta-primary{display:block;width:100%;max-width:480px;margin:0 auto;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;font-size:1.15rem;font-weight:900;padding:20px 24px;border-radius:12px;border:none;cursor:pointer;text-align:center;text-decoration:none;letter-spacing:.02em;line-height:1.3;animation:cta-pulse 2.2s ease-in-out infinite;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(22,163,74,.45)}
  .cta-primary::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:shimmer 2.5s infinite}
  @keyframes cta-pulse{0%,100%{box-shadow:0 8px 32px rgba(22,163,74,.45),0 0 0 0 rgba(22,163,74,.5)}50%{box-shadow:0 8px 40px rgba(22,163,74,.65),0 0 0 12px rgba(22,163,74,0)}}
  @keyframes shimmer{0%{left:-100%}100%{left:200%}}
  .cta-sub{font-size:.7rem;font-weight:400;opacity:.85;display:block;margin-top:4px}
  .trust-badges{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:14px}
  .trust-badge{display:flex;align-items:center;gap:6px;font-size:.7rem;color:#64748b;font-weight:600}
  .trust-badge .icon{font-size:1rem}

  /* ── SECTIONS ───────────────────────────────────── */
  .section{padding:52px 20px;max-width:860px;margin:0 auto}
  .section-dark{background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06)}
  .section-headline{font-size:clamp(1.3rem,4vw,2rem);font-weight:900;text-align:center;margin-bottom:10px;color:#fff;line-height:1.2}
  .section-sub{text-align:center;color:#64748b;font-size:.9rem;margin-bottom:36px}

  /* ── PROBLEM ────────────────────────────────────── */
  .problem-item{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:flex-start;gap:14px;font-size:.92rem;color:#cbd5e1;line-height:1.5}
  .x-red{color:#ef4444;font-weight:900;font-size:1.1rem;flex-shrink:0;margin-top:1px}

  /* ── SOLUTION ───────────────────────────────────── */
  .solution-wrap{background:linear-gradient(135deg,rgba(124,58,237,.12),rgba(219,39,119,.08));border:1px solid rgba(124,58,237,.25);border-radius:16px;padding:32px;text-align:center}
  .solution-wrap p{color:#94a3b8;font-size:1rem;line-height:1.7;max-width:620px;margin:12px auto 0}

  /* ── BENEFITS ───────────────────────────────────── */
  .benefits-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
  .benefit-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px 20px;display:flex;gap:14px;align-items:flex-start}
  .check-icon{width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#db2777);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem;flex-shrink:0;margin-top:2px}
  .benefit-title{font-weight:700;font-size:.95rem;color:#e2e8f0;margin-bottom:4px}
  .benefit-desc{font-size:.82rem;color:#64748b;line-height:1.55}

  /* ── TESTIMONIALS ───────────────────────────────── */
  .testimonials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
  .testimonial-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:22px;position:relative}
  .testimonial-card::before{content:'"';position:absolute;top:10px;right:16px;font-size:3rem;color:rgba(124,58,237,.2);font-family:Georgia,serif;line-height:1}
  .stars{color:#f59e0b;font-size:1rem;margin-bottom:10px;letter-spacing:2px}
  .testimonial-text{font-size:.88rem;color:#94a3b8;line-height:1.6;font-style:italic;margin-bottom:14px}
  .testimonial-author{display:flex;flex-direction:column;gap:2px}
  .testimonial-author strong{font-size:.88rem;color:#e2e8f0}
  .testimonial-author span{font-size:.75rem;color:#475569}

  /* ── PRICING ────────────────────────────────────── */
  .pricing-outer{background:linear-gradient(160deg,#0f0f2e,#1a0533);border-top:1px solid rgba(124,58,237,.2);padding:60px 20px}
  .pricing-box{background:linear-gradient(145deg,#0f172a,#1e1b4b);border:2px solid rgba(124,58,237,.5);border-radius:20px;padding:36px 28px;max-width:460px;margin:0 auto;text-align:center;box-shadow:0 24px 80px rgba(124,58,237,.25),inset 0 1px 0 rgba(255,255,255,.06)}
  .price-orig{font-size:1rem;color:#475569;text-decoration:line-through;margin-bottom:4px}
  .price-now-label{font-size:.72rem;font-weight:700;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;margin-bottom:4px}
  .price-now{font-size:4rem;font-weight:900;color:#fbbf24;line-height:1;margin-bottom:8px}
  .price-note{font-size:.75rem;color:#475569;margin-bottom:28px}
  .included-item{text-align:left;padding:8px 0;font-size:.87rem;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:10px}
  .check-green{color:#10b981;font-weight:900}
  .guarantee-box{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:12px 16px;margin:20px 0;font-size:.8rem;color:#6ee7b7;line-height:1.5}

  /* ── FINAL CTA ──────────────────────────────────── */
  .final-section{background:linear-gradient(160deg,#0a0a1a,#1a0533,#0a0a1a);padding:60px 20px;text-align:center;border-top:1px solid rgba(124,58,237,.2)}
  .final-urgency{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:10px;display:inline-block;padding:8px 20px;font-size:.78rem;font-weight:700;color:#fca5a5;letter-spacing:.08em;text-transform:uppercase;margin-bottom:24px}

  /* ── FOOTER ─────────────────────────────────────── */
  .footer{background:#050510;padding:24px 20px;text-align:center;border-top:1px solid rgba(255,255,255,.05)}
  .footer p{font-size:.72rem;color:#334155;line-height:1.7}

  /* ── MOBILE ─────────────────────────────────────── */
  @media(max-width:600px){
    .hero{padding:36px 16px 48px}
    .book-3d{width:150px;transform:rotateY(-8deg) rotateX(2deg)}
    .book-cover{width:150px;height:210px}
    .digit-box{min-width:46px;padding:8px 10px}
    .digit-num{font-size:1.6rem}
    .pricing-box{padding:28px 18px}
    .price-now{font-size:3rem}
    .section{padding:40px 16px}
  }
</style>
</head>
<body>

<!-- SCARCITY BAR -->
<div class="scarcity-bar">
  🔥 LIMITED TIME OFFER — This price expires when the timer hits zero!
</div>

<!-- HERO -->
<div class="hero">
  <div class="badge">⚡ OFFICIAL RELEASE — Special Founder's Price</div>
  <h1 class="hero-headline">${t.heroHeadline?.replace(/\b(FREE|PROVEN|GUARANTEED|INSTANT|SECRET|REVEALED)\b/g,'<span class="highlight-yellow">$1</span>').replace(/\b(WARNING|STOP|URGENT|CRITICAL)\b/g,'<span class="highlight-red">$1</span>')??a(t.heroHeadline)}</h1>
  <p class="hero-subline">${a(t.heroSubheadline)}</p>

  <!-- 3D BOOK MOCKUP -->
  <div class="book-wrap">
    <div class="book-3d">
      <div class="book-cover" id="book-cover">
        <img
          src="${x}"
          alt="${s} cover"
          style="width:100%;height:100%;object-fit:cover;display:block"
          onerror="this.style.display='none';document.getElementById('book-fallback').style.display='flex'"
          onload="document.getElementById('book-fallback').style.display='none'"
        />
        <div id="book-fallback" class="book-cover-fallback" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0">
          <div class="fallback-title">${s}</div>
        </div>
        <div class="book-gloss"></div>
      </div>
      <div class="book-spine"></div>
    </div>
  </div>

  <!-- COUNTDOWN TIMER -->
  <div class="countdown-wrap">
    <div class="countdown-label">⚠️ Special Price Expires In:</div>
    <div class="countdown-digits">
      <div class="digit-box"><span class="digit-num" id="cd-min">15</span><span class="digit-label">Mins</span></div>
      <div class="digit-sep">:</div>
      <div class="digit-box"><span class="digit-num" id="cd-sec">00</span><span class="digit-label">Secs</span></div>
    </div>
    <div class="countdown-sub">Price increases once timer expires — don't miss this.</div>
  </div>

  <a href="#order" class="cta-primary">
    ✅ YES — Give Me Instant Access Now!
    <span class="cta-sub">Secure Checkout • Instant Download • 30-Day Guarantee</span>
  </a>
  <div class="trust-badges">
    <div class="trust-badge"><span class="icon">🔒</span> 256-bit SSL Secure</div>
    <div class="trust-badge"><span class="icon">💳</span> Secure Payment</div>
    <div class="trust-badge"><span class="icon">✅</span> 30-Day Money Back</div>
    <div class="trust-badge"><span class="icon">⚡</span> Instant Access</div>
  </div>
</div>

<!-- PROBLEM SECTION -->
<div class="section-dark" style="padding:52px 20px">
  <div class="section" style="padding:0">
    <h2 class="section-headline" style="color:#f87171">⛔ Does This Sound Familiar?</h2>
    <p class="section-sub">${a(t.problemSection?.headline)}</p>
    ${h}
  </div>
</div>

<!-- SOLUTION -->
<div style="padding:52px 20px">
  <div class="section" style="padding:0">
    <div class="solution-wrap">
      <h2 class="section-headline" style="color:#a78bfa">💡 Introducing: ${s}</h2>
      <p>${a(t.solutionSection?.description)}</p>
    </div>
  </div>
</div>

<!-- BENEFITS -->
<div class="section-dark" style="padding:52px 20px">
  <div class="section" style="padding:0">
    <h2 class="section-headline">🎯 ${a(t.benefitsSection?.headline)}</h2>
    <p class="section-sub">Everything you get when you say YES today</p>
    <div class="benefits-grid">
      ${w}
    </div>
  </div>
</div>

<!-- TESTIMONIALS -->
<div style="padding:52px 20px">
  <div class="section" style="padding:0">
    <h2 class="section-headline">⭐ ${a(t.socialProof?.headline)}</h2>
    <p class="section-sub">Real results from real people</p>
    <div class="testimonials-grid">
      ${b}
    </div>
  </div>
</div>

<!-- PRICING -->
<div id="order" class="pricing-outer">
  <div class="section" style="padding:0">
    <h2 class="section-headline">${a(t.pricingSection?.headline)}</h2>
    <p class="section-sub">One-time payment — No subscriptions — No hidden fees</p>
    <div class="pricing-box">
      <div class="price-orig">Regular Price: $${a(l)}</div>
      <div class="price-now-label">Today Only</div>
      <div class="price-now">$${a(y)}</div>
      <div class="price-note">One-time investment • Instant access after payment</div>
      <div>
        ${k}
      </div>
      <div class="guarantee-box">
        🛡️ ${a(t.pricingSection?.guarantee)}
      </div>
      <a href="#" class="cta-primary">
        🔐 Add to Cart — Get Instant Access
        <span class="cta-sub">Secure Checkout · SSL Encrypted · Instant Download</span>
      </a>
      <div class="trust-badges" style="margin-top:16px">
        <div class="trust-badge"><span class="icon">🔒</span> SSL Secure</div>
        <div class="trust-badge"><span class="icon">💳</span> Safe Payment</div>
        <div class="trust-badge"><span class="icon">💰</span> Money-Back</div>
      </div>
    </div>
  </div>
</div>

<!-- FINAL CTA -->
<div class="final-section">
  <div class="final-urgency">⚠️ Warning: Price Increases Soon</div>
  <h2 class="section-headline" style="margin-bottom:10px">${a(t.finalCta?.headline)}</h2>
  <p style="color:#475569;font-size:.9rem;max-width:520px;margin:0 auto 28px;line-height:1.6">${a(t.finalCta?.subtext)}</p>
  <a href="#order" class="cta-primary" style="max-width:420px">
    ${a(t.finalCta?.buttonText)} — Claim Your Copy Now →
    <span class="cta-sub">30-Day Money-Back Guarantee • No Risk</span>
  </a>
</div>

<!-- FOOTER -->
<div class="footer">
  <p>© ${new Date().getFullYear()} ${s}. All Rights Reserved.<br>
  This page is not affiliated with or endorsed by any third party.<br>
  Results may vary. Testimonials are from real customers but individual results are not guaranteed.<br>
  <a href="#" style="color:#7c3aed;text-decoration:none">Privacy Policy</a> &nbsp;·&nbsp;
  <a href="#" style="color:#7c3aed;text-decoration:none">Terms of Service</a> &nbsp;·&nbsp;
  <a href="#" style="color:#7c3aed;text-decoration:none">Contact</a>
  </p>
</div>

<script>
(function(){
  var total = 15 * 60;
  var stored = sessionStorage.getItem('vc_countdown');
  if(stored){ total = parseInt(stored,10); }
  function tick(){
    if(total <= 0){ total = 0; }
    var m = Math.floor(total / 60);
    var s = total % 60;
    var em = document.getElementById('cd-min');
    var es = document.getElementById('cd-sec');
    if(em) em.textContent = (m < 10 ? '0' : '') + m;
    if(es) es.textContent = (s < 10 ? '0' : '') + s;
    if(total > 0){
      total--;
      sessionStorage.setItem('vc_countdown', total.toString());
      setTimeout(tick, 1000);
    } else {
      var cw = document.querySelector('.countdown-wrap');
      if(cw){ cw.innerHTML = '<div style="font-weight:900;color:#ef4444;font-size:1rem;padding:8px 0">⛔ OFFER EXPIRED — PRICE HAS INCREASED</div>'; }
    }
  }
  tick();
})();
<\/script>
</body>
</html>`}export{_ as default};
