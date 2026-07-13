import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── AIRTABLE CONFIG ──────────────────────────────────────────────────────────
// Set VITE_AIRTABLE_TOKEN in Vercel env vars (use a READ-ONLY token — it is
// visible in the browser bundle). The server-side write token is separate.
const AIRTABLE_TOKEN   = import.meta.env.VITE_AIRTABLE_TOKEN || "";
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE  || "appLJfM0uboPvSB0E";
// Table referenced by permanent ID (name is "Imported table" — ID survives renames)
const AIRTABLE_TABLE   = "tblzRNwo2f1hIGpIF";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // re-fetch from Airtable every 10 minutes

// Fetch all Published articles — the app groups them into daily editions
async function fetchArticles() {
  const records = [];
  let offset = "";
  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula={Published}=1&pageSize=100${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset || "";
  } while (offset);

  return records.map(r => ({
    id:         r.id,
    slot:       r.fields["Slot"]            || 0,
    category:   (r.fields["Category"]       || "consumer").toLowerCase(),
    tag:        r.fields["Tag"]             || "",
    isLead:     r.fields["Is Lead"]         || false,
    source:     r.fields["Source EN"]       || "",
    sourceZH:   r.fields["Source ZH"]       || "",
    url:        r.fields["Original URL"]    || "#",
    rawDate:    r.fields["Date"]            || "",
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
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

// ─── SAMPLE FALLBACK (shown only if Airtable is unreachable) ──────────────────
const SAMPLE_ARTICLES = [
  { id:"s1", slot:1, category:"consumer", tag:"TREND REPORT", isLead:true,  source:"Huxiu", sourceZH:"虎嗅", url:"#", rawDate:"", date:"", time:"08:30", readTime:"4 min",
    headline:"Sample: China's Gen-Z shifts spending toward experiences over goods",
    summary:"Live data is unavailable right now — this is placeholder content shown while the Airtable connection is restored.",
    body:"This is sample content.\n\nOnce the Airtable connection is restored, real daily articles will appear here automatically.", matters:"Reconnect Airtable to resume live daily intelligence.", author:"ChinaPulse Editorial" },
  { id:"s2", slot:2, category:"policy", tag:"REGULATION", isLead:false, source:"SCMP", sourceZH:"南华早报", url:"#", rawDate:"", date:"", time:"08:45", readTime:"3 min",
    headline:"Sample: New platform economy guidelines signal regulatory normalisation",
    summary:"Placeholder article — live Airtable data could not be loaded.",
    body:"This is sample content.", matters:"Sample only.", author:"ChinaPulse Editorial" },
  { id:"s3", slot:3, category:"tech", tag:"ANALYSIS", isLead:false, source:"Pandaily", sourceZH:"Pandaily", url:"#", rawDate:"", date:"", time:"09:00", readTime:"5 min",
    headline:"Sample: AI commerce infrastructure reshapes Douyin advertising",
    summary:"Placeholder article — live Airtable data could not be loaded.",
    body:"This is sample content.", matters:"Sample only.", author:"ChinaPulse Editorial" },
];

// ─── DESIGN TOKENS — WHITE EDITORIAL ──────────────────────────────────────────
const C = {
  bg:"#FFFFFF", panel:"#FAFAF8", panel2:"#F4F3EF", panelHover:"#F0EFE9",
  border:"#E2E0DB", borderLight:"#ECEAE4",
  red:"#C8102E", redDim:"#C8102E", ink:"#141414", amber:"#B87A1E", green:"#1E7F4F",
  text:"#1A1A1A", textSub:"#4A4A4A", textMuted:"#8A8880",
  serif:"Georgia,'Times New Roman',serif",
  sans:"'Arial',Helvetica,sans-serif",
  mono:"'Courier New',Courier,monospace",
};

// Colour discipline: BLACK for structure & information (categories, tags, pills,
// tiles, borders); RED only for brand + emphasis (logo accent, LEAD badge, hover,
// errors); GREEN only for live/positive signals (synced status, subscribe success,
// market sentiment — the sentiment meter keeps its bear→bull gradient). No other hues.
const CATS = [
  { id:"all",      label:"All",      color:"#141414" },
  { id:"policy",   label:"Macro",    color:"#141414" }, // Airtable category stays "Policy"; display-only label
  { id:"consumer", label:"Consumer", color:"#141414" },
  { id:"retail",   label:"Retail",   color:"#141414" },
  { id:"travel",   label:"Travel",   color:"#141414" },
  { id:"tech",     label:"Tech",     color:"#141414" },
];

const catById = id => CATS.find(c=>c.id===(id||"").toLowerCase())||CATS[0];

// ─── LEGAL ────────────────────────────────────────────────────────────────────
const LEGAL = {
  privacy:`**Privacy Policy**\n\nLast updated: March 2026\n\nChinaPulse is operated by Arco Consultancy. This Privacy Policy explains how we collect, use, and protect your personal information.\n\n**Information We Collect**\n\nWe collect your email address when you subscribe to our daily digest. We may collect anonymised usage data via analytics tools.\n\n**How We Use Your Information**\n\nYour email address is used solely to send you the ChinaPulse daily or weekly digest. We do not sell, rent, or share your personal information with third parties for marketing purposes.\n\n**Email Communications**\n\nYou may unsubscribe at any time by clicking the unsubscribe link in any email, or by contacting us at info@arcohk.com.\n\n**Data Retention**\n\nWe retain your email address for as long as you remain subscribed. Upon unsubscription, your data is deleted within 30 days.\n\n**Contact**\n\nFor any privacy-related queries, contact info@arcohk.com.`,
  cookies:`**Cookie Policy**\n\nLast updated: March 2026\n\nChinaPulse uses cookies to operate the Site and improve your experience.\n\n**Essential Cookies**\n\nThese are required for the Site to function correctly, including session and preference cookies.\n\n**Analytics Cookies**\n\nWe may use anonymised analytics to understand aggregate traffic. No personally identifiable information is collected.\n\n**Third-Party Cookies**\n\nWe do not permit third-party advertising cookies. External sites you visit via our links operate under their own cookie policies.\n\n**Managing Cookies**\n\nYou can disable cookies in your browser settings. Disabling essential cookies may affect Site functionality.\n\n**Contact**\n\nQuestions? Email info@arcohk.com.`,
  terms:`**Terms of Use**\n\nLast updated: March 2026\n\n**Content and Copyright**\n\nAll original editorial content on ChinaPulse — including summaries, translations, analysis, and commentary — is the intellectual property of ChinaPulse and may not be reproduced without written permission.\n\nChinaPulse summarises and translates content from third-party sources for editorial and informational purposes. We link to and credit all original sources.\n\n**Not Investment Advice**\n\nNothing on ChinaPulse constitutes financial, investment, legal, or business advice. All content is provided for informational purposes only.\n\n**Accuracy**\n\nWe endeavour to ensure all content is accurate at time of publication. ChinaPulse is not liable for errors or omissions.\n\n**External Links**\n\nLinks to third-party websites are provided for convenience. ChinaPulse is not responsible for the content of external sites.\n\n**Contact**\n\ninfo@arcohk.com`,
};

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ onNav, search, setSearch, lastUpdated }) {
  return (
    <header style={{ position:"sticky", top:0, zIndex:90, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(10px)", borderBottom:`2px solid ${C.ink}` }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.85rem 0 0.75rem", flexWrap:"wrap", gap:"0.6rem" }}>
          <div onClick={()=>onNav("home")} style={{ cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"0.65rem" }}>
              <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, letterSpacing:"-0.02em", color:C.text, lineHeight:1 }}>
                China<span style={{ color:C.red }}>Pulse</span>
              </h1>
              <span style={{ fontSize:"13px", color:C.textMuted, fontFamily:C.serif, fontStyle:"italic" }}>中国脉搏</span>
            </div>
            <p style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, letterSpacing:"0.12em", marginTop:"0.22rem", textTransform:"uppercase" }}>
              ▚ DAILY INTELLIGENCE TERMINAL {lastUpdated && <span style={{ color:C.green }}>· SYNCED {lastUpdated}</span>}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"0.55rem", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:C.textMuted, pointerEvents:"none" }}>⌕</span>
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"3px", color:C.text, padding:"0.42rem 0.75rem 0.42rem 1.8rem", fontSize:"13px", fontFamily:C.mono, outline:"none", width:150 }} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer({ onNav }) {
  return (
    <footer style={{ borderTop:`1px solid ${C.border}`, padding:"1.5rem", background:C.panel, marginTop:"2rem" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1.5rem", marginBottom:"1.1rem" }}>
          <div>
            <div style={{ fontFamily:C.serif, fontSize:"16px", fontWeight:700, color:C.text, marginBottom:"0.25rem" }}>
              China<span style={{ color:C.red }}>Pulse</span>
              <span style={{ color:C.textMuted, fontSize:"13px", marginLeft:"0.45rem", fontStyle:"italic" }}>中国脉搏</span>
            </div>
            <p style={{ fontFamily:C.sans, fontSize:"11px", color:C.textMuted, lineHeight:1.65, maxWidth:280 }}>
              Daily China intelligence for global business leaders. Translated, summarised, and decoded every day.
            </p>
          </div>
          <div style={{ display:"flex", gap:"3rem", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Company</div>
              {[["about","About"],["contact","Contact Us"]].map(([p,l])=>(
                <div key={p} onClick={()=>onNav(p)} style={{ fontFamily:C.sans, fontSize:"12px", color:C.textSub, cursor:"pointer", marginBottom:"0.35rem" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Legal</div>
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
    <div style={{ display:"flex", flexDirection:"column" }}>
      {[1,2,3,4,5].map(i=>(
        <div key={i} style={{ padding:"1.1rem 1.3rem", borderLeft:`3px solid ${C.border}`, borderBottom:`1px solid ${C.borderLight}`, background:C.panel, animation:"pulse 1.5s infinite" }}>
          <div style={{ height:12, background:C.border, borderRadius:2, width:"15%", marginBottom:"0.6rem" }} />
          <div style={{ height:20, background:C.border, borderRadius:2, width:"80%", marginBottom:"0.5rem" }} />
          <div style={{ height:14, background:C.border, borderRadius:2, width:"95%", marginBottom:"0.3rem" }} />
          <div style={{ height:14, background:C.border, borderRadius:2, width:"70%" }} />
        </div>
      ))}
    </div>
  );
}

// ─── CATEGORY VISUALS (photo-free, monochrome editorial) ─────────────────────
function CatTile({ cat, slot, isLead }) {
  return (
    <div style={{ width:92, alignSelf:"stretch", flexShrink:0, background:C.panel2,
      borderRight:`1px solid ${C.borderLight}`, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:"0.3rem" }}>
      <span style={{ fontFamily:C.serif, fontSize:"30px", fontWeight:700, color:C.ink, lineHeight:1, userSelect:"none" }}>{slot}</span>
      <span style={{ fontFamily:C.mono, fontSize:"9px", fontWeight:700, color:C.textMuted, letterSpacing:"0.14em" }}>{cat.label.toUpperCase()}</span>
      {isLead && <span style={{ fontFamily:C.mono, fontSize:"8px", fontWeight:700, color:C.red, letterSpacing:"0.14em" }}>LEAD</span>}
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
      style={{ borderLeft:`3px solid ${cat.color}`,
        borderBottom: isLast?"none":`1px solid ${C.borderLight}`,
        background: hovered ? C.panelHover : C.panel,
        cursor:"pointer", transition:"background 0.15s ease",
        animation:`fadeUp .4s ease ${index*0.05}s both`,
        display:"flex", alignItems:"stretch" }}>
      <CatTile cat={cat} slot={String(article.slot||index+1).padStart(2,"0")} isLead={article.isLead} />
      <div style={{ flex:1, minWidth:0, padding:"1.1rem 1.3rem" }}>
        <h3 style={{ fontFamily:C.serif, fontSize:"16.5px", fontWeight:700, lineHeight:1.35, color:hovered?C.red:C.text, margin:"0 0 0.55rem", letterSpacing:"-0.01em", transition:"color 0.15s" }}>
          {article.headline}
        </h3>
        <p style={{ fontFamily:C.serif, fontSize:"14px", lineHeight:"1.72", color:C.textSub, margin:"0 0 0.55rem", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {article.summary}
        </p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{article.source}</span>
          <span style={{ fontSize:"11px", fontFamily:C.mono, fontWeight:700, color:hovered?C.red:C.textMuted, transition:"color 0.15s" }}>{article.readTime} · READ →</span>
        </div>
      </div>
    </div>
  );
}

// ─── EXEC BRIEFING ────────────────────────────────────────────────────────────
function ExecBriefing({ articles, editionLabel }) {
  const [open, setOpen] = useState(true);
  const pick = cats => articles.find(a=>cats.includes(a.category));
  const lead = articles.find(a=>a.isLead) || articles[0];
  const audiences = [
    { id:"finance",  label:"Finance",  sublabel:"Markets · Investors · Funds",      color:"#141414", article: pick(["policy"]) || lead },
    { id:"brands",   label:"Brands",   sublabel:"Consumer · Retail · Luxury",       color:"#C8102E", article: pick(["consumer","retail"]) || lead },
    { id:"domestic", label:"Domestic", sublabel:"Policy · Society · Ground Trends", color:"#1E7F4F", article: pick(["tech","travel"]) || lead },
  ];
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.ink}`, borderRadius:"3px", marginBottom:"1.4rem", overflow:"hidden" }}>
      <div onClick={()=>setOpen(!open)} style={{ padding:"0.82rem 1.3rem", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:C.panel2, borderBottom:open?`1px solid ${C.border}`:"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.85rem" }}>
          <span style={{ background:C.ink, color:"#FFFFFF", padding:"0.15rem 0.55rem", fontSize:"10px", fontFamily:C.mono, letterSpacing:"0.1em", fontWeight:700, borderRadius:"2px" }}>EXEC BRIEFING</span>
          <span style={{ fontFamily:C.mono, fontSize:"12px", color:C.textSub, fontWeight:700 }}>KEY SIGNALS — {editionLabel}</span>
        </div>
        <span style={{ color:C.textMuted, fontSize:"11px", fontFamily:C.mono }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ padding:"1.1rem 1.3rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:"0.85rem" }}>
            {audiences.map(a=>(
              <div key={a.id} style={{ background:C.panel2, border:`1px solid ${C.border}`, borderTop:`3px solid ${a.color}`, borderRadius:"3px", padding:"0.9rem 1rem" }}>
                <div style={{ marginBottom:"0.15rem" }}>
                  <span style={{ fontFamily:C.mono, fontSize:"10px", color:a.color, fontWeight:700, letterSpacing:"0.09em" }}>{a.label.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginBottom:"0.5rem" }}>{a.sublabel}</div>
                {a.article ? (
                  <p style={{ fontFamily:C.serif, fontSize:"13px", lineHeight:"1.7", color:C.textSub, margin:0 }}>
                    <strong style={{ color:C.text }}>{a.article.headline}.</strong> {a.article.matters || a.article.summary}
                  </p>
                ) : (
                  <p style={{ fontFamily:C.serif, fontSize:"13px", color:C.textMuted, margin:0, fontStyle:"italic" }}>No signal published yet today.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE: HOME ───────────────────────────────────────────────────────────────
function HomePage({ onNav, activeCat, setActiveCat, search, edition, editionDates, selectedDate, setSelectedDate, loading, error, usingSample }) {
  const articles = edition;
  const filtered = articles.filter(a => {
    const matchCat    = activeCat==="all" || a.category.toLowerCase()===activeCat;
    const q           = search.toLowerCase();
    const matchSearch = !q || a.headline.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const editionLabel = selectedDate ? formatDate(selectedDate) : "TODAY";
  const isLatest = editionDates.length===0 || selectedDate===editionDates[0];

  return (
    <main style={{ maxWidth:1200, margin:"0 auto", padding:"1.5rem", display:"grid", gridTemplateColumns:"1fr 285px", gap:"1.5rem", alignItems:"start" }} className="cp-main-grid">
      <div>
        {/* date + count */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"1.1rem" }}>
          <div>
            <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"0.25rem" }}>
              {isLatest ? "▮ LATEST EDITION" : "▮ ARCHIVE EDITION"}
            </div>
            <h2 style={{ fontFamily:C.serif, fontSize:"22px", fontWeight:700, color:C.text, letterSpacing:"-0.01em" }}>
              {selectedDate ? new Date(selectedDate+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long", day:"numeric", month:"long", year:"numeric"}) : new Date().toLocaleDateString("en-GB",{weekday:"long", day:"numeric", month:"long", year:"numeric"})}
            </h2>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Showing</div>
            <div style={{ fontFamily:C.mono, fontSize:"26px", fontWeight:700, color:C.ink, lineHeight:1 }}>
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
                style={{ background:active?cat.color:C.panel, color:active?"#FFFFFF":C.textSub, border:`1px solid ${active?cat.color:C.border}`, padding:"0.3rem 0.75rem", borderRadius:"3px", cursor:"pointer", fontSize:"11px", fontFamily:C.mono, fontWeight:700, letterSpacing:"0.04em", transition:"all .18s", display:"flex", alignItems:"center", gap:"0.35rem", textTransform:"uppercase" }}>
                {cat.label}
                <span style={{ background:active?"rgba(0,0,0,0.2)":C.panel2, color:active?"#FFFFFF":C.textMuted, borderRadius:"2px", padding:"0.02rem 0.35rem", fontSize:"10px" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* sample-data banner */}
        {usingSample && (
          <div style={{ background:"rgba(200,16,46,0.05)", border:`1px solid rgba(200,16,46,0.3)`, borderRadius:"3px", padding:"0.8rem 1.1rem", marginBottom:"1rem", fontFamily:C.mono, fontSize:"12px", color:C.red }}>
            ⚠ LIVE DATA UNAVAILABLE — showing sample edition. Check the Airtable connection.
          </div>
        )}

        {activeCat==="all" && !search && !loading && articles.length>0 && <ExecBriefing articles={articles} editionLabel={editionLabel} />}

        {error && !usingSample && (
          <div style={{ background:"rgba(200,16,46,0.05)", border:`1px solid rgba(200,16,46,0.3)`, borderRadius:"3px", padding:"1rem 1.2rem", marginBottom:"1rem", fontFamily:C.mono, fontSize:"12px", color:C.red }}>
            ⚠ COULD NOT LOAD ARTICLES — please refresh the page.
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {!loading && filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"3rem 1rem", color:C.textMuted, fontFamily:C.serif, fontStyle:"italic", border:`1px dashed ${C.border}`, borderRadius:"3px", fontSize:"15px", background:C.panel }}>
            No articles published in this edition.
            <div style={{ fontSize:"11px", fontStyle:"normal", fontFamily:C.mono, color:C.textMuted, marginTop:"0.45rem" }}>NEW EDITION AUTO-PUBLISHES DAILY AT 6 AM HKT</div>
          </div>
        )}

        {!loading && filtered.length>0 && (
          <div style={{ display:"flex", flexDirection:"column", border:`1px solid ${C.border}`, borderRadius:"3px", overflow:"hidden" }}>
            {filtered.map((a,i)=>(
              <ArticleRow key={a.id} article={a} index={i} onClick={()=>onNav("article",null,a.id)} isLast={i===filtered.length-1} />
            ))}
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem", position:"sticky", top:90 }} className="cp-sidebar">
        <SubscribeWidget />
        <ArchiveWidget editionDates={editionDates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
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
  const related = articles.filter(a=>a.id!==articleId && a.rawDate===article.rawDate);

  return (
    <main style={{ maxWidth:780, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700, color:C.textMuted, letterSpacing:"0.04em", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>
        ← BACK TO EDITION
      </button>
      <h1 style={{ fontFamily:C.serif, fontSize:"28px", fontWeight:700, lineHeight:1.28, color:C.text, margin:"0 0 1rem", letterSpacing:"-0.02em" }}>
        {article.headline}
      </h1>
      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem", paddingBottom:"1.1rem", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.42rem" }}>
          <div style={{ width:28, height:28, borderRadius:"3px", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", color:"#FFFFFF", fontSize:"11px", fontFamily:C.mono, fontWeight:700 }}>CP</div>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"12px", fontWeight:700, color:C.text }}>{article.author}</div>
            <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>{article.date} · {article.readTime} read</div>
          </div>
        </div>
      </div>
      <div style={{ background:C.ink, borderRadius:"3px", padding:"0.85rem 1.3rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:C.mono, fontSize:"11px", fontWeight:700, color:"#FFFFFF", letterSpacing:"0.12em", marginBottom:"0.15rem" }}>{cat.label.toUpperCase()}</div>
          <div style={{ fontFamily:C.mono, fontSize:"9px", color:"rgba(255,255,255,0.55)", letterSpacing:"0.09em" }}>CHINAPULSE DAILY INTELLIGENCE</div>
        </div>
        <span style={{ fontFamily:C.serif, fontSize:"14px", fontStyle:"italic", color:"rgba(255,255,255,0.55)" }}>中国脉搏</span>
      </div>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`3px solid ${cat.color}`, borderRadius:"3px", padding:"1rem 1.2rem", marginBottom:"1.5rem" }}>
        <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:cat.color, letterSpacing:"0.1em", marginBottom:"0.4rem", textTransform:"uppercase" }}>Summary</div>
        <p style={{ fontFamily:C.serif, fontSize:"15px", lineHeight:"1.75", color:C.textSub, margin:0, fontStyle:"italic" }}>{article.summary}</p>
      </div>
      <div style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.85", color:C.text }}>
        {(article.body||"").trim().split("\n\n").map((para,i)=>(
          <p key={i} style={{ margin:"0 0 1.2rem" }}>{para}</p>
        ))}
      </div>
      {article.matters && (
        <div style={{ background:C.panel, border:`1px solid ${cat.color}40`, borderRadius:"3px", padding:"1.1rem 1.3rem", margin:"1.8rem 0" }}>
          <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:cat.color, letterSpacing:"0.1em", marginBottom:"0.4rem", textTransform:"uppercase" }}>Why It Matters</div>
          <p style={{ fontFamily:C.serif, fontSize:"15px", lineHeight:"1.75", color:C.textSub, margin:0 }}>{article.matters}</p>
        </div>
      )}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"1.2rem", marginTop:"1rem" }}>
        <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.55rem", textTransform:"uppercase" }}>Original Source</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.8rem" }}>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"13px", fontWeight:700, color:C.text }}>{article.source}</div>
          </div>
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:C.red, color:"#FFFFFF", padding:"0.52rem 1.1rem", borderRadius:"3px", fontSize:"12px", fontFamily:C.mono, fontWeight:700, letterSpacing:"0.05em", textDecoration:"none" }}>
            READ ORIGINAL →
          </a>
        </div>
        <p style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.85rem", lineHeight:1.65 }}>
          This is an original summary and analysis by ChinaPulse, based on reporting from {article.source}. All intellectual property in the original article belongs to {article.source}. Not investment advice.
        </p>
      </div>
      {related.length>0 && (
        <div style={{ marginTop:"2rem", paddingTop:"1.5rem", borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:C.mono, fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.9rem", textTransform:"uppercase" }}>More From This Edition</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            {related.slice(0,3).map(a=>(
              <div key={a.id} onClick={()=>{ onNav("article",null,a.id); window.scrollTo(0,0); }}
                style={{ display:"flex", gap:"0.8rem", padding:"0.75rem", background:C.panel, border:`1px solid ${C.border}`, borderRadius:"3px", cursor:"pointer" }}>
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
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← BACK</button>
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
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← BACK</button>
      <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.text, margin:"0 0 1.5rem" }}>About ChinaPulse</h1>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>ChinaPulse is part of <strong style={{ color:C.text }}>Arco Consultancy</strong>, where we provide the daily China intelligence platform designed for global business leaders who need to understand what is happening in China — without reading Chinese.</p>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>Every day, we scan the leading Chinese and international business sources, select the 10 most important stories, and publish original English analysis with a "Why It Matters" for each.</p>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>Our audience is global business leaders and investors with China exposure.</p>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:"3px", padding:"1rem 1.2rem", marginTop:"1.5rem" }}>
        <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.4rem" }}>CONTACT</div>
        <p style={{ fontFamily:C.serif, fontSize:"14px", color:C.textSub, margin:0 }}>For editorial enquiries, partnerships, or feedback: <a href="mailto:info@arcohk.com" style={{ color:C.red }}>info@arcohk.com</a></p>
      </div>
    </main>
  );
}

// ─── PAGE: CONTACT ────────────────────────────────────────────────────────────
function ContactPage({ onNav }) {
  const [form,setForm]=useState({ name:"", email:"", subject:"", message:"" });
  const [sent,setSent]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const iStyle={ width:"100%", background:C.panel, border:`1px solid ${C.border}`, borderRadius:"3px", color:C.text, padding:"0.65rem 0.9rem", fontSize:"14px", fontFamily:C.serif, outline:"none", display:"block", marginBottom:"0.9rem" };
  const lStyle={ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", display:"block", marginBottom:"0.35rem", textTransform:"uppercase" };
  if(sent) return (
    <main style={{ maxWidth:600, margin:"0 auto", padding:"3rem 1.5rem", textAlign:"center" }}>
      <div style={{ fontSize:"2rem", marginBottom:"0.8rem", color:C.green }}>✓</div>
      <h2 style={{ fontFamily:C.serif, fontSize:"22px", fontWeight:700, color:C.text, marginBottom:"0.5rem" }}>Message sent!</h2>
      <p style={{ fontFamily:C.serif, fontSize:"15px", color:C.textSub, marginBottom:"1.5rem" }}>We'll get back to you within 48 hours.</p>
      <button onClick={()=>onNav("home")} style={{ background:C.red, color:"#FFFFFF", border:"none", padding:"0.65rem 1.4rem", borderRadius:"3px", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700 }}>BACK TO HOME</button>
    </main>
  );
  return (
    <main style={{ maxWidth:600, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← BACK</button>
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
        <span style={{ fontFamily:C.mono, fontSize:"11px", color:C.textMuted }}>Replies to: info@arcohk.com</span>
        <button onClick={()=>{ if(form.email&&form.message) setSent(true); }} style={{ background:C.red, color:"#FFFFFF", border:"none", padding:"0.65rem 1.4rem", borderRadius:"3px", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700 }}>SEND →</button>
      </div>
    </main>
  );
}

// ─── PAGE: SUBMIT (editor helper) ─────────────────────────────────────────────
function SubmitPage({ onNav }) {
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({ sourceKey:"", url:"", category:"", tag:"", slot:"", isLead:false, headline:"", summary:"", body:"", matters:"" });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const steps=["Source","Category","Content","Preview"];
  const cat=catById(form.category||"all");
  const iStyle={ width:"100%", background:C.panel, border:`1px solid ${C.border}`, borderRadius:"3px", color:C.text, padding:"0.6rem 0.85rem", fontSize:"14px", fontFamily:C.serif, outline:"none", display:"block" };
  const lStyle={ fontSize:"10px", fontFamily:C.mono, fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.35rem", display:"block", textTransform:"uppercase" };
  const SOURCES_LIST = ["Caixin 财新","Huxiu 虎嗅","36Kr 36氪","36Kr Future Commerce 36氪未来消费","Winshang 赢商网","Huali Zhi 华丽志","TravelDaily CN 环球旅讯","Jing Daily","Luxe.co","Pandaily","TechNode 动点科技","Sixth Tone 第六声","ConCall","CEO Brand Watch CEO品牌观察","Fashion Business Daily 时尚商业Daily","iziRetail 热点","DT Business DT商业观察","Guangzi Consumption 光仔看消费","Unicorn Mall 独角Mall","Tang Fashion Watch 唐小唐时尚观察","Local Retail Watch 本土零售观察","Alibaba Research 阿里研究院","Yaoke Research 要客研究院","Reuters","SCMP 南华早报"];
  return (
    <main style={{ maxWidth:680, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← BACK</button>
      <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.3rem" }}>EDITOR DASHBOARD</div>
      <h1 style={{ fontFamily:C.serif, fontSize:"22px", fontWeight:700, color:C.text, margin:"0 0 1.5rem" }}>Submit an Article Manually</h1>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.6rem" }}>
        {steps.map((s,i)=>(
          <div key={s} style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:3, background:i<=step?C.red:C.border, borderRadius:2, marginBottom:"0.3rem", transition:"background .3s" }} />
            <span style={{ fontSize:"10px", fontFamily:C.mono, fontWeight:700, color:i<=step?C.red:C.textMuted, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s}</span>
          </div>
        ))}
      </div>
      {step===0&&(
        <div>
          <div style={lStyle}>Select Source</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem", marginBottom:"1rem" }}>
            {SOURCES_LIST.map(s=>(
              <button key={s} onClick={()=>set("sourceKey",s)} style={{ background:form.sourceKey===s?"rgba(200,16,46,0.07)":C.panel, border:`1px solid ${form.sourceKey===s?C.red:C.border}`, borderRadius:"3px", padding:"0.5rem 0.7rem", textAlign:"left", cursor:"pointer" }}>
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
              <button key={c.id} onClick={()=>set("category",c.id)} style={{ background:form.category===c.id?C.panel2:C.panel, border:`1px solid ${form.category===c.id?c.color:C.border}`, borderRadius:"3px", padding:"0.62rem 0.78rem", cursor:"pointer", textAlign:"left", color:form.category===c.id?C.text:C.textSub, fontSize:"13px", fontFamily:C.serif }}>
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
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`3px solid ${cat.color}`, borderRadius:"3px", padding:"1rem", marginBottom:"0.9rem" }}>
            <div style={{ fontSize:"10px", fontFamily:C.mono, fontWeight:700, color:cat.color, marginBottom:"0.4rem", textTransform:"uppercase" }}>{form.tag} · {cat.label} · SLOT {form.slot}</div>
            <h3 style={{ fontFamily:C.serif, fontSize:"17px", fontWeight:700, color:C.text, margin:"0 0 0.5rem" }}>{form.headline||"Your headline here"}</h3>
            <p style={{ fontFamily:C.serif, fontSize:"13.5px", color:C.textSub, lineHeight:1.7, margin:"0 0 0.7rem" }}>{form.summary||"Your summary here..."}</p>
            {form.matters&&<div style={{ background:C.panel2, border:`1px solid ${cat.color}40`, borderRadius:"3px", padding:"0.65rem 0.85rem" }}><div style={{ fontSize:"10px", fontFamily:C.mono, fontWeight:700, color:cat.color, marginBottom:"0.25rem" }}>WHY IT MATTERS</div><p style={{ fontFamily:C.serif, fontSize:"13px", color:C.textSub, margin:0, lineHeight:1.7 }}>{form.matters}</p></div>}
          </div>
          <div style={{ background:"rgba(30,127,79,0.07)", border:"1px solid rgba(30,127,79,0.3)", borderRadius:"3px", padding:"0.8rem 1rem", fontSize:"13px", color:C.green, fontFamily:C.serif, lineHeight:1.6 }}>
            ✓ Copy this content into your Airtable ChinaPulse CMS base and tick the Published checkbox to make it live. (The daily pipeline publishes automatically at 6 AM HKT — manual submission is only needed for extra articles.)
          </div>
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"1.4rem", paddingTop:"1rem", borderTop:`1px solid ${C.border}` }}>
        <button onClick={()=>step>0?setStep(step-1):onNav("home")} style={{ background:C.panel, border:`1px solid ${C.border}`, color:C.textSub, padding:"0.56rem 1.05rem", borderRadius:"3px", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700 }}>{step===0?"CANCEL":"← BACK"}</button>
        <button onClick={()=>step<3?setStep(step+1):onNav("home")} style={{ background:step===3?C.green:C.red, color:"#FFFFFF", border:"none", padding:"0.56rem 1.35rem", borderRadius:"3px", cursor:"pointer", fontFamily:C.mono, fontSize:"12px", fontWeight:700 }}>{step===3?"✓ DONE":"NEXT →"}</button>
      </div>
    </main>
  );
}

// ─── SIDEBAR WIDGETS ──────────────────────────────────────────────────────────
function SubscribeWidget() {
  const [email,setEmail]=useState(""); const [freq,setFreq]=useState("daily");
  const [state,setState]=useState("idle"); // idle | sending | done | error
  const submit=async()=>{
    if(!email.includes("@")||state==="sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, freq }) });
      if(!res.ok) throw new Error("subscribe failed");
      setState("done");
    } catch(e) { console.error(e); setState("error"); }
  };
  if(state==="done") return <div style={{ background:"rgba(30,127,79,0.07)", border:"1px solid rgba(30,127,79,0.3)", borderRadius:"3px", padding:"1.2rem", textAlign:"center" }}><div style={{ fontSize:"1.4rem", marginBottom:"0.35rem", color:C.green }}>✓</div><div style={{ fontFamily:C.serif, fontSize:"14px", color:C.text, fontWeight:700, marginBottom:"0.25rem" }}>You're subscribed!</div><div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>{freq==="weekly"?"FIRST EMAIL MONDAY 7 AM HKT":"FIRST EMAIL TOMORROW 7 AM HKT"} — CHECK YOUR INBOX FOR A WELCOME NOTE</div></div>;
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.ink}`, borderRadius:"3px", padding:"1.15rem" }}>
      <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.ink, letterSpacing:"0.1em", marginBottom:"0.42rem", textTransform:"uppercase" }}>Daily Digest</div>
      <h3 style={{ fontFamily:C.serif, fontSize:"14px", fontWeight:700, color:C.text, margin:"0 0 0.3rem" }}>Top 10 China stories in your inbox</h3>
      <p style={{ fontFamily:C.serif, fontSize:"12.5px", color:C.textSub, lineHeight:1.6, margin:"0 0 0.8rem" }}>Translated & decoded — every day 7 AM HKT.</p>
      <div style={{ display:"flex", gap:"0.38rem", marginBottom:"0.62rem" }}>
        {["daily","weekly"].map(f=><button key={f} onClick={()=>setFreq(f)} style={{ background:freq===f?C.ink:C.panel2, border:`1px solid ${freq===f?C.ink:C.border}`, color:freq===f?"#FFFFFF":C.textSub, padding:"0.25rem 0.7rem", borderRadius:"2px", fontSize:"10px", fontFamily:C.mono, fontWeight:700, letterSpacing:"0.06em", cursor:"pointer", textTransform:"uppercase" }}>{f}</button>)}
      </div>
      <div style={{ display:"flex" }}>
        <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{ flex:1, background:C.panel2, border:`1px solid ${C.border}`, borderRight:"none", borderRadius:"3px 0 0 3px", color:C.text, padding:"0.55rem 0.8rem", fontSize:"13px", fontFamily:C.mono, outline:"none", minWidth:0 }} />
        <button onClick={submit} disabled={state==="sending"} style={{ background:C.ink, color:"#FFFFFF", border:"none", padding:"0.55rem 0.88rem", borderRadius:"0 3px 3px 0", fontSize:"10px", fontFamily:C.mono, fontWeight:700, letterSpacing:"0.07em", cursor:"pointer", whiteSpace:"nowrap", opacity:state==="sending"?0.6:1 }}>{state==="sending"?"...":"JOIN →"}</button>
      </div>
      {state==="error" && <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.red, marginTop:"0.4rem" }}>⚠ Subscription failed — please try again.</div>}
      <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.4rem" }}>No spam. Unsubscribe anytime.</div>
    </div>
  );
}

function ArchiveWidget({ editionDates, selectedDate, setSelectedDate }) {
  if (!editionDates.length) return null;
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"3px", padding:"1.05rem" }}>
      <div style={{ fontFamily:C.mono, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem" }}>Editions Archive</div>
      {editionDates.slice(0,7).map((d,i,arr)=>{
        const active = d===selectedDate;
        return (
          <div key={d} onClick={()=>{ setSelectedDate(d); window.scrollTo(0,0); }}
            style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.42rem 0.5rem", margin:"0 -0.5rem", borderRadius:"3px", background:active?C.panel2:"transparent", borderBottom:i<arr.length-1?`1px solid ${C.borderLight}`:"none", cursor:"pointer" }}>
            <span style={{ fontSize:"12.5px", fontFamily:C.mono, color:active?C.red:C.textSub, fontWeight:active?700:400 }}>{formatDate(d)}{i===0?"  · LATEST":""}</span>
            <span style={{ fontSize:"10px", fontFamily:C.mono, fontWeight:700, color:active?C.red:C.textMuted }}>→</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function ChinaPulse() {
  const [page,         setPage]         = useState("home");
  const [activeCat,    setActiveCat]    = useState("all");
  const [articleId,    setArticleId]    = useState(null);
  const [search,       setSearch]       = useState("");
  const [articles,     setArticles]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [usingSample,  setUsingSample]  = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const userPickedDate = useRef(false);

  const loadArticles = useCallback(async (isBackground=false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await fetchArticles();
      setArticles(data);
      setUsingSample(false);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}));
    } catch(e) {
      console.error(e);
      if (!isBackground) {
        setError(e.message);
        setArticles(SAMPLE_ARTICLES);
        setUsingSample(true);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // initial load + daily self-refresh: poll Airtable every 10 min and on tab focus
  useEffect(() => {
    loadArticles();
    const interval = setInterval(()=>loadArticles(true), REFRESH_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState==="visible") loadArticles(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [loadArticles]);

  // group into editions by date, newest first
  const editionDates = useMemo(() => {
    const dates = [...new Set(articles.map(a=>a.rawDate).filter(Boolean))];
    dates.sort((a,b)=>b.localeCompare(a));
    return dates;
  }, [articles]);

  // default to the latest edition; follow new editions unless the user picked an archive date
  useEffect(() => {
    if (!editionDates.length) { setSelectedDate(null); return; }
    if (!userPickedDate.current || !editionDates.includes(selectedDate)) {
      setSelectedDate(editionDates[0]);
      userPickedDate.current = false;
    }
  }, [editionDates]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickDate = (d) => { userPickedDate.current = d!==editionDates[0]; setSelectedDate(d); };

  const edition = useMemo(() => {
    const list = selectedDate ? articles.filter(a=>a.rawDate===selectedDate) : articles;
    return [...list].sort((a,b)=>(a.slot||99)-(b.slot||99));
  }, [articles, selectedDate]);

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
        html{background:#FFFFFF;}
        body{background:#FFFFFF;color:#1A1A1A;-webkit-font-smoothing:antialiased;}
        input,textarea,button{font-family:inherit;}
        input::placeholder,textarea::placeholder{color:#8A8880;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.25}}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#FFFFFF;}
        ::-webkit-scrollbar-thumb{background:#CCCCCC;border-radius:2px;}
        button:hover{opacity:0.88;}
        a:hover{opacity:0.85;}
        ::selection{background:rgba(200,16,46,0.18);}
        @media (max-width: 900px){
          .cp-main-grid{grid-template-columns:1fr !important;}
          .cp-sidebar{position:static !important;}
        }
      `}</style>

      <Header onNav={navigate} search={search} setSearch={setSearch} lastUpdated={lastUpdated} />

      {page==="home"    && <HomePage    onNav={navigate} activeCat={activeCat} setActiveCat={setActiveCat} search={search} edition={edition} editionDates={editionDates} selectedDate={selectedDate} setSelectedDate={pickDate} loading={loading} error={error} usingSample={usingSample} />}
      {page==="article" && <ArticlePage onNav={navigate} articleId={articleId} articles={articles} />}
      {page==="about"   && <AboutPage   onNav={navigate} />}
      {page==="contact" && <ContactPage onNav={navigate} />}
      {page==="submit"  && <SubmitPage  onNav={navigate} />}
      {(page==="privacy"||page==="cookies"||page==="terms") && <LegalPage page={page} onNav={navigate} />}

      <Footer onNav={navigate} />
    </div>
  );
}
