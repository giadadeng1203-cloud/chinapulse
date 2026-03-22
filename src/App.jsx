import { useState, useEffect } from "react";

// ─── 5 CATEGORIES ─────────────────────────────────────────────────────────────
const CATS = [
  { id: "all",        label: "All Topics",        color: "#C8102E" },
  { id: "macro",      label: "Macro & Policy",    color: "#1B5FA8" },
  { id: "consumer",   label: "Consumer & Retail", color: "#2E7D52" },
  { id: "luxury",     label: "Luxury & Fashion",  color: "#9B6B3E" },
  { id: "travel",     label: "Travel & Tourism",  color: "#1B7A8A" },
  { id: "brand",      label: "Brand & Investment",color: "#6B3A8A" },
];

const SOURCES = {
  caixin:       { zh: "财新",          en: "Caixin"                 },
  huxiu:        { zh: "虎嗅",          en: "Huxiu"                  },
  "36kr":       { zh: "36氪",          en: "36Kr"                   },
  "36kr-fc":    { zh: "36氪未来消费",   en: "36Kr Future Commerce"   },
  winshang:     { zh: "赢商网",         en: "Winshang"               },
  hualizhi:     { zh: "华丽志",         en: "Huali Zhi"              },
  traveldaily:  { zh: "环球旅讯",       en: "TravelDaily CN"         },
  jingdaily:    { zh: "Jing Daily",    en: "Jing Daily"             },
  concall:      { zh: "ConCall",       en: "ConCall"                },
  ceo:          { zh: "CEO品牌观察",    en: "CEO Brand Watch"        },
  fashionbiz:   { zh: "时尚商业Daily",  en: "Fashion Business Daily" },
  iziretail:    { zh: "iziRetail热点", en: "iziRetail"              },
  dtbiz:        { zh: "DT商业观察",    en: "DT Business"            },
  guangzi:      { zh: "光仔看消费",     en: "Guangzi Consumption"    },
  unicornmall:  { zh: "独角Mall",      en: "Unicorn Mall"           },
  tangfashion:  { zh: "唐小唐时尚观察", en: "Tang Fashion Watch"     },
  localretail:  { zh: "本土零售观察",   en: "Local Retail Watch"     },
  alibaba:      { zh: "阿里研究院",     en: "Alibaba Research"       },
  yaoke:        { zh: "要客研究院",     en: "Yaoke Research"         },
  reuters:      { zh: "Reuters",       en: "Reuters"                },
  scmp:         { zh: "南华早报",       en: "SCMP"                   },
};

// ─── ARTICLES — category IDs map to 5 cats only ───────────────────────────────
const ARTICLES = [
  {
    id: 1, slot: 1,
    category: "macro",           // Macro & Policy
    tag: "DATA RELEASE", isLead: true,
    source: "caixin", url: "https://www.caixin.com",
    date: "20 Mar 2026", time: "08:30", readTime: "4 min",
    headline: "China's Retail Sales Outperform in February, Signaling Durable Consumer Recovery",
    summary: "February retail sales rose 4.2% year-on-year to ¥1.24 trillion, beating the 3.6% analyst consensus. Catering revenues led the gain at +6.8%, while online physical goods sales grew 5.1%. The data follows sustained government stimulus including the trade-in subsidy program extension through Q3 2026, which has driven strong appliance and EV purchasing. Economists at Goldman Sachs revised their full-year consumption forecast upward to 4.5% from 4.0%.",
    matters: "The beat signals that consumer confidence is more durable than feared post-Lunar New Year, particularly for experiential and service spending. Brands with a strong in-store experience strategy are positioned to capture the recovery dividend.",
  },
  {
    id: 2, slot: 2,
    category: "macro",           // Macro & Policy
    tag: "REGULATION", isLead: false,
    source: "huxiu", url: "https://www.huxiu.com",
    date: "20 Mar 2026", time: "09:15", readTime: "5 min",
    headline: "SAMR Issues Sweeping New Platform Economy Guidelines Ahead of April Implementation",
    summary: "China's State Administration for Market Regulation published finalized guidelines governing data usage, algorithmic pricing, and merchant exclusivity on e-commerce platforms. The rules, effective April 1, prohibit platforms from using proprietary data to disadvantage third-party sellers and mandate transparent ranking algorithms. Platforms with over 50 million MAUs face enhanced audit requirements. Alibaba, JD.com, and Pinduoduo have each acknowledged the notice.",
    matters: "The regulations mark a maturation of China's platform economy oversight rather than a new crackdown cycle. Foreign brands selling via these platforms should review their data-sharing agreements now.",
  },
  {
    id: 3, slot: 3,
    category: "consumer",        // Consumer & Retail
    tag: "TREND REPORT", isLead: false,
    source: "36kr-fc", url: "https://36kr.com",
    date: "20 Mar 2026", time: "10:00", readTime: "6 min",
    headline: "'Situational Consumption' Emerges as China's Dominant 2026 Retail Thesis",
    summary: "A new consumer research report from 36Kr Future Commerce identifies 'situational consumption' — purchases tied to a specific moment, mood, or experience — as the defining pattern among young Chinese consumers in 2026. Categories benefiting include premium camping gear (+34% YoY), board game cafés (+22% outlet growth), and spa/wellness (+19%). The report analyzed 80 million transaction data points across WeChat Pay and Alipay.",
    matters: "International lifestyle brands should reconsider their China channel strategy: a curated offline moment now generates more purchase intent among 18–30 year olds than performance digital advertising. Invest in experiential pop-ups before SKU expansion.",
  },
  {
    id: 4, slot: 4,
    category: "consumer",        // Consumer & Retail
    tag: "MARKET DATA", isLead: false,
    source: "winshang", url: "https://www.winshang.com",
    date: "20 Mar 2026", time: "10:45", readTime: "5 min",
    headline: "China's Premium Mall Operators Post Strongest Footfall Since 2019 as Luxury District Strategy Pays Off",
    summary: "Winshang's March 2026 mall traffic index reached 108.3 (2019=100) for Tier-1 city premium malls — the first sustained above-baseline reading since the pandemic. Recovery is concentrated in Shanghai's Jing'an and Beijing's Sanlitun districts, where landlords invested heavily in F&B and entertainment upgrades. Average visit duration has risen 18 minutes to 97 minutes per visit.",
    matters: "Mall operators who shifted tenant mix toward F&B, beauty, and entertainment are now seeing measurable ROI. Retailers still primarily driving footfall through anchor department stores face structural headwinds.",
  },
  {
    id: 5, slot: 5,
    category: "luxury",          // Luxury & Fashion
    tag: "RESEARCH", isLead: false,
    source: "yaoke", url: "https://www.yaoke.com",
    date: "20 Mar 2026", time: "11:20", readTime: "6 min",
    headline: "Yaoke Research: China's Ultra-HNW Luxury Spending Shifts from Goods to 'Invisible Luxury'",
    summary: "Yaoke Research Institute's Q1 2026 luxury consumer study of 3,200 high-net-worth individuals (assets >¥10M) reveals a decisive pivot toward 'invisible luxury' — private membership clubs, bespoke travel experiences, and wellness retreats. Spending on hard luxury goods (watches, jewelry) declined 8% among the cohort while experiential categories rose 23%.",
    matters: "The ultra-luxury segment is not shrinking — it's migrating to private channels. Brands that only track retail sell-through will systematically undercount the opportunity.",
  },
  {
    id: 6, slot: 6,
    category: "consumer",        // Consumer & Retail (Gen Z absorbed here)
    tag: "ANALYSIS", isLead: false,
    source: "dtbiz", url: "https://www.dtcj.com",
    date: "20 Mar 2026", time: "12:00", readTime: "7 min",
    headline: "Guochao 3.0: How Chinese Gen Z is Redefining National Brands Beyond Nostalgia",
    summary: "DT Business analyzed three years of social sentiment data across Xiaohongshu, Weibo, and Douyin to map the evolution of the 'guochao' (国潮) trend. The movement has entered a third phase — moving beyond retro aesthetics into genuine product performance claims. Brands like Anta, Mao Geping cosmetics, and Chow Tai Fook sub-brands are winning because they now compete on innovation benchmarks, not patriotic sentiment alone.",
    matters: "Foreign brands can no longer assume guochao fatigue will work in their favor. Chinese competitors have used nationalist tailwinds to fund R&D that is now producing genuinely competitive products.",
  },
  {
    id: 7, slot: 7,
    category: "travel",          // Travel & Tourism
    tag: "TRAVEL NEWS", isLead: false,
    source: "traveldaily", url: "https://www.traveldaily.cn",
    date: "20 Mar 2026", time: "13:15", readTime: "4 min",
    headline: "China Announces 12 New Visa-Free Destinations — Outbound Tourism Set for Record Q2",
    summary: "China's National Immigration Administration confirmed visa-free or visa-on-arrival access for Chinese passport holders to 12 additional countries, including Serbia, Kenya, Georgia, and five Pacific island nations. TravelDaily CN data shows forward bookings for April–June 2026 up 38% versus the same period in 2025. The average outbound trip budget has risen 14% year-on-year.",
    matters: "Hospitality, duty-free retail, and luxury operators in destination markets should prepare for accelerating Chinese visitor volumes through H1 2026. Markets with frictionless entry now have a structural advantage.",
  },
  {
    id: 8, slot: 8,
    category: "brand",           // Brand & Investment
    tag: "BRAND INTELLIGENCE", isLead: false,
    source: "concall", url: "https://www.concall.cn",
    date: "20 Mar 2026", time: "14:00", readTime: "6 min",
    headline: "How Lululemon Lost the Yoga Studio and What It Reveals About China's Brand Trust Mechanics",
    summary: "ConCall's brand tracking panel of 15,000 Chinese consumers shows Lululemon's brand intimacy score dropped 11 points in Q1 2026 following a product quality controversy on Xiaohongshu. The brand's delayed 5-day response was categorized as 'arrogance' by 67% of focus group respondents. By contrast, Alo Yoga responded within 8 hours with a direct founder video and saw its score rise 7 points.",
    matters: "Response time on Chinese social media during a brand crisis is measured in hours, not days. International brands that escalate issues through Western corporate communications protocols will consistently underperform.",
  },
  {
    id: 9, slot: 9,
    category: "brand",           // Brand & Investment
    tag: "RESEARCH REPORT", isLead: false,
    source: "alibaba", url: "https://www.aliresearch.com",
    date: "20 Mar 2026", time: "15:00", readTime: "8 min",
    headline: "Alibaba Research: AI-Native Commerce to Capture 35% of China's Retail GMV by 2028",
    summary: "Alibaba Research Institute's annual New Commerce white paper projects AI-native shopping interfaces will account for 35% of China's total retail GMV by 2028, up from an estimated 8% in 2025. The report identifies Douyin's shopping graph and Alibaba's Quanzhantui AI ad system as the two dominant architectures. Traditional keyword-based search advertising will decline from 62% to 38% of retail media spend over the same period.",
    matters: "Brands planning China digital marketing budgets for 2027–2028 should model a material reallocation from search to AI-recommendation channels. Early mover advantage in training AI shopping models will compound significantly.",
  },
  {
    id: 10, slot: 10,
    category: "consumer",        // Consumer & Retail
    tag: "DEEP DIVE", isLead: false,
    source: "localretail", url: "https://mp.weixin.qq.com",
    date: "20 Mar 2026", time: "16:30", readTime: "5 min",
    headline: "Community Group Buying Evolves Into Full-Service Neighbourhood Commerce in Tier-2 Cities",
    summary: "Local Retail Watch documents the second-generation evolution of community group buying (社区团购) in China's Tier-2 and Tier-3 cities. Leading operators Meituan Youxuan and Duoduo Maicai have expanded from groceries into appliances, beauty, and household services. Average order frequency has risen to 4.2 purchases per household per month. Customer acquisition cost of ¥12 compares favourably against traditional e-commerce at ¥68–120.",
    matters: "Lower-tier Chinese cities represent 65% of the population but remain underpenetrated by premium brands. The community commerce infrastructure being built now is the key distribution channel for the next decade.",
  },
];

const EXEC = {
  bigPicture: "China's consumer recovery continues its two-speed dynamic: premium experiences and experiential spending are outpacing goods consumption, while policy tailwinds from the trade-in subsidy extension are giving appliance and EV retailers a meaningful boost heading into Q2.",
  implications: [
    { icon: "🏦", label: "Investors",      text: "Watch domestic consumption proxies — Meituan, Trip.com, and CTRIP are positioned to benefit as tourism volumes normalize toward pre-2019 levels." },
    { icon: "🏪", label: "Retailers",      text: "Premium mall traffic shows Tier-1 city footfall +8% YoY in February. Retailers with strong offline experience formats are outperforming pure-play e-commerce." },
    { icon: "👥", label: "Consumer Shift", text: "Gen Z is pivoting sharply toward 'guochao' brands — domestic players in sportswear and cosmetics are taking measurable share from multinational incumbents." },
    { icon: "📋", label: "Policy Risk",    text: "SAMR's new platform guidelines tighten data governance from April 1. Compliance costs will weigh on smaller platforms disproportionately." },
    { icon: "✈️", label: "Travel",         text: "12 new visa-free destinations announced — signals Beijing's prioritization of tourism revenue and soft power heading into peak season." },
  ],
  stat: { figure: "¥1.24T", context: "Total retail sales in Feb 2026 — up 4.2% YoY, beating consensus of +3.6%", source: "National Bureau of Statistics" },
  sentiment: "Cautiously Optimistic",
  sentimentPct: 65,
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const catById = (id) => CATS.find(c => c.id === id) || CATS[0];
const srcById = (id) => SOURCES[id] || { zh: id, en: id };

// shared style tokens
const S = {
  meta:  { fontSize:"0.62rem", fontFamily:"monospace", color:"#C8102E", letterSpacing:"0.12em", marginBottom:"0.45rem", display:"block" },
  label: { fontSize:"0.62rem", fontFamily:"monospace", color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", marginBottom:"0.35rem", display:"block" },
  input: { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"2px", color:"#F0EBE0", padding:"0.6rem 0.85rem", fontSize:"0.86rem", fontFamily:"'Libre Baskerville',Georgia,serif", outline:"none", display:"block" },
};

// ─── LIVE TICKER ──────────────────────────────────────────────────────────────
function LiveTicker() {
  const items = [
    "Feb Retail Sales +4.2% YoY — beats consensus ↑",
    "SAMR Platform Rules effective April 1",
    "12 New Visa-Free Destinations announced",
    "Premium Mall Index hits post-2019 high",
    "Guochao 3.0 — domestic brands compete on innovation",
    "Ultra-HNW luxury pivots from goods to experience",
  ];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => (x+1) % items.length), 3800); return () => clearInterval(t); }, []);
  return (
    <span key={i} style={{ animation:"slideIn .35s ease", display:"inline-block",
      fontFamily:"monospace", fontSize:"0.72rem", letterSpacing:"0.04em" }}>
      {items[i]}
    </span>
  );
}

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────
function ArticleCard({ article, expanded, onToggle }) {
  const cat = catById(article.category);
  const src = srcById(article.source);

  return (
    <div onClick={onToggle} style={{
      background: expanded ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${expanded ? cat.color+"60" : "rgba(255,255,255,0.07)"}`,
      borderLeft: `3px solid ${cat.color}`,
      borderRadius: "2px",
      padding: "1.25rem 1.5rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}>

      {/* ── TOP ROW: tag + category + timestamp ── */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.6rem",
        marginBottom:"0.7rem", flexWrap:"wrap" }}>

        {/* tag pill */}
        <span style={{
          background: cat.color+"20", color: cat.color,
          border: `1px solid ${cat.color}40`,
          padding: "0.12rem 0.48rem", borderRadius: "2px",
          fontSize: "0.61rem", fontFamily: "monospace",
          letterSpacing: "0.08em", fontWeight: 700,
        }}>{article.tag}</span>

        {/* category label */}
        <span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.32)",
          fontFamily:"monospace", letterSpacing:"0.04em" }}>
          {cat.label.toUpperCase()}
        </span>

        {/* ── TIMESTAMP — always visible ── */}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span style={{
            fontSize: "0.68rem", fontFamily: "monospace",
            color: "rgba(255,255,255,0.45)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "2px",
            padding: "0.1rem 0.45rem",
          }}>
            {article.date}
          </span>
          <span style={{ fontSize:"0.65rem", fontFamily:"monospace",
            color:"rgba(255,255,255,0.28)" }}>
            {article.time} · {article.readTime}
          </span>
        </div>
      </div>

      {/* ── HEADLINE ── */}
      <h3 style={{
        fontFamily: "'Libre Baskerville',Georgia,serif",
        fontSize: article.isLead ? "1.2rem" : "1.0rem",
        fontWeight: article.isLead ? 700 : 600,
        lineHeight: 1.42, color: "#F0EBE0",
        margin: "0 0 0.65rem", letterSpacing: "-0.01em",
      }}>
        {article.isLead && (
          <span style={{
            display:"inline-block", background:"#C8102E", color:"white",
            fontSize:"0.58rem", padding:"0.1rem 0.38rem", borderRadius:"1px",
            fontFamily:"monospace", letterSpacing:"0.1em", fontWeight:700,
            marginRight:"0.5rem", verticalAlign:"middle", position:"relative", top:"-1px",
          }}>LEAD</span>
        )}
        {article.headline}
      </h3>

      {/* ── SUMMARY — clipped to 3 lines when collapsed ── */}
      <p style={{
        fontSize: "0.86rem", color: "rgba(240,235,224,0.56)",
        lineHeight: 1.72, margin: "0 0 0.75rem",
        fontFamily: "'Libre Baskerville',Georgia,serif",
        display: expanded ? "block" : "-webkit-box",
        WebkitLineClamp: expanded ? "unset" : 3,
        WebkitBoxOrient: "vertical",
        overflow: expanded ? "visible" : "hidden",
      }}>{article.summary}</p>

      {/* ── EXPANDED CONTENT ── */}
      {expanded && (
        <div style={{ marginTop:"0.9rem", paddingTop:"0.9rem",
          borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{
            background: cat.color+"12",
            border: `1px solid ${cat.color}30`,
            borderRadius:"2px", padding:"0.85rem 1rem", marginBottom:"0.9rem",
          }}>
            <div style={{ fontSize:"0.61rem", fontFamily:"monospace",
              letterSpacing:"0.1em", color:cat.color,
              marginBottom:"0.38rem", fontWeight:700 }}>WHY IT MATTERS</div>
            <p style={{ fontSize:"0.85rem", color:"rgba(240,235,224,0.72)",
              lineHeight:1.7, margin:0,
              fontFamily:"'Libre Baskerville',Georgia,serif" }}>
              {article.matters}
            </p>
          </div>
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} style={{
              display:"inline-flex", alignItems:"center", gap:"0.38rem",
              fontSize:"0.72rem", color:cat.color, textDecoration:"none",
              fontFamily:"monospace", letterSpacing:"0.05em",
              borderBottom:`1px solid ${cat.color}50`, paddingBottom:"1px",
            }}>
            READ ORIGINAL: {src.zh} ({src.en}) →
          </a>
        </div>
      )}

      {/* ── FOOTER ROW: source + expand toggle ── */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginTop:"0.65rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.42rem" }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:cat.color }} />
          <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.36)",
            fontFamily:"monospace" }}>{src.zh} · {src.en}</span>
        </div>
        <span style={{ fontSize:"0.66rem", fontFamily:"monospace",
          letterSpacing:"0.05em",
          color: expanded ? cat.color : "rgba(255,255,255,0.22)" }}>
          {expanded ? "COLLAPSE ↑" : "READ MORE ↓"}
        </span>
      </div>
    </div>
  );
}

// ─── EXEC BRIEFING ────────────────────────────────────────────────────────────
function ExecBriefing() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background:"linear-gradient(135deg,rgba(200,16,46,0.07) 0%,transparent 55%)",
      border:"1px solid rgba(200,16,46,0.2)", borderRadius:"3px",
      marginBottom:"1.4rem", overflow:"hidden" }}>
      <div onClick={() => setOpen(!open)} style={{
        padding:"0.85rem 1.35rem", display:"flex", alignItems:"center",
        justifyContent:"space-between", cursor:"pointer",
        background:"rgba(200,16,46,0.05)",
        borderBottom: open ? "1px solid rgba(200,16,46,0.12)" : "none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.85rem" }}>
          <span style={{ background:"#C8102E", color:"white", padding:"0.17rem 0.58rem",
            fontSize:"0.61rem", fontFamily:"monospace", letterSpacing:"0.12em",
            fontWeight:700, borderRadius:"1px" }}>EXEC BRIEFING</span>
          <span style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"0.9rem",
            color:"rgba(240,235,224,0.7)" }}>Key Implications — 20 Mar 2026</span>
        </div>
        <span style={{ color:"rgba(255,255,255,0.32)", fontFamily:"monospace",
          fontSize:"0.75rem" }}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{ padding:"1.25rem 1.35rem" }}>
          <p style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"0.96rem",
            lineHeight:1.76, color:"rgba(240,235,224,0.82)",
            margin:"0 0 1.15rem", paddingLeft:"1rem",
            borderLeft:"3px solid #C8102E" }}>
            {EXEC.bigPicture}
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
            gap:"0.6rem", marginBottom:"1.15rem" }}>
            {EXEC.implications.map((imp,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:"2px", padding:"0.78rem 0.9rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.42rem", marginBottom:"0.32rem" }}>
                  <span style={{ fontSize:"0.88rem" }}>{imp.icon}</span>
                  <span style={{ fontSize:"0.61rem", fontFamily:"monospace",
                    color:"#C8102E", letterSpacing:"0.08em", fontWeight:700 }}>
                    {imp.label.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize:"0.79rem", color:"rgba(240,235,224,0.58)",
                  lineHeight:1.6, margin:0,
                  fontFamily:"'Libre Baskerville',serif" }}>{imp.text}</p>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.8rem" }}>
            <div style={{ background:"rgba(200,16,46,0.06)",
              border:"1px solid rgba(200,16,46,0.17)", borderRadius:"2px", padding:"0.95rem" }}>
              <div style={S.meta}>NUMBER OF THE DAY</div>
              <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"1.85rem",
                fontWeight:700, color:"#F0EBE0", lineHeight:1.1, margin:"0.28rem 0 0.28rem" }}>
                {EXEC.stat.figure}
              </div>
              <div style={{ fontSize:"0.77rem", color:"rgba(240,235,224,0.5)",
                fontFamily:"'Libre Baskerville',serif", lineHeight:1.55 }}>
                {EXEC.stat.context}
              </div>
              <div style={{ fontSize:"0.61rem", fontFamily:"monospace",
                color:"rgba(255,255,255,0.24)", marginTop:"0.38rem" }}>
                SRC: {EXEC.stat.source.toUpperCase()}
              </div>
            </div>

            <div style={{ background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.07)", borderRadius:"2px", padding:"0.95rem" }}>
              <div style={S.meta}>MARKET SENTIMENT</div>
              <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"1.1rem",
                fontWeight:700, color:"#2E7D52", margin:"0.32rem 0 0.65rem" }}>
                {EXEC.sentiment}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.48rem" }}>
                <span style={{ fontSize:"0.6rem", fontFamily:"monospace",
                  color:"rgba(255,255,255,0.28)" }}>BEAR</span>
                <div style={{ flex:1, height:"3px", background:"rgba(255,255,255,0.1)",
                  borderRadius:"2px", position:"relative" }}>
                  <div style={{ position:"absolute", left:0, top:0, height:"100%",
                    width:`${EXEC.sentimentPct}%`, background:"#2E7D52",
                    borderRadius:"2px", transition:"width 1.2s ease" }} />
                </div>
                <span style={{ fontSize:"0.6rem", fontFamily:"monospace",
                  color:"rgba(255,255,255,0.28)" }}>BULL</span>
              </div>
              <div style={{ fontSize:"0.6rem", fontFamily:"monospace",
                color:"rgba(255,255,255,0.2)", marginTop:"0.45rem" }}>
                BASED ON TODAY'S 10 ARTICLES
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUBSCRIBE WIDGET ─────────────────────────────────────────────────────────
function Subscribe() {
  const [email, setEmail] = useState("");
  const [freq,  setFreq]  = useState("daily");
  const [done,  setDone]  = useState(false);
  const submit = () => { if (email.includes("@")) setDone(true); };

  if (done) return (
    <div style={{ background:"rgba(46,125,82,0.08)", border:"1px solid rgba(46,125,82,0.28)",
      borderRadius:"3px", padding:"1.35rem", textAlign:"center" }}>
      <div style={{ fontSize:"1.5rem", marginBottom:"0.38rem" }}>✓</div>
      <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"0.93rem",
        color:"#F0EBE0", marginBottom:"0.28rem" }}>You're subscribed!</div>
      <div style={{ fontSize:"0.7rem", fontFamily:"monospace",
        color:"rgba(240,235,224,0.38)" }}>First email tomorrow at 7 AM HKT</div>
    </div>
  );

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.09)",
      borderRadius:"3px", padding:"1.35rem" }}>
      <div style={S.meta}>DAILY INTELLIGENCE DIGEST</div>
      <h3 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"1.02rem",
        color:"#F0EBE0", margin:"0 0 0.32rem" }}>China's top 10 stories in your inbox</h3>
      <p style={{ fontSize:"0.78rem", color:"rgba(240,235,224,0.38)",
        fontFamily:"'Libre Baskerville',serif", lineHeight:1.6, margin:"0 0 0.95rem" }}>
        Translated, summarised & decoded — every weekday 7 AM HKT.
      </p>
      <div style={{ display:"flex", gap:"0.38rem", marginBottom:"0.7rem" }}>
        {["daily","weekly"].map(f => (
          <button key={f} onClick={() => setFreq(f)} style={{
            background: freq===f ? "rgba(200,16,46,0.14)" : "transparent",
            border: `1px solid ${freq===f ? "rgba(200,16,46,0.45)" : "rgba(255,255,255,0.1)"}`,
            color: freq===f ? "#C8102E" : "rgba(255,255,255,0.38)",
            padding:"0.28rem 0.75rem", borderRadius:"2px",
            fontSize:"0.66rem", fontFamily:"monospace", letterSpacing:"0.07em",
            cursor:"pointer", textTransform:"uppercase" }}>{f}</button>
        ))}
      </div>
      <div style={{ display:"flex" }}>
        <input type="email" placeholder="your@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key==="Enter" && submit()}
          style={{ flex:1, background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.1)", borderRight:"none",
            borderRadius:"2px 0 0 2px", color:"#F0EBE0",
            padding:"0.58rem 0.85rem", fontSize:"0.84rem",
            fontFamily:"'Libre Baskerville',serif", outline:"none" }} />
        <button onClick={submit} style={{ background:"#C8102E", color:"white", border:"none",
          padding:"0.58rem 0.95rem", borderRadius:"0 2px 2px 0",
          fontSize:"0.66rem", fontFamily:"monospace", fontWeight:700,
          letterSpacing:"0.08em", cursor:"pointer", whiteSpace:"nowrap" }}>
          JOIN →
        </button>
      </div>
      <div style={{ fontSize:"0.63rem", fontFamily:"monospace",
        color:"rgba(255,255,255,0.2)", marginTop:"0.48rem" }}>
        No spam. Unsubscribe anytime.
      </div>
    </div>
  );
}

// ─── COVERAGE BAR ─────────────────────────────────────────────────────────────
function CoverageBar({ articles }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
      borderRadius:"3px", padding:"1.15rem" }}>
      <div style={S.meta}>TODAY'S COVERAGE</div>
      {CATS.filter(c => c.id !== "all").map(cat => {
        const n = articles.filter(a => a.category === cat.id).length;
        const pct = Math.min(n / 2, 1) * 100;
        return (
          <div key={cat.id} style={{ marginBottom:"0.7rem" }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:"0.28rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                <div style={{ width:5, height:5, borderRadius:"50%",
                  background: n > 0 ? cat.color : "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize:"0.72rem", fontFamily:"monospace",
                  color: n > 0 ? "rgba(240,235,224,0.65)" : "rgba(240,235,224,0.22)" }}>
                  {cat.label}
                </span>
              </div>
              <span style={{ fontSize:"0.67rem", fontFamily:"monospace",
                color: n > 0 ? cat.color : "rgba(255,255,255,0.2)" }}>{n}/2</span>
            </div>
            {/* mini progress bar */}
            <div style={{ height:2, background:"rgba(255,255,255,0.07)", borderRadius:1 }}>
              <div style={{ height:"100%", width:`${pct}%`,
                background: cat.color, borderRadius:1,
                transition:"width .8s ease", opacity: n > 0 ? 1 : 0 }} />
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:"0.65rem", paddingTop:"0.65rem",
        borderTop:"1px solid rgba(255,255,255,0.05)",
        fontSize:"0.65rem", fontFamily:"monospace", color:"rgba(255,255,255,0.22)" }}>
        {articles.length}/10 slots filled today
      </div>
    </div>
  );
}

// ─── EDITOR MODAL ─────────────────────────────────────────────────────────────
function EditorModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    sourceKey:"", url:"", category:"", tag:"",
    slot:"", isLead:false, headline:"", summary:"", matters:"",
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const steps = ["Source","Category","Content","Preview"];
  const cat = catById(form.category);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.88)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"#0E1117", border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:"4px", width:"100%", maxWidth:"620px",
        maxHeight:"90vh", overflow:"auto", padding:"1.75rem",
        animation:"fadeUp .3s ease" }}>

        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", marginBottom:"1.35rem" }}>
          <div>
            <div style={S.meta}>EDITOR DASHBOARD</div>
            <h2 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"1.15rem",
              color:"#F0EBE0", margin:"0.25rem 0 0" }}>Submit Today's Article</h2>
          </div>
          <button onClick={onClose} style={{ background:"none",
            border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.42)",
            width:30, height:30, borderRadius:"2px", cursor:"pointer", fontSize:"1rem" }}>×</button>
        </div>

        {/* steps */}
        <div style={{ display:"flex", gap:"0.38rem", marginBottom:"1.5rem" }}>
          {steps.map((s,i) => (
            <div key={s} style={{ flex:1, textAlign:"center" }}>
              <div style={{ height:3, background: i<=step ? "#C8102E" : "rgba(255,255,255,0.08)",
                borderRadius:2, marginBottom:"0.32rem", transition:"background .3s" }} />
              <span style={{ fontSize:"0.59rem", fontFamily:"monospace",
                color: i<=step ? "#C8102E" : "rgba(255,255,255,0.25)",
                letterSpacing:"0.06em" }}>{s.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* step 0 */}
        {step===0 && (
          <div>
            <div style={S.label}>Select Source</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:"0.4rem", marginBottom:"0.95rem" }}>
              {Object.entries(SOURCES).map(([k,s]) => (
                <button key={k} onClick={() => set("sourceKey",k)} style={{
                  background: form.sourceKey===k ? "rgba(200,16,46,0.1)" : "rgba(255,255,255,0.02)",
                  border:`1px solid ${form.sourceKey===k ? "rgba(200,16,46,0.38)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius:"2px", padding:"0.52rem 0.72rem",
                  textAlign:"left", cursor:"pointer", transition:"all .18s" }}>
                  <div style={{ fontSize:"0.71rem", fontFamily:"monospace",
                    color: form.sourceKey===k ? "#F0EBE0" : "rgba(240,235,224,0.42)" }}>{s.en}</div>
                  <div style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.24)",
                    marginTop:"0.12rem" }}>{s.zh}</div>
                </button>
              ))}
            </div>
            <div style={S.label}>Original Article URL</div>
            <input style={S.input} placeholder="https://mp.weixin.qq.com/..."
              value={form.url} onChange={e => set("url",e.target.value)} />
          </div>
        )}

        {/* step 1 */}
        {step===1 && (
          <div>
            <div style={S.label}>Category</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:"0.42rem", marginBottom:"1.05rem" }}>
              {CATS.filter(c=>c.id!=="all").map(c => (
                <button key={c.id} onClick={() => set("category",c.id)} style={{
                  background: form.category===c.id ? c.color+"20" : "rgba(255,255,255,0.02)",
                  border:`1px solid ${form.category===c.id ? c.color+"50" : "rgba(255,255,255,0.06)"}`,
                  borderRadius:"2px", padding:"0.65rem 0.8rem", cursor:"pointer",
                  color: form.category===c.id ? "#F0EBE0" : "rgba(240,235,224,0.38)",
                  fontSize:"0.8rem", fontFamily:"'Libre Baskerville',serif", textAlign:"left" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%",
                    background:c.color, display:"inline-block",
                    marginRight:"0.5rem", verticalAlign:"middle" }} />
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem" }}>
              <div>
                <div style={S.label}>Article Tag</div>
                <input style={S.input} placeholder="e.g. TREND REPORT"
                  value={form.tag} onChange={e => set("tag",e.target.value.toUpperCase())} />
              </div>
              <div>
                <div style={S.label}>Daily Slot (1–10)</div>
                <input style={S.input} type="number" min="1" max="10" placeholder="3"
                  value={form.slot} onChange={e => set("slot",e.target.value)} />
              </div>
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:"0.52rem",
              marginTop:"0.85rem", cursor:"pointer" }}>
              <input type="checkbox" checked={form.isLead}
                onChange={e => set("isLead",e.target.checked)}
                style={{ accentColor:"#C8102E", width:14, height:14 }} />
              <span style={{ fontSize:"0.78rem", color:"rgba(240,235,224,0.52)",
                fontFamily:"'Libre Baskerville',serif" }}>Mark as Lead Story</span>
            </label>
          </div>
        )}

        {/* step 2 */}
        {step===2 && (
          <div>
            <div style={S.label}>Translated English Headline *</div>
            <input style={S.input} placeholder="Clear, punchy — under 15 words"
              value={form.headline} onChange={e => set("headline",e.target.value)} />
            <div style={{ ...S.label, marginTop:"0.95rem" }}>English Summary (150–200 words) *</div>
            <textarea style={{ ...S.input, height:124, resize:"vertical", lineHeight:1.65 }}
              placeholder="Key findings, data points, and context from the original article..."
              value={form.summary} onChange={e => set("summary",e.target.value)} />
            <div style={{ ...S.label, marginTop:"0.95rem" }}>Why It Matters (2–3 sentences) *</div>
            <textarea style={{ ...S.input, height:76, resize:"vertical", lineHeight:1.65 }}
              placeholder="What should a brand manager, investor, or executive do with this?"
              value={form.matters} onChange={e => set("matters",e.target.value)} />
          </div>
        )}

        {/* step 3 preview */}
        {step===3 && (
          <div>
            <div style={{ background:"rgba(255,255,255,0.025)",
              border:"1px solid rgba(255,255,255,0.07)",
              borderLeft:`3px solid ${cat.color}`,
              borderRadius:"2px", padding:"1.05rem", marginBottom:"0.95rem" }}>
              <div style={{ fontSize:"0.61rem", fontFamily:"monospace",
                color:cat.color, marginBottom:"0.42rem" }}>
                {form.tag} · {cat.label.toUpperCase()} · SLOT {form.slot}
              </div>
              <h3 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:"1.02rem",
                color:"#F0EBE0", margin:"0 0 0.52rem" }}>
                {form.headline || "Your headline will appear here"}
              </h3>
              <p style={{ fontSize:"0.83rem", color:"rgba(240,235,224,0.56)",
                fontFamily:"'Libre Baskerville',serif", lineHeight:1.7,
                margin:"0 0 0.72rem" }}>
                {form.summary || "Your summary will appear here…"}
              </p>
              {form.matters && (
                <div style={{ background:cat.color+"12",
                  border:`1px solid ${cat.color}30`,
                  borderRadius:"2px", padding:"0.68rem 0.88rem" }}>
                  <div style={{ fontSize:"0.6rem", fontFamily:"monospace",
                    color:cat.color, marginBottom:"0.28rem" }}>WHY IT MATTERS</div>
                  <p style={{ fontSize:"0.81rem", color:"rgba(240,235,224,0.66)",
                    lineHeight:1.65, margin:0,
                    fontFamily:"'Libre Baskerville',serif" }}>{form.matters}</p>
                </div>
              )}
              <div style={{ marginTop:"0.72rem", fontSize:"0.66rem",
                color:"rgba(255,255,255,0.28)", fontFamily:"monospace" }}>
                SRC: {SOURCES[form.sourceKey]?.zh} · {form.url || "URL not set"}
              </div>
            </div>
            <div style={{ background:"rgba(46,125,82,0.06)",
              border:"1px solid rgba(46,125,82,0.2)",
              borderRadius:"2px", padding:"0.78rem 0.95rem",
              fontSize:"0.77rem", color:"rgba(240,235,224,0.52)",
              fontFamily:"'Libre Baskerville',serif", lineHeight:1.6 }}>
              ✓ Ready to publish. In production this pushes to your Airtable CMS, which syncs to the live app and queues the email digest.
            </div>
          </div>
        )}

        {/* nav */}
        <div style={{ display:"flex", justifyContent:"space-between",
          marginTop:"1.35rem", paddingTop:"0.95rem",
          borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => step>0 ? setStep(step-1) : onClose()} style={{
            background:"none", border:"1px solid rgba(255,255,255,0.1)",
            color:"rgba(255,255,255,0.42)", padding:"0.56rem 1.05rem",
            borderRadius:"2px", cursor:"pointer", fontFamily:"monospace",
            fontSize:"0.7rem", letterSpacing:"0.06em" }}>
            {step===0 ? "CANCEL" : "← BACK"}
          </button>
          <button onClick={() => step<3 ? setStep(step+1) : onClose()} style={{
            background: step===3 ? "#2E7D52" : "#C8102E",
            color:"white", border:"none", padding:"0.56rem 1.35rem",
            borderRadius:"2px", cursor:"pointer", fontFamily:"monospace",
            fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em" }}>
            {step===3 ? "✓ PUBLISH" : "NEXT →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ChinaPulse() {
  const [activeCat,   setActiveCat]   = useState("all");
  const [expandedId,  setExpandedId]  = useState(null);
  const [showEditor,  setShowEditor]  = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [search,      setSearch]      = useState("");

  const filtered = ARTICLES.filter(a => {
    const matchCat    = activeCat === "all" || a.category === activeCat;
    const q           = search.toLowerCase();
    const matchSearch = !q || a.headline.toLowerCase().includes(q)
                           || a.summary.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const toggle = (id) => setExpandedId(prev => prev===id ? null : id);

  return (
    <div style={{ minHeight:"100vh", background:"#0E1117", color:"#F0EBE0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0E1117;}
        input,textarea,button{font-family:inherit;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(200,16,46,0.28);border-radius:2px;}
        ::-webkit-scrollbar-track{background:transparent;}
        a{color:inherit;}
      `}</style>

      {/* TICKER */}
      <div style={{ background:"#C8102E", padding:"0.3rem 1.5rem",
        display:"flex", alignItems:"center", gap:"1.2rem" }}>
        <span style={{ fontSize:"0.6rem", fontFamily:"monospace", fontWeight:700,
          letterSpacing:"0.14em", color:"rgba(255,255,255,0.7)",
          borderRight:"1px solid rgba(255,255,255,0.28)", paddingRight:"1.15rem",
          whiteSpace:"nowrap" }}>● LIVE</span>
        <div style={{ flex:1, overflow:"hidden" }}><LiveTicker /></div>
        <span style={{ fontSize:"0.62rem", fontFamily:"monospace",
          color:"rgba(255,255,255,0.5)", whiteSpace:"nowrap" }}>20 MAR 2026</span>
      </div>

      {/* HEADER */}
      <header style={{ position:"sticky", top:0, zIndex:90,
        background:"rgba(14,17,23,0.97)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 1.5rem" }}>

          {/* masthead */}
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", padding:"0.95rem 0 0.75rem" }}>
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:"0.65rem" }}>
                <h1 style={{ fontFamily:"'Libre Baskerville',Georgia,serif",
                  fontSize:"1.85rem", fontWeight:700, letterSpacing:"-0.03em",
                  color:"#F0EBE0", lineHeight:1 }}>
                  China<span style={{ color:"#C8102E" }}>Pulse</span>
                </h1>
                <span style={{ fontSize:"0.8rem", color:"rgba(240,235,224,0.26)",
                  fontFamily:"'Libre Baskerville',serif", fontStyle:"italic" }}>中国脉搏</span>
              </div>
              <p style={{ fontFamily:"monospace", fontSize:"0.6rem",
                color:"rgba(240,235,224,0.28)", letterSpacing:"0.09em", marginTop:"0.22rem" }}>
                DAILY INTELLIGENCE FOR GLOBAL CHINA WATCHERS
              </p>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:"0.55rem" }}>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"0.58rem", top:"50%",
                  transform:"translateY(-50%)", fontSize:"0.72rem",
                  color:"rgba(255,255,255,0.26)", pointerEvents:"none" }}>⌕</span>
                <input placeholder="Search…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ background:"rgba(255,255,255,0.04)",
                    border:"1px solid rgba(255,255,255,0.08)", borderRadius:"2px",
                    color:"#F0EBE0", padding:"0.46rem 0.78rem 0.46rem 1.9rem",
                    fontSize:"0.78rem", fontFamily:"monospace", outline:"none", width:155 }} />
              </div>
              <button onClick={() => setShowSources(!showSources)} style={{
                background: showSources ? "rgba(200,16,46,0.12)" : "rgba(255,255,255,0.03)",
                border:`1px solid ${showSources ? "rgba(200,16,46,0.36)" : "rgba(255,255,255,0.08)"}`,
                color: showSources ? "#C8102E" : "rgba(240,235,224,0.44)",
                padding:"0.46rem 0.82rem", borderRadius:"2px", cursor:"pointer",
                fontSize:"0.66rem", fontFamily:"monospace", letterSpacing:"0.06em" }}>
                SOURCES
              </button>
              <button onClick={() => setShowEditor(true)} style={{
                background:"#C8102E", color:"white", border:"none",
                padding:"0.46rem 0.92rem", borderRadius:"2px", cursor:"pointer",
                fontSize:"0.66rem", fontFamily:"monospace",
                fontWeight:700, letterSpacing:"0.08em" }}>
                + SUBMIT
              </button>
            </div>
          </div>

          {/* 5 category tabs */}
          <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
            {CATS.map(cat => {
              const count = cat.id === "all"
                ? ARTICLES.length
                : ARTICLES.filter(a => a.category === cat.id).length;
              const active = activeCat === cat.id;
              return (
                <button key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setExpandedId(null); }}
                  style={{ background:"none", border:"none",
                    borderBottom:`2px solid ${active ? cat.color : "transparent"}`,
                    color: active ? "#F0EBE0" : "rgba(240,235,224,0.32)",
                    padding:"0.52rem 1.05rem", cursor:"pointer",
                    fontSize:"0.7rem", fontFamily:"monospace",
                    letterSpacing:"0.05em", whiteSpace:"nowrap",
                    transition:"color .18s, border-color .18s",
                    display:"flex", alignItems:"center", gap:"0.38rem" }}>
                  {cat.label.toUpperCase()}
                  {/* article count badge */}
                  <span style={{
                    background: active ? cat.color+"30" : "rgba(255,255,255,0.07)",
                    color: active ? cat.color : "rgba(255,255,255,0.28)",
                    borderRadius:"10px", padding:"0.05rem 0.38rem",
                    fontSize:"0.6rem", fontFamily:"monospace",
                    transition:"all .18s",
                  }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* SOURCES DRAWER */}
      {showSources && (
        <div style={{ background:"rgba(10,12,18,0.98)",
          borderBottom:"1px solid rgba(255,255,255,0.07)",
          padding:"1.05rem 1.5rem", animation:"fadeUp .2s ease" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={S.meta}>MONITORED SOURCES — {Object.keys(SOURCES).length} FEEDS</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.42rem" }}>
              {Object.entries(SOURCES).map(([k,s]) => (
                <div key={k} style={{ background:"rgba(255,255,255,0.03)",
                  border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:"2px", padding:"0.3rem 0.68rem",
                  fontSize:"0.7rem", fontFamily:"monospace" }}>
                  <span style={{ color:"#F0EBE0" }}>{s.en}</span>
                  <span style={{ color:"rgba(255,255,255,0.26)", marginLeft:"0.42rem" }}>{s.zh}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <main style={{ maxWidth:1200, margin:"0 auto", padding:"1.65rem 1.5rem",
        display:"grid", gridTemplateColumns:"1fr 292px",
        gap:"1.65rem", alignItems:"start" }}>

        {/* LEFT: FEED */}
        <div>
          {/* date + count header */}
          <div style={{ display:"flex", alignItems:"flex-end",
            justifyContent:"space-between", marginBottom:"1.2rem" }}>
            <div>
              <div style={S.meta}>TODAY'S EDITION</div>
              <h2 style={{ fontFamily:"'Libre Baskerville',serif",
                fontSize:"1.25rem", fontWeight:400,
                color:"#F0EBE0", letterSpacing:"-0.01em" }}>
                Friday, March 20, 2026
              </h2>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.6rem", fontFamily:"monospace",
                color:"rgba(240,235,224,0.26)", letterSpacing:"0.09em" }}>SHOWING</div>
              <div style={{ fontFamily:"'Libre Baskerville',serif",
                fontSize:"1.75rem", fontWeight:700, color:"#C8102E", lineHeight:1 }}>
                {filtered.length}
                <span style={{ fontSize:"0.9rem",
                  color:"rgba(255,255,255,0.25)" }}>/10</span>
              </div>
            </div>
          </div>

          {activeCat==="all" && !search && <ExecBriefing />}

          {filtered.length===0 ? (
            <div style={{ textAlign:"center", padding:"3rem 1rem",
              color:"rgba(240,235,224,0.26)",
              fontFamily:"'Libre Baskerville',serif", fontStyle:"italic",
              border:"1px dashed rgba(255,255,255,0.07)", borderRadius:"3px" }}>
              No articles in this category yet today.
              <div style={{ fontSize:"0.75rem", fontStyle:"normal",
                fontFamily:"monospace", color:"rgba(255,255,255,0.18)",
                marginTop:"0.45rem" }}>Use + SUBMIT to add the first one.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {filtered.map((a,i) => (
                <div key={a.id} style={{ animation:`fadeUp .42s ease ${i*0.055}s both` }}>
                  <ArticleCard article={a} expanded={expandedId===a.id}
                    onToggle={() => toggle(a.id)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: SIDEBAR */}
        <div style={{ display:"flex", flexDirection:"column",
          gap:"1.05rem", position:"sticky", top:118 }}>
          <Subscribe />
          <CoverageBar articles={ARTICLES} />

          {/* archive */}
          <div style={{ background:"rgba(255,255,255,0.02)",
            border:"1px solid rgba(255,255,255,0.07)",
            borderRadius:"3px", padding:"1.1rem" }}>
            <div style={S.meta}>RECENT EDITIONS</div>
            {["19 Mar","18 Mar","17 Mar","14 Mar","13 Mar"].map((d,i,arr) => (
              <div key={d} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"0.4rem 0",
                borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                cursor:"pointer" }}>
                <span style={{ fontSize:"0.76rem",
                  fontFamily:"'Libre Baskerville',serif",
                  color:"rgba(240,235,224,0.42)" }}>{d} 2026</span>
                <span style={{ fontSize:"0.62rem", fontFamily:"monospace",
                  color:"rgba(200,16,46,0.52)" }}>10 →</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize:"0.62rem", fontFamily:"monospace",
            color:"rgba(240,235,224,0.17)", lineHeight:1.75 }}>
            Summaries translated & edited by ChinaPulse. Original sources always linked. Not investment advice.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.06)",
        padding:"1.65rem 1.5rem", marginTop:"1rem" }}>
        <div style={{ maxWidth:1200, margin:"0 auto",
          display:"flex", justifyContent:"space-between",
          alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <div style={{ fontFamily:"'Libre Baskerville',serif",
              fontSize:"1.02rem", color:"#F0EBE0", marginBottom:"0.22rem" }}>
              China<span style={{ color:"#C8102E" }}>Pulse</span>
              <span style={{ color:"rgba(255,255,255,0.2)", fontSize:"0.8rem",
                marginLeft:"0.45rem" }}>中国脉搏</span>
            </div>
            <div style={{ fontSize:"0.61rem", fontFamily:"monospace",
              color:"rgba(240,235,224,0.2)", letterSpacing:"0.07em" }}>
              DAILY CHINA INTELLIGENCE FOR GLOBAL BUSINESS LEADERS
            </div>
          </div>
          <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
            {["Archive","About","Sources","Contact"].map(l => (
              <span key={l} style={{ fontSize:"0.66rem", fontFamily:"monospace",
                color:"rgba(240,235,224,0.26)", cursor:"pointer",
                letterSpacing:"0.05em" }}>{l.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </footer>

      {showEditor && <EditorModal onClose={() => setShowEditor(false)} />}
    </div>
  );
}
