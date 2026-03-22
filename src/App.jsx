import { useState, useEffect, useCallback } from "react";

// ─── AIRTABLE CONFIG ──────────────────────────────────────────────────────────
const AIRTABLE_TOKEN   = "patRxn1xoZuxdlkKA.2a8643431e963856563e17e20d233f123223e8965c36c969251e8b0c5c7c2ba2";
const AIRTABLE_BASE_ID = "appLJfM0uboPvSB0E";
const AIRTABLE_TABLE   = "Articles";

// Fetch articles from Airtable — only Published records, sorted by Slot
async function fetchArticles() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula={Published}=1&sort[0][field]=Slot&sort[0][direction]=asc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
  const data = await res.json();
  return data.records.map(r => ({
    id:         r.id,
    slot:       r.fields["Slot"]            || 0,
    category:   (r.fields["Category"]       || "consumer").toLowerCase(),
    tag:        r.fields["Tag"]             || "",
    isLead:     r.fields["Is Lead"]         || false,
    source:     r.fields["Source EN"]       || "",
    sourceZH:   r.fields["Source ZH"]       || "",
    url:        r.fields["Original URL"]    || "#",
    date:       r.fields["Date"]            ? formatDate(r.fields["Date"]) : "",
    time:       r.fields["Time"]            || "",
    readTime:   r.fields["Read Time"]       || "5 min",
    headline:   r.fields["Headline"]        || "",
    summary:    r.fields["Summary"]         || "",
    body:       r.fields["Body"]            || "",
    matters:    r.fields["Why It Matters"]  || "",
    author:     r.fields["Author"]          || "ChinaPulse Editorial",
  }));
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

function getTodayFormatted() {
  return new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  red:"#C8102E", bg:"#FFFFFF", bgAlt:"#F7F6F3", bgAlt2:"#FAFAF8",
  border:"#E2E0DB", borderLight:"#EBEBEB",
  text:"#1a1a1a", textSub:"#4a4a4a", textMuted:"#888880",
  serif:"Georgia,'Times New Roman',serif",
  sans:"'Arial',Helvetica,sans-serif",
  mono:"'Courier New',Courier,monospace",
};

const CATS = [
  { id:"all",      label:"All",      color:"#C8102E" },
  { id:"consumer", label:"Consumer", color:"#2E7D52" },
  { id:"retail",   label:"Retail",   color:"#9B6B3E" },
  { id:"policy",   label:"Policy",   color:"#1B5FA8" },
  { id:"tech",     label:"Tech",     color:"#6B3A8A" },
  { id:"travel",   label:"Travel",   color:"#1B7A8A" },
];

const catById = id => CATS.find(c=>c.id===id.toLowerCase())||CATS[0];

// ─── LEGAL ────────────────────────────────────────────────────────────────────
const LEGAL = {
  privacy:`**Privacy Policy**\n\nLast updated: March 2026\n\nChinaPulse is operated by Giada Deng. This Privacy Policy explains how we collect, use, and protect your personal information.\n\n**Information We Collect**\n\nWe collect your email address when you subscribe to our daily digest. We may collect anonymised usage data via analytics tools.\n\n**How We Use Your Information**\n\nYour email address is used solely to send you the ChinaPulse daily or weekly digest. We do not sell, rent, or share your personal information with third parties for marketing purposes.\n\n**Email Communications**\n\nYou may unsubscribe at any time by clicking the unsubscribe link in any email, or by contacting us at giadadeng1203@gmail.com.\n\n**Data Retention**\n\nWe retain your email address for as long as you remain subscribed. Upon unsubscription, your data is deleted within 30 days.\n\n**Contact**\n\nFor any privacy-related queries, contact giadadeng1203@gmail.com.`,
  cookies:`**Cookie Policy**\n\nLast updated: March 2026\n\nChinaPulse uses cookies to operate the Site and improve your experience.\n\n**Essential Cookies**\n\nThese are required for the Site to function correctly, including session and preference cookies.\n\n**Analytics Cookies**\n\nWe may use anonymised analytics to understand aggregate traffic. No personally identifiable information is collected.\n\n**Third-Party Cookies**\n\nWe do not permit third-party advertising cookies. External sites you visit via our links operate under their own cookie policies.\n\n**Managing Cookies**\n\nYou can disable cookies in your browser settings. Disabling essential cookies may affect Site functionality.\n\n**Contact**\n\nQuestions? Email giadadeng1203@gmail.com.`,
  terms:`**Terms of Use**\n\nLast updated: March 2026\n\n**Content and Copyright**\n\nAll original editorial content on ChinaPulse — including summaries, translations, analysis, and commentary — is the intellectual property of ChinaPulse and may not be reproduced without written permission.\n\nChinaPulse summarises and translates content from third-party sources for editorial and informational purposes. We link to and credit all original sources.\n\n**Not Investment Advice**\n\nNothing on ChinaPulse constitutes financial, investment, legal, or business advice. All content is provided for informational purposes only.\n\n**Accuracy**\n\nWe endeavour to ensure all content is accurate at time of publication. ChinaPulse is not liable for errors or omissions.\n\n**External Links**\n\nLinks to third-party websites are provided for convenience. ChinaPulse is not responsible for the content of external sites.\n\n**Contact**\n\ngiadadeng1203@gmail.com`,
};

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Header({ onNav, activePage, search, setSearch, showSources, setShowSources }) {
  return (
    <header style={{ position:"sticky", top:0, zIndex:90, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(8px)", borderBottom:`2px solid ${C.border}` }}>
      <div style={{ background:C.red, padding:"0.3rem 1.5rem", display:"flex", alignItems:"center", gap:"1.2rem" }}>
        <span style={{ fontSize:"11px", fontFamily:C.sans, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.85)", borderRight:"1px solid rgba(255,255,255,0.3)", paddingRight:"1.2rem", whiteSpace:"nowrap" }}>● LIVE</span>
        <div style={{ flex:1, overflow:"hidden", color:"#fff", fontSize:"12px", fontFamily:C.mono }}>
          Daily China intelligence — Consumer · Retail · Policy · Tech · Travel
        </div>
        <span style={{ fontSize:"11px", fontFamily:C.mono, color:"rgba(255,255,255,0.7)", whiteSpace:"nowrap" }}>
          {new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}
        </span>
      </div>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.85rem 0 0.7rem" }}>
          <div onClick={()=>onNav("home")} style={{ cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"0.65rem" }}>
              <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, letterSpacing:"-0.02em", color:C.text, lineHeight:1 }}>
                China<span style={{ color:C.red }}>Pulse</span>
              </h1>
              <span style={{ fontSize:"13px", color:C.textMuted, fontFamily:C.serif, fontStyle:"italic" }}>中国脉搏</span>
            </div>
            <p style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:600, color:C.textMuted, letterSpacing:"0.09em", marginTop:"0.18rem", textTransform:"uppercase" }}>Daily Intelligence for Global China Watchers</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"0.55rem", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:C.textMuted, pointerEvents:"none" }}>⌕</span>
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", color:C.text, padding:"0.42rem 0.75rem 0.42rem 1.8rem", fontSize:"13px", fontFamily:C.sans, outline:"none", width:145 }} />
            </div>
            <button onClick={()=>setShowSources(!showSources)} style={{ background:showSources?C.red+"10":"#fff", border:`1px solid ${showSources?C.red:C.border}`, color:showSources?C.red:C.textSub, padding:"0.42rem 0.78rem", borderRadius:"2px", cursor:"pointer", fontSize:"11px", fontFamily:C.sans, fontWeight:600 }}>Sources</button>
            <button onClick={()=>onNav("submit")} style={{ background:C.red, color:"white", border:"none", padding:"0.42rem 0.88rem", borderRadius:"2px", cursor:"pointer", fontSize:"11px", fontFamily:C.sans, fontWeight:700 }}>+ Submit</button>
          </div>
        </div>
        {activePage==="home" && (
          <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
            {CATS.map(cat=>{
              return (
                <button key={cat.id} onClick={()=>onNav("home", cat.id)}
                  style={{ background:"none", border:"none", borderBottom:`3px solid transparent`, color:C.textMuted, padding:"0.48rem 0.9rem", cursor:"pointer", fontSize:"12px", fontFamily:C.sans, fontWeight:400, letterSpacing:"0.04em", whiteSpace:"nowrap", textTransform:"uppercase" }}>
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

function Footer({ onNav }) {
  return (
    <footer style={{ borderTop:`2px solid ${C.border}`, padding:"1.5rem", background:C.bgAlt, marginTop:"2rem" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1.5rem", marginBottom:"1.1rem" }}>
          <div>
            <div style={{ fontFamily:C.serif, fontSize:"16px", fontWeight:700, color:C.text, marginBottom:"0.25rem" }}>
              China<span style={{ color:C.red }}>Pulse</span>
              <span style={{ color:C.textMuted, fontSize:"13px", marginLeft:"0.45rem", fontStyle:"italic" }}>中国脉搏</span>
            </div>
            <p style={{ fontFamily:C.sans, fontSize:"11px", color:C.textMuted, lineHeight:1.65, maxWidth:280 }}>
              Daily China intelligence for global business leaders. Translated, summarised, and decoded every weekday.
            </p>
          </div>
          <div style={{ display:"flex", gap:"3rem", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Company</div>
              {[["about","About"],["contact","Contact Us"]].map(([p,l])=>(
                <div key={p} onClick={()=>onNav(p)} style={{ fontFamily:C.sans, fontSize:"12px", color:C.textSub, cursor:"pointer", marginBottom:"0.35rem" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Legal</div>
              {[["privacy","Privacy Policy"],["cookies","Cookie Policy"],["terms","Terms of Use"]].map(([p,l])=>(
                <div key={p} onClick={()=>onNav(p)} style={{ fontFamily:C.sans, fontSize:"12px", color:C.textSub, cursor:"pointer", marginBottom:"0.35rem" }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"0.85rem", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
          <span style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>© 2026 ChinaPulse. All rights reserved.</span>
          <span style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>Summaries translated & edited for informational purposes. Not investment advice.</span>
        </div>
      </div>
    </footer>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
      {[1,2,3,4,5].map(i=>(
        <div key={i} style={{ padding:"1.1rem 1.3rem", borderLeft:`4px solid #E2E0DB`, borderBottom:`1px solid ${C.border}`, animation:"pulse 1.5s infinite" }}>
          <div style={{ height:12, background:"#E2E0DB", borderRadius:2, width:"15%", marginBottom:"0.6rem" }} />
          <div style={{ height:20, background:"#E2E0DB", borderRadius:2, width:"80%", marginBottom:"0.5rem" }} />
          <div style={{ height:14, background:"#E2E0DB", borderRadius:2, width:"95%", marginBottom:"0.3rem" }} />
          <div style={{ height:14, background:"#E2E0DB", borderRadius:2, width:"70%" }} />
        </div>
      ))}
    </div>
  );
}

// ─── ARTICLE ROW ─────────────────────────────────────────────────────────────
function ArticleRow({ article, index, onClick, isLast }) {
  const cat = catById(article.category);
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{ padding:"1.1rem 1.3rem", borderLeft:`4px solid ${cat.color}`,
        borderBottom: isLast?"none":`1px solid ${C.border}`,
        background: hovered ? C.bgAlt2 : "#fff",
        cursor:"pointer", transition:"background 0.15s ease",
        animation:`fadeUp .4s ease ${index*0.05}s both` }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.55rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
        <span style={{ background:cat.color+"15", color:cat.color, border:`1px solid ${cat.color}35`, padding:"0.1rem 0.42rem", borderRadius:"2px", fontSize:"10px", fontFamily:C.sans, letterSpacing:"0.07em", fontWeight:700 }}>{article.tag}</span>
        <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{cat.label.toUpperCase()}</span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.45rem" }}>
          <span style={{ fontSize:"12px", fontFamily:C.sans, fontWeight:600, color:C.textSub, background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.08rem 0.42rem" }}>{article.date}</span>
          <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{article.time} · {article.readTime}</span>
        </div>
      </div>
      <h3 style={{ fontFamily:C.serif, fontSize:article.isLead?"19px":"16px", fontWeight:700, lineHeight:1.35, color:hovered?C.red:C.text, margin:"0 0 0.55rem", letterSpacing:"-0.01em", transition:"color 0.15s" }}>
        {article.isLead && <span style={{ display:"inline-block", background:C.red, color:"white", fontSize:"10px", padding:"0.1rem 0.38rem", borderRadius:"1px", fontFamily:C.sans, letterSpacing:"0.1em", fontWeight:700, marginRight:"0.48rem", verticalAlign:"middle", position:"relative", top:"-2px" }}>LEAD</span>}
        {article.headline}
      </h3>
      <p style={{ fontFamily:C.serif, fontSize:"14px", lineHeight:"1.72", color:C.textSub, margin:"0 0 0.55rem", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
        {article.summary}
      </p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:cat.color }} />
          <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.sans }}>{article.sourceZH} · {article.source}</span>
        </div>
        <span style={{ fontSize:"11px", fontFamily:C.sans, fontWeight:600, color:hovered?C.red:C.textMuted, transition:"color 0.15s" }}>Read full article →</span>
      </div>
    </div>
  );
}

// ─── EXEC BRIEFING ────────────────────────────────────────────────────────────
function ExecBriefing({ articles }) {
  const [open, setOpen] = useState(true);
  const audiences = [
    { id:"investors", icon:"📈", label:"For Investors",    sublabel:"VCs · Analysts · Fund Managers", color:"#1B5FA8", text:"Monitor domestic consumption proxies as retail sales beat forecasts. February's +4.2% YoY result supports upgrading full-year consumption estimates. Travel and experiential categories are the standout performers." },
    { id:"brand",     icon:"🏢", label:"For Brand Leaders", sublabel:"CMOs · China GMs · Regional VPs",  color:"#C8102E", text:"Two urgent actions: audit your crisis response protocol for Chinese social media — the data shows 5-day response times cause lasting damage. And audit your AI readiness for Douyin and Quanzhantui before 2027 budget cycles." },
    { id:"watchers",  icon:"🔍", label:"For China Watchers",sublabel:"Advisors · Consultants · Researchers", color:"#2E7D52", text:"SAMR platform rules mark a transition from regulatory shock to normalisation. Pair this with the AI commerce white paper data for a complete picture of where platform power concentrates over the next 24 months." },
  ];

  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.red}`, borderRadius:"2px", marginBottom:"1.4rem", overflow:"hidden" }}>
      <div onClick={()=>setOpen(!open)} style={{ padding:"0.82rem 1.3rem", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:"#fff", borderBottom:open?`1px solid ${C.border}`:"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.85rem" }}>
          <span style={{ background:C.red, color:"white", padding:"0.15rem 0.55rem", fontSize:"10px", fontFamily:C.sans, letterSpacing:"0.1em", fontWeight:700, borderRadius:"2px" }}>EXEC BRIEFING</span>
          <span style={{ fontFamily:C.sans, fontSize:"13px", color:C.textSub, fontWeight:600 }}>Key Implications — {new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</span>
        </div>
        <span style={{ color:C.textMuted, fontSize:"11px", fontFamily:C.mono }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ padding:"1.1rem 1.3rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.85rem", marginBottom:"1.1rem" }}>
            {audiences.map(a=>(
              <div key={a.id} style={{ background:"#fff", border:`1px solid ${C.border}`, borderTop:`3px solid ${a.color}`, borderRadius:"2px", padding:"0.9rem 1rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", marginBottom:"0.15rem" }}>
                  <span style={{ fontSize:"14px" }}>{a.icon}</span>
                  <span style={{ fontFamily:C.sans, fontSize:"10px", color:a.color, fontWeight:700, letterSpacing:"0.04em" }}>{a.label.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginBottom:"0.5rem" }}>{a.sublabel}</div>
                <p style={{ fontFamily:C.serif, fontSize:"13px", lineHeight:"1.7", color:C.textSub, margin:0 }}>{a.text}</p>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem" }}>
            <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.9rem" }}>
              <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.35rem" }}>ARTICLES TODAY</div>
              <div style={{ fontFamily:C.serif, fontSize:"2rem", fontWeight:700, color:C.text, lineHeight:1.1, margin:"0.2rem 0 0.28rem" }}>{articles.length}<span style={{ fontSize:"1rem", color:C.textMuted }}>/10</span></div>
              <div style={{ fontFamily:C.serif, fontSize:"12.5px", color:C.textSub, lineHeight:1.6 }}>Across {[...new Set(articles.map(a=>a.category))].length} categories today</div>
            </div>
            <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.9rem" }}>
              <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.45rem" }}>MARKET SENTIMENT</div>
              <div style={{ fontFamily:C.serif, fontSize:"1.2rem", fontWeight:700, color:"#2E7D52", marginBottom:"0.65rem" }}>Cautiously Optimistic</div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.45rem" }}>
                <span style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>BEAR</span>
                <div style={{ flex:1, height:"4px", background:C.borderLight, borderRadius:2, position:"relative" }}>
                  <div style={{ position:"absolute", left:0, top:0, height:"100%", width:"65%", background:"#2E7D52", borderRadius:2 }} />
                </div>
                <span style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>BULL</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE: HOME ───────────────────────────────────────────────────────────────
function HomePage({ onNav, activeCat, setActiveCat, search, articles, loading, error }) {
  const filtered = articles.filter(a => {
    const matchCat    = activeCat==="all" || a.category.toLowerCase()===activeCat;
    const q           = search.toLowerCase();
    const matchSearch = !q || a.headline.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <main style={{ maxWidth:1200, margin:"0 auto", padding:"1.5rem", display:"grid", gridTemplateColumns:"1fr 285px", gap:"1.5rem", alignItems:"start" }}>
      <div>
        {/* date + count */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"1.1rem" }}>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.25rem" }}>Today's Edition</div>
            <h2 style={{ fontFamily:C.serif, fontSize:"21px", fontWeight:700, color:C.text, letterSpacing:"-0.01em" }}>{getTodayFormatted()}</h2>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:600, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Showing</div>
            <div style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.red, lineHeight:1 }}>
              {loading ? "–" : filtered.length}<span style={{ fontSize:"13px", color:C.textMuted }}>/10</span>
            </div>
          </div>
        </div>

        {/* category pills */}
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom:"1.2rem" }}>
          {CATS.map(cat=>{
            const count = cat.id==="all" ? articles.length : articles.filter(a=>a.category.toLowerCase()===cat.id).length;
            const active = activeCat===cat.id;
            return (
              <button key={cat.id} onClick={()=>setActiveCat(cat.id)}
                style={{ background:active?cat.color:"#fff", color:active?"#fff":C.textSub, border:`1px solid ${active?cat.color:C.border}`, padding:"0.3rem 0.75rem", borderRadius:"20px", cursor:"pointer", fontSize:"12px", fontFamily:C.sans, fontWeight:active?700:400, transition:"all .18s", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                {cat.label}
                <span style={{ background:active?"rgba(255,255,255,0.25)":C.bgAlt, color:active?"#fff":C.textMuted, borderRadius:"10px", padding:"0.02rem 0.35rem", fontSize:"10px" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {activeCat==="all" && !search && <ExecBriefing articles={articles} />}

        {/* error state */}
        {error && (
          <div style={{ background:"#FFF0F0", border:`1px solid #FFCCCC`, borderRadius:"2px", padding:"1rem 1.2rem", marginBottom:"1rem", fontFamily:C.sans, fontSize:"13px", color:"#C8102E" }}>
            ⚠ Could not load articles. Please refresh the page.
          </div>
        )}

        {/* loading */}
        {loading && <LoadingSkeleton />}

        {/* empty */}
        {!loading && !error && filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"3rem 1rem", color:C.textMuted, fontFamily:C.serif, fontStyle:"italic", border:`1px dashed ${C.border}`, borderRadius:"3px", fontSize:"15px" }}>
            No articles published yet today.
            <div style={{ fontSize:"12px", fontStyle:"normal", fontFamily:C.sans, color:C.textMuted, marginTop:"0.45rem" }}>Check back at 7 AM HKT or use + Submit to add articles.</div>
          </div>
        )}

        {/* articles */}
        {!loading && !error && filtered.length>0 && (
          <div style={{ display:"flex", flexDirection:"column", border:`1px solid ${C.border}`, borderRadius:"2px", overflow:"hidden" }}>
            {filtered.map((a,i)=>(
              <ArticleRow key={a.id} article={a} index={i} onClick={()=>onNav("article",null,a.id)} isLast={i===filtered.length-1} />
            ))}
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem", position:"sticky", top:118 }}>
        <SubscribeWidget />
        <CoverageWidget articles={articles} loading={loading} />
        <ArchiveWidget />
      </div>
    </main>
  );
}

// ─── PAGE: ARTICLE ────────────────────────────────────────────────────────────
function ArticlePage({ articleId, articles, onNav }) {
  const article = articles.find(a=>a.id===articleId);
  if (!article) return (
    <div style={{ maxWidth:780, margin:"0 auto", padding:"3rem 1.5rem", textAlign:"center", fontFamily:C.serif, color:C.textMuted }}>
      Article not found. <span onClick={()=>onNav("home")} style={{ color:C.red, cursor:"pointer" }}>← Back to home</span>
    </div>
  );
  const cat = catById(article.category);

  return (
    <main style={{ maxWidth:780, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, letterSpacing:"0.04em", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>
        ← Back to Today's Edition
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.85rem" }}>
        <span style={{ background:cat.color+"15", color:cat.color, border:`1px solid ${cat.color}35`, padding:"0.12rem 0.5rem", borderRadius:"2px", fontSize:"10px", fontFamily:C.sans, letterSpacing:"0.08em", fontWeight:700 }}>{article.tag}</span>
        <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{cat.label.toUpperCase()}</span>
      </div>
      <h1 style={{ fontFamily:C.serif, fontSize:"28px", fontWeight:700, lineHeight:1.28, color:C.text, margin:"0 0 1rem", letterSpacing:"-0.02em" }}>
        {article.headline}
      </h1>
      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem", paddingBottom:"1.1rem", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.42rem" }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"11px", fontFamily:C.sans, fontWeight:700 }}>CP</div>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"12px", fontWeight:700, color:C.text }}>{article.author}</div>
            <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>ChinaPulse · {article.date} · {article.readTime} read</div>
          </div>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <span style={{ fontSize:"12px", fontFamily:C.sans, fontWeight:600, color:C.textSub, background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.1rem 0.5rem" }}>{article.date}</span>
        </div>
      </div>
      <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderLeft:`4px solid ${cat.color}`, borderRadius:"2px", padding:"1rem 1.2rem", marginBottom:"1.5rem" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:cat.color, letterSpacing:"0.1em", marginBottom:"0.4rem", textTransform:"uppercase" }}>Summary</div>
        <p style={{ fontFamily:C.serif, fontSize:"15px", lineHeight:"1.75", color:C.textSub, margin:0, fontStyle:"italic" }}>{article.summary}</p>
      </div>
      <div style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.text }}>
        {(article.body||"").trim().split("\n\n").map((para,i)=>(
          <p key={i} style={{ margin:"0 0 1.2rem" }}>{para}</p>
        ))}
      </div>
      {article.matters && (
        <div style={{ background:cat.color+"0D", border:`1px solid ${cat.color}30`, borderRadius:"2px", padding:"1.1rem 1.3rem", margin:"1.8rem 0" }}>
          <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:cat.color, letterSpacing:"0.1em", marginBottom:"0.4rem", textTransform:"uppercase" }}>Why It Matters</div>
          <p style={{ fontFamily:C.serif, fontSize:"15px", lineHeight:"1.75", color:C.textSub, margin:0 }}>{article.matters}</p>
        </div>
      )}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"1.2rem", marginTop:"1rem" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.55rem", textTransform:"uppercase" }}>Original Source</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.8rem" }}>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"13px", fontWeight:700, color:C.text }}>{article.source}</div>
            <div style={{ fontFamily:C.mono, fontSize:"11px", color:C.textMuted, marginTop:"0.15rem" }}>{article.sourceZH}</div>
          </div>
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:C.red, color:"white", padding:"0.52rem 1.1rem", borderRadius:"2px", fontSize:"12px", fontFamily:C.sans, fontWeight:700, letterSpacing:"0.05em", textDecoration:"none" }}>
            Read Original Article →
          </a>
        </div>
        <p style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.85rem", lineHeight:1.65 }}>
          This is an original summary and analysis by ChinaPulse, based on reporting from {article.source}. All intellectual property in the original article belongs to {article.source}. Not investment advice.
        </p>
      </div>
      {articles.filter(a=>a.id!==articleId).length>0 && (
        <div style={{ marginTop:"2rem", paddingTop:"1.5rem", borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:C.sans, fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.9rem", textTransform:"uppercase" }}>More from Today's Edition</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            {articles.filter(a=>a.id!==articleId).slice(0,3).map(a=>(
              <div key={a.id} onClick={()=>{ onNav("article",null,a.id); window.scrollTo(0,0); }}
                style={{ display:"flex", gap:"0.8rem", padding:"0.75rem", background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", cursor:"pointer" }}>
                <div style={{ width:3, background:catById(a.category).color, borderRadius:2, flexShrink:0 }} />
                <div>
                  <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginBottom:"0.22rem" }}>{catById(a.category).label.toUpperCase()} · {a.date}</div>
                  <div style={{ fontFamily:C.serif, fontSize:"13.5px", fontWeight:700, color:C.text, lineHeight:1.35 }}>{a.headline}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// ─── PAGE: LEGAL ──────────────────────────────────────────────────────────────
function LegalPage({ page, onNav }) {
  const titles = { privacy:"Privacy Policy", cookies:"Cookie Policy", terms:"Terms of Use" };
  const content = LEGAL[page]||"";
  return (
    <main style={{ maxWidth:720, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back</button>
      <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.text, margin:"0 0 0.4rem" }}>{titles[page]}</h1>
      <div style={{ fontFamily:C.mono, fontSize:"11px", color:C.textMuted, marginBottom:"2rem" }}>Last updated: March 2026</div>
      <div style={{ fontFamily:C.serif, fontSize:"15.5px", lineHeight:"1.82", color:C.textSub }}>
        {content.trim().split("\n\n").map((block,i)=>{
          if(block.startsWith("**")&&block.endsWith("**")) return <h2 key={i} style={{ fontFamily:C.serif, fontSize:"18px", fontWeight:700, color:C.text, margin:"1.8rem 0 0.6rem" }}>{block.replace(/\*\*/g,"")}</h2>;
          const parts=block.split(/(\*\*[^*]+\*\*)/g);
          return <p key={i} style={{ margin:"0 0 1rem" }}>{parts.map((p,j)=>p.startsWith("**")?<strong key={j} style={{ color:C.text }}>{p.replace(/\*\*/g,"")}</strong>:p)}</p>;
        })}
      </div>
    </main>
  );
}

// ─── PAGE: ABOUT ──────────────────────────────────────────────────────────────
function AboutPage({ onNav }) {
  return (
    <main style={{ maxWidth:720, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back</button>
      <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.text, margin:"0 0 1.5rem" }}>About ChinaPulse</h1>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>ChinaPulse is a daily China intelligence platform designed for global business leaders who need to understand what is happening in China — without reading Chinese.</p>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>Every weekday, we curate 10 articles from the best Chinese and international sources — including WeChat accounts like 虎嗅, 36氪, 赢商网, and 华丽志, alongside Jing Daily, Luxe.co, Pandaily, and Caixin — translate them into English, and add original business analysis.</p>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>Our audience includes CMOs, commercial VPs, fund managers, and strategy advisors at global companies with China exposure.</p>
      <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderLeft:`4px solid ${C.red}`, borderRadius:"2px", padding:"1rem 1.2rem", marginTop:"1.5rem" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.4rem" }}>CONTACT</div>
        <p style={{ fontFamily:C.serif, fontSize:"14px", color:C.textSub, margin:0 }}>For editorial enquiries, partnerships, or feedback: <a href="mailto:giadadeng1203@gmail.com" style={{ color:C.red }}>giadadeng1203@gmail.com</a></p>
      </div>
    </main>
  );
}

// ─── PAGE: CONTACT ────────────────────────────────────────────────────────────
function ContactPage({ onNav }) {
  const [form,setForm]=useState({ name:"", email:"", subject:"", message:"" });
  const [sent,setSent]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const iStyle={ width:"100%", background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", color:C.text, padding:"0.65rem 0.9rem", fontSize:"14px", fontFamily:C.serif, outline:"none", display:"block", marginBottom:"0.9rem" };
  const lStyle={ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", display:"block", marginBottom:"0.35rem", textTransform:"uppercase" };
  if(sent) return (
    <main style={{ maxWidth:600, margin:"0 auto", padding:"3rem 1.5rem", textAlign:"center" }}>
      <div style={{ fontSize:"2rem", marginBottom:"0.8rem" }}>✓</div>
      <h2 style={{ fontFamily:C.serif, fontSize:"22px", fontWeight:700, color:C.text, marginBottom:"0.5rem" }}>Message sent!</h2>
      <p style={{ fontFamily:C.serif, fontSize:"15px", color:C.textSub, marginBottom:"1.5rem" }}>We'll get back to you within 48 hours.</p>
      <button onClick={()=>onNav("home")} style={{ background:C.red, color:"white", border:"none", padding:"0.65rem 1.4rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:700 }}>Back to Home</button>
    </main>
  );
  return (
    <main style={{ maxWidth:600, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back</button>
      <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.text, margin:"0 0 0.4rem" }}>Contact Us</h1>
      <p style={{ fontFamily:C.serif, fontSize:"14px", color:C.textSub, marginBottom:"1.8rem" }}>Questions, editorial tips, partnerships, or feedback — we'd love to hear from you.</p>
      <div style={lStyle}>Your Name</div>
      <input style={iStyle} placeholder="Jane Smith" value={form.name} onChange={e=>set("name",e.target.value)} />
      <div style={lStyle}>Email Address</div>
      <input style={iStyle} type="email" placeholder="jane@company.com" value={form.email} onChange={e=>set("email",e.target.value)} />
      <div style={lStyle}>Subject</div>
      <input style={iStyle} placeholder="Partnership / Editorial tip / Feedback" value={form.subject} onChange={e=>set("subject",e.target.value)} />
      <div style={lStyle}>Message</div>
      <textarea style={{ ...iStyle, height:140, resize:"vertical", lineHeight:1.7 }} placeholder="Your message..." value={form.message} onChange={e=>set("message",e.target.value)} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"0.4rem" }}>
        <span style={{ fontFamily:C.mono, fontSize:"11px", color:C.textMuted }}>Replies to: giadadeng1203@gmail.com</span>
        <button onClick={()=>{ if(form.email&&form.message) setSent(true); }} style={{ background:C.red, color:"white", border:"none", padding:"0.65rem 1.4rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:700 }}>Send →</button>
      </div>
    </main>
  );
}

// ─── PAGE: SUBMIT ─────────────────────────────────────────────────────────────
function SubmitPage({ onNav }) {
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({ sourceKey:"", url:"", category:"", tag:"", slot:"", isLead:false, headline:"", summary:"", body:"", matters:"" });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const steps=["Source","Category","Content","Preview"];
  const cat=catById(form.category||"all");
  const iStyle={ width:"100%", background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", color:C.text, padding:"0.6rem 0.85rem", fontSize:"14px", fontFamily:C.serif, outline:"none", display:"block" };
  const lStyle={ fontSize:"10px", fontFamily:C.sans, fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.35rem", display:"block", textTransform:"uppercase" };
  const SOURCES_LIST = ["Caixin 财新","Huxiu 虎嗅","36Kr 36氪","36Kr Future Commerce 36氪未来消费","Winshang 赢商网","Huali Zhi 华丽志","TravelDaily CN 环球旅讯","Jing Daily","Luxe.co","Pandaily","ConCall","CEO Brand Watch CEO品牌观察","Fashion Business Daily 时尚商业Daily","iziRetail 热点","DT Business DT商业观察","Guangzi Consumption 光仔看消费","Unicorn Mall 独角Mall","Tang Fashion Watch 唐小唐时尚观察","Local Retail Watch 本土零售观察","Alibaba Research 阿里研究院","Yaoke Research 要客研究院","Reuters","SCMP 南华早报"];
  return (
    <main style={{ maxWidth:680, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back</button>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.3rem" }}>EDITOR DASHBOARD</div>
      <h1 style={{ fontFamily:C.serif, fontSize:"22px", fontWeight:700, color:C.text, margin:"0 0 1.5rem" }}>Submit Today's Article</h1>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.6rem" }}>
        {steps.map((s,i)=>(
          <div key={s} style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:3, background:i<=step?C.red:C.borderLight, borderRadius:2, marginBottom:"0.3rem", transition:"background .3s" }} />
            <span style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:600, color:i<=step?C.red:C.textMuted, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s}</span>
          </div>
        ))}
      </div>
      {step===0&&(
        <div>
          <div style={lStyle}>Select Source</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem", marginBottom:"1rem" }}>
            {SOURCES_LIST.map(s=>(
              <button key={s} onClick={()=>set("sourceKey",s)} style={{ background:form.sourceKey===s?C.red+"10":"#fff", border:`1px solid ${form.sourceKey===s?C.red+"60":C.border}`, borderRadius:"2px", padding:"0.5rem 0.7rem", textAlign:"left", cursor:"pointer" }}>
                <div style={{ fontSize:"12px", fontFamily:C.sans, fontWeight:600, color:form.sourceKey===s?C.red:C.textSub }}>{s}</div>
              </button>
            ))}
          </div>
          <div style={lStyle}>Original Article URL *</div>
          <input style={iStyle} placeholder="https://mp.weixin.qq.com/..." value={form.url} onChange={e=>set("url",e.target.value)} />
        </div>
      )}
      {step===1&&(
        <div>
          <div style={lStyle}>Category</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem", marginBottom:"1rem" }}>
            {CATS.filter(c=>c.id!=="all").map(c=>(
              <button key={c.id} onClick={()=>set("category",c.id)} style={{ background:form.category===c.id?c.color+"12":"#fff", border:`1px solid ${form.category===c.id?c.color+"60":C.border}`, borderRadius:"2px", padding:"0.62rem 0.78rem", cursor:"pointer", textAlign:"left", color:form.category===c.id?C.text:C.textSub, fontSize:"13px", fontFamily:C.serif }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:c.color, display:"inline-block", marginRight:"0.5rem", verticalAlign:"middle" }} />{c.label}
              </button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem" }}>
            <div><div style={lStyle}>Article Tag</div><input style={iStyle} placeholder="e.g. TREND REPORT" value={form.tag} onChange={e=>set("tag",e.target.value.toUpperCase())} /></div>
            <div><div style={lStyle}>Daily Slot (1-10)</div><input style={iStyle} type="number" min="1" max="10" placeholder="3" value={form.slot} onChange={e=>set("slot",e.target.value)} /></div>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.85rem", cursor:"pointer" }}>
            <input type="checkbox" checked={form.isLead} onChange={e=>set("isLead",e.target.checked)} style={{ accentColor:C.red, width:14, height:14 }} />
            <span style={{ fontSize:"13px", fontFamily:C.serif, color:C.textSub }}>Mark as Lead Story</span>
          </label>
        </div>
      )}
      {step===2&&(
        <div>
          <div style={lStyle}>Translated English Headline *</div>
          <input style={{ ...iStyle, marginBottom:"0.9rem" }} placeholder="Clear, punchy — under 15 words" value={form.headline} onChange={e=>set("headline",e.target.value)} />
          <div style={lStyle}>2-Line Summary (shown on main feed) *</div>
          <textarea style={{ ...iStyle, height:80, resize:"vertical", lineHeight:1.7, marginBottom:"0.9rem" }} placeholder="2-3 sentence teaser..." value={form.summary} onChange={e=>set("summary",e.target.value)} />
          <div style={lStyle}>Full Article Body *</div>
          <textarea style={{ ...iStyle, height:200, resize:"vertical", lineHeight:1.7, marginBottom:"0.9rem" }} placeholder="Full translated and summarised article (300-500 words)..." value={form.body} onChange={e=>set("body",e.target.value)} />
          <div style={lStyle}>Why It Matters *</div>
          <textarea style={{ ...iStyle, height:80, resize:"vertical", lineHeight:1.7 }} placeholder="2-3 sentences for business readers..." value={form.matters} onChange={e=>set("matters",e.target.value)} />
        </div>
      )}
      {step===3&&(
        <div>
          <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderLeft:`4px solid ${cat.color}`, borderRadius:"2px", padding:"1rem", marginBottom:"0.9rem" }}>
            <div style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:700, color:cat.color, marginBottom:"0.4rem", textTransform:"uppercase" }}>{form.tag} · {cat.label} · SLOT {form.slot}</div>
            <h3 style={{ fontFamily:C.serif, fontSize:"17px", fontWeight:700, color:C.text, margin:"0 0 0.5rem" }}>{form.headline||"Your headline here"}</h3>
            <p style={{ fontFamily:C.serif, fontSize:"13.5px", color:C.textSub, lineHeight:1.7, margin:"0 0 0.7rem" }}>{form.summary||"Your summary here..."}</p>
            {form.matters&&<div style={{ background:cat.color+"0D", border:`1px solid ${cat.color}30`, borderRadius:"2px", padding:"0.65rem 0.85rem" }}><div style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:700, color:cat.color, marginBottom:"0.25rem" }}>WHY IT MATTERS</div><p style={{ fontFamily:C.serif, fontSize:"13px", color:C.textSub, margin:0, lineHeight:1.7 }}>{form.matters}</p></div>}
          </div>
          <div style={{ background:"#F0FAF4", border:"1px solid #A8D5B8", borderRadius:"2px", padding:"0.8rem 1rem", fontSize:"13px", color:"#2E7D52", fontFamily:C.serif, lineHeight:1.6 }}>
            ✓ Copy this content into your Airtable ChinaPulse CMS base and tick the Published checkbox to make it live.
          </div>
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"1.4rem", paddingTop:"1rem", borderTop:`1px solid ${C.border}` }}>
        <button onClick={()=>step>0?setStep(step-1):onNav("home")} style={{ background:"#fff", border:`1px solid ${C.border}`, color:C.textSub, padding:"0.56rem 1.05rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600 }}>{step===0?"Cancel":"← Back"}</button>
        <button onClick={()=>step<3?setStep(step+1):onNav("home")} style={{ background:step===3?"#2E7D52":C.red, color:"white", border:"none", padding:"0.56rem 1.35rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:700 }}>{step===3?"✓ Done":"Next →"}</button>
      </div>
    </main>
  );
}

// ─── SIDEBAR WIDGETS ──────────────────────────────────────────────────────────
function SubscribeWidget() {
  const [email,setEmail]=useState(""); const [freq,setFreq]=useState("daily"); const [done,setDone]=useState(false);
  const submit=()=>{ if(email.includes("@")) setDone(true); };
  if(done) return <div style={{ background:"#F0FAF4", border:"1px solid #A8D5B8", borderRadius:"2px", padding:"1.2rem", textAlign:"center" }}><div style={{ fontSize:"1.4rem", marginBottom:"0.35rem" }}>✓</div><div style={{ fontFamily:C.serif, fontSize:"14px", color:C.text, fontWeight:700, marginBottom:"0.25rem" }}>You're subscribed!</div><div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>First email tomorrow at 7 AM HKT</div></div>;
  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.red}`, borderRadius:"2px", padding:"1.15rem" }}>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.42rem", textTransform:"uppercase" }}>Daily Digest</div>
      <h3 style={{ fontFamily:C.serif, fontSize:"14px", fontWeight:700, color:C.text, margin:"0 0 0.3rem" }}>Top 10 China stories in your inbox</h3>
      <p style={{ fontFamily:C.serif, fontSize:"12.5px", color:C.textSub, lineHeight:1.6, margin:"0 0 0.8rem" }}>Translated & decoded — every weekday 7 AM HKT.</p>
      <div style={{ display:"flex", gap:"0.38rem", marginBottom:"0.62rem" }}>
        {["daily","weekly"].map(f=><button key={f} onClick={()=>setFreq(f)} style={{ background:freq===f?C.red:"#fff", border:`1px solid ${freq===f?C.red:C.border}`, color:freq===f?"#fff":C.textSub, padding:"0.25rem 0.7rem", borderRadius:"2px", fontSize:"10px", fontFamily:C.sans, fontWeight:600, letterSpacing:"0.06em", cursor:"pointer", textTransform:"uppercase" }}>{f}</button>)}
      </div>
      <div style={{ display:"flex" }}>
        <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{ flex:1, background:"#fff", border:`1px solid ${C.border}`, borderRight:"none", borderRadius:"2px 0 0 2px", color:C.text, padding:"0.55rem 0.8rem", fontSize:"13px", fontFamily:C.serif, outline:"none" }} />
        <button onClick={submit} style={{ background:C.red, color:"white", border:"none", padding:"0.55rem 0.88rem", borderRadius:"0 2px 2px 0", fontSize:"10px", fontFamily:C.sans, fontWeight:700, letterSpacing:"0.07em", cursor:"pointer", whiteSpace:"nowrap" }}>JOIN →</button>
      </div>
      <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.4rem" }}>No spam. Unsubscribe anytime.</div>
    </div>
  );
}

function CoverageWidget({ articles, loading }) {
  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"1.05rem" }}>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.75rem", textTransform:"uppercase" }}>Today's Coverage</div>
      {CATS.filter(c=>c.id!=="all").map(cat=>{
        const n = loading ? 0 : articles.filter(a=>a.category.toLowerCase()===cat.id).length;
        return (
          <div key={cat.id} style={{ marginBottom:"0.58rem" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.2rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.36rem" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:n>0?cat.color:C.border }} />
                <span style={{ fontSize:"12px", fontFamily:C.sans, color:n>0?C.textSub:C.textMuted }}>{cat.label}</span>
              </div>
              <span style={{ fontSize:"10px", fontFamily:C.mono, color:n>0?cat.color:C.textMuted }}>{loading?"–":n}/2</span>
            </div>
            <div style={{ height:2, background:C.borderLight, borderRadius:2 }}>
              <div style={{ height:"100%", width:`${Math.min(n/2,1)*100}%`, background:cat.color, borderRadius:2, opacity:n>0?1:0, transition:"width .8s ease" }} />
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:"0.6rem", paddingTop:"0.58rem", borderTop:`1px solid ${C.border}`, fontSize:"10px", fontFamily:C.mono, color:C.textMuted }}>{loading?"Loading...": `${articles.length}/10 slots filled today`}</div>
    </div>
  );
}

function ArchiveWidget() {
  const dates = [];
  for(let i=1; i<=5; i++) {
    const d = new Date(); d.setDate(d.getDate()-i);
    dates.push(d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}));
  }
  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"1.05rem" }}>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem" }}>Recent Editions</div>
      {dates.map((d,i,arr)=>(
        <div key={d} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.38rem 0", borderBottom:i<arr.length-1?`1px solid ${C.borderLight}`:"none", cursor:"pointer" }}>
          <span style={{ fontSize:"12.5px", fontFamily:C.serif, color:C.textSub }}>{d}</span>
          <span style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:600, color:C.red }}>10 →</span>
        </div>
      ))}
    </div>
  );
}

function SourcesDrawer() {
  const sources = [
    { en:"Huxiu", zh:"虎嗅", url:"https://www.huxiu.com" },
    { en:"36Kr", zh:"36氪", url:"https://36kr.com" },
    { en:"36Kr Future Commerce", zh:"36氪未来消费", url:"https://36kr.com" },
    { en:"Winshang", zh:"赢商网", url:"https://www.winshang.com" },
    { en:"Huali Zhi", zh:"华丽志", url:"https://www.hualizhi.com" },
    { en:"TravelDaily CN", zh:"环球旅讯", url:"https://www.traveldaily.cn" },
    { en:"Jing Daily", zh:"Jing Daily", url:"https://jingdaily.com" },
    { en:"Luxe.co", zh:"Luxe.co", url:"https://luxe.co" },
    { en:"Pandaily", zh:"Pandaily", url:"https://pandaily.com" },
    { en:"ConCall", zh:"ConCall", url:"https://www.concall.cn" },
    { en:"CEO Brand Watch", zh:"CEO品牌观察", url:"https://mp.weixin.qq.com" },
    { en:"Fashion Business Daily", zh:"时尚商业Daily", url:"https://mp.weixin.qq.com" },
    { en:"iziRetail", zh:"iziRetail热点", url:"https://mp.weixin.qq.com" },
    { en:"DT Business", zh:"DT商业观察", url:"https://www.dtcj.com" },
    { en:"Guangzi Consumption", zh:"光仔看消费", url:"https://mp.weixin.qq.com" },
    { en:"Unicorn Mall", zh:"独角Mall", url:"https://mp.weixin.qq.com" },
    { en:"Tang Fashion Watch", zh:"唐小唐时尚观察", url:"https://mp.weixin.qq.com" },
    { en:"Local Retail Watch", zh:"本土零售观察", url:"https://mp.weixin.qq.com" },
    { en:"Alibaba Research", zh:"阿里研究院", url:"https://www.aliresearch.com" },
    { en:"Yaoke Research", zh:"要客研究院", url:"https://www.yaoke.com" },
    { en:"Caixin", zh:"财新", url:"https://www.caixin.com" },
    { en:"SCMP", zh:"南华早报", url:"https://www.scmp.com" },
    { en:"Reuters", zh:"Reuters", url:"https://www.reuters.com" },
  ];
  return (
    <div style={{ background:C.bgAlt, borderBottom:`1px solid ${C.border}`, padding:"0.9rem 1.5rem", animation:"fadeUp .2s ease" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.65rem", textTransform:"uppercase" }}>Monitored Sources — {sources.length} Feeds</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.38rem" }}>
          {sources.map(s=>(
            <a key={s.en} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.28rem 0.62rem", fontSize:"11px", fontFamily:C.sans, textDecoration:"none", display:"inline-flex", gap:"0.38rem", alignItems:"center" }}>
              <span style={{ color:C.text, fontWeight:600 }}>{s.en}</span>
              <span style={{ color:C.textMuted, fontFamily:C.mono, fontSize:"10px" }}>{s.zh}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function ChinaPulse() {
  const [page,        setPage]        = useState("home");
  const [activeCat,   setActiveCat]   = useState("all");
  const [articleId,   setArticleId]   = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [search,      setSearch]      = useState("");
  const [articles,    setArticles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles();
      setArticles(data);
    } catch(e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const navigate = (p, catId, artId) => {
    setPage(p);
    if(catId !== undefined && catId !== null) setActiveCat(catId);
    if(artId) setArticleId(artId);
    window.scrollTo(0,0);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#fff;color:#1a1a1a;-webkit-font-smoothing:antialiased;}
        input,textarea,button{font-family:inherit;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px;}
        button:hover{opacity:0.85;}
        a:hover{opacity:0.8;}
      `}</style>

      <Header onNav={navigate} activePage={page} search={search} setSearch={setSearch} showSources={showSources} setShowSources={setShowSources} />
      {showSources && <SourcesDrawer />}

      {page==="home"    && <HomePage    onNav={navigate} activeCat={activeCat} setActiveCat={setActiveCat} search={search} articles={articles} loading={loading} error={error} />}
      {page==="article" && <ArticlePage onNav={navigate} articleId={articleId} articles={articles} />}
      {page==="about"   && <AboutPage   onNav={navigate} />}
      {page==="contact" && <ContactPage onNav={navigate} />}
      {page==="submit"  && <SubmitPage  onNav={navigate} />}
      {(page==="privacy"||page==="cookies"||page==="terms") && <LegalPage page={page} onNav={navigate} />}

      <Footer onNav={navigate} />
    </div>
  );
}
