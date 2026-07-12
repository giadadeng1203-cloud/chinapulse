// ChinaPulse daily auto-publish pipeline
// Runs on a Vercel cron (see vercel.json) every day at 22:00 UTC = 6:00 AM HKT.
// 1. Pulls fresh articles from RSS-able China business sources
// 2. DeepSeek writes 10 original English summaries balanced across the 5 categories
// 3. Publishes them straight into the Airtable CMS table (Published = true)
//
// Required env vars (Vercel → Project → Settings → Environment Variables):
//   DEEPSEEK_API_KEY   — from https://platform.deepseek.com
//   AIRTABLE_TOKEN     — Airtable PAT with data.records:read + data.records:write on the base
//   CRON_SECRET        — any random string; Vercel sends it automatically on cron requests
// Optional:
//   AIRTABLE_BASE_ID   — defaults to appLJfM0uboPvSB0E

import { sendDigest } from "./_lib.js";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appLJfM0uboPvSB0E";
// Table referenced by permanent ID (name is "Imported table" — ID survives renames)
const AIRTABLE_TABLE = "tblzRNwo2f1hIGpIF";

// Tiers: "core" = the flagship Chinese sources from the product brief — the platform's
// differentiation; "secondary" = English China media for balance; "fallback" = wire
// coverage used only to plug category gaps. 要客研究院 is WeChat-only (no feed exists
// anywhere) — add its pieces manually via the + Submit page.
const FEEDS = [
  // ── Core Chinese sources ──────────────────────────────────────────────────
  { type: "rss",         url: "https://rss.huxiu.com/",                sourceEN: "Huxiu",       sourceZH: "虎嗅",     hint: "business analysis", tier: "core", max: 6 },
  { type: "rss",         url: "https://36kr.com/feed",                 sourceEN: "36Kr",        sourceZH: "36氪",     hint: "consumer/retail (skip pure tech)", tier: "core", max: 8 },
  { type: "rss",         url: "https://luxe.co/feed",                  sourceEN: "Luxe.CO",     sourceZH: "华丽志",   hint: "luxury/consumer",   tier: "core", max: 10 },
  { type: "winshang",    url: "http://news.winshang.com/",             sourceEN: "Winshang",    sourceZH: "赢商网",   hint: "retail",            tier: "core", max: 10 },
  { type: "traveldaily", url: "https://www.traveldaily.cn/",           sourceEN: "TravelDaily", sourceZH: "环球旅讯", hint: "travel",            tier: "core", max: 10 },
  { type: "rss",         url: "https://feeds.feedburner.com/jingdaily", sourceEN: "Jing Daily", sourceZH: "精日传媒", hint: "luxury/consumer",   tier: "core", max: 8 },
  { type: "dtyicai",     url: "https://dt.yicai.com/api/getNewsList?page=1&pageSize=100", sourceEN: "DT Business Observation", sourceZH: "DT商业观察", hint: "consumer data analysis", tier: "core", max: 4 },
  // ── Core macro & travel data sources ──────────────────────────────────────
  { type: "nbs",         url: "https://www.stats.gov.cn/english/PressRelease/",              sourceEN: "National Bureau of Statistics", sourceZH: "国家统计局", hint: "official macro data (retail sales, CPI, PMI)", tier: "core", max: 6 },
  { type: "pinchain",    url: "https://www.pinchain.com/article/category/tourism",           sourceEN: "Pinchain",    sourceZH: "品橙旅游", hint: "inbound/outbound travel",    tier: "core", max: 6 },
  { type: "pinchain",    url: "https://www.pinchain.com/article/category/datacenter",        sourceEN: "Pinchain",    sourceZH: "品橙旅游", hint: "travel pax data",            tier: "core", max: 6 },
  { type: "pinchain",    url: "https://www.pinchain.com/article/category/onlinetravel",      sourceEN: "Pinchain",    sourceZH: "品橙旅游", hint: "OTA / online travel reports", tier: "core", max: 5 },
  { type: "dragontrail", url: "https://dragontrail.com.cn/resources/blog",                   sourceEN: "Dragon Trail", sourceZH: "龙途互动", hint: "Chinese traveler insights",  tier: "core", max: 4 },
  // ── Secondary English sources ─────────────────────────────────────────────
  { type: "rss", url: "https://www.cgtn.com/subscribe/rss/section/business.xml", sourceEN: "CGTN Business", sourceZH: "中国国际电视台", hint: "macro/business", tier: "secondary", max: 8 },
  { type: "rss", url: "https://www.cgtn.com/subscribe/rss/section/travel.xml",   sourceEN: "CGTN Travel",   sourceZH: "中国国际电视台", hint: "travel",         tier: "secondary", max: 6 },
  { type: "rss", url: "https://www.moodiedavittreport.com/feed/", sourceEN: "The Moodie Davitt Report", sourceZH: "穆迪·戴维特报告", hint: "duty free/travel retail — China-relevant only", tier: "secondary", max: 8 },
  { type: "rss", url: "https://www.scmp.com/rss/2/feed",   sourceEN: "SCMP Business", sourceZH: "南华早报", hint: "retail/policy",    tier: "secondary", max: 8 },
  { type: "rss", url: "https://www.scmp.com/rss/4/feed",   sourceEN: "SCMP",          sourceZH: "南华早报", hint: "policy",           tier: "secondary", max: 6 },
  { type: "rss", url: "https://www.sixthtone.com/rss",     sourceEN: "Sixth Tone",    sourceZH: "第六声",   hint: "consumer culture", tier: "secondary", max: 5 },
  { type: "rss", url: "https://pandaily.com/feed/",        sourceEN: "Pandaily",      sourceZH: "Pandaily", hint: "tech",             tier: "secondary", max: 4 },
  // ── Fallback wires (capped at 2 picks per edition) ────────────────────────
  { type: "rss", url: "https://news.google.com/rss/search?q=site:reuters.com+china+when:2d&hl=en-US&gl=US&ceid=US:en", sourceEN: "Reuters", sourceZH: "路透社", hint: "macro/wire summary", tier: "fallback", max: 8 },
];

const DEFAULT_MAX_ITEMS_PER_FEED = 12;
const MAX_ITEM_AGE_HOURS = 48;

// ─── RSS helpers (no dependencies) ───────────────────────────────────────────
function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagContent(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ChinaPulseBot/1.0" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return "";
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function makeItem(feed, title, link, pubDate = "", description = "") {
  return { title, link, pubDate, description, sourceEN: feed.sourceEN, sourceZH: feed.sourceZH, hint: feed.hint, tier: feed.tier };
}

function parseRSS(xml, feed) {
  const max = feed.max || DEFAULT_MAX_ITEMS_PER_FEED;
  const items = [];
  const re = /<item[\s>][\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) && items.length < max) {
    const block = m[0];
    const title = tagContent(block, "title");
    const linkRaw = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const link = linkRaw ? decodeEntities(linkRaw[1]) : "";
    const pubDate = tagContent(block, "pubDate");
    const desc = tagContent(block, "description").slice(0, 500);
    if (!title || !link) continue;
    if (pubDate) {
      const age = (Date.now() - new Date(pubDate).getTime()) / 36e5;
      if (Number.isFinite(age) && age > MAX_ITEM_AGE_HOURS) continue;
    }
    items.push(makeItem(feed, title, link, pubDate, desc));
  }
  return items;
}

// 赢商网 has no RSS; its news portal is server-rendered — article links look like
// <a href="http://news.winshang.com/html/074/1083.html" target="_blank">标题</a>
function parseWinshang(html, feed) {
  const max = feed.max || DEFAULT_MAX_ITEMS_PER_FEED;
  const items = [];
  const seen = new Set();
  const re = /<a\s+[^>]*href="(https?:\/\/news\.winshang\.com\/html\/\d+\/\d+\.html)"[^>]*>\s*([^<]{6,150}?)\s*<\/a>/g;
  let m;
  while ((m = re.exec(html)) && items.length < max) {
    const link = m[1];
    const title = decodeEntities(m[2]);
    if (seen.has(link) || !title) continue;
    seen.add(link);
    items.push(makeItem(feed, title, link));
  }
  return items;
}

// 环球旅讯 (traveldaily.cn) has no RSS; its homepage is server-rendered Next.js.
// Editorial cards look like <a href="/article/190381/"><div><img alt="标题">…</a>,
// simple links like <a href="/article/190380" …>标题</a>. Anchors with the
// "corporateNews" class are paid press releases — skipped.
function parseTravelDaily(html, feed) {
  const max = feed.max || DEFAULT_MAX_ITEMS_PER_FEED;
  const items = [];
  const seen = new Set();
  const re = /href="\/article\/(\d+)\/?"[^>]*>([\s\S]{0,400}?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) && items.length < max) {
    if (/corporateNews/i.test(m[0])) continue;
    const link = `https://www.traveldaily.cn/article/${m[1]}`;
    if (seen.has(link)) continue;
    const alt = m[2].match(/alt="([^"]{6,150})"/);
    const title = decodeEntities(alt ? alt[1] : m[2]).slice(0, 150).trim();
    if (title.length < 6) continue;
    seen.add(link);
    items.push(makeItem(feed, title, link));
  }
  return items;
}

// DT商业观察 (dt.yicai.com, a Yicai property) exposes its article list as a public
// JSON endpoint — the same free call its own article page makes in the browser.
// It publishes analysis pieces at low frequency, so a wider 14-day window applies
// instead of MAX_ITEM_AGE_HOURS, and repeated titles in the raw list are deduped.
function parseDTYicai(json, feed) {
  const max = feed.max || DEFAULT_MAX_ITEMS_PER_FEED;
  const rows = (JSON.parse(json).data || {}).data || [];
  const cutoff = Number(new Date(Date.now() - 14 * 86400e3).toISOString().slice(0, 10).replace(/-/g, ""));
  const items = [];
  const seen = new Set();
  for (const r of rows.sort((a, b) => b.createdateint - a.createdateint)) {
    if (items.length >= max) break;
    if (!r.newsid || !r.newstitle || r.createdateint < cutoff) continue;
    const key = r.newstitle.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(makeItem(feed, key, `https://dt.yicai.com/news/${r.newsid}.html`, r.createdate || "", (r.newsnotes || "").slice(0, 500)));
  }
  return items;
}

// 品橙旅游 (pinchain.com) category pages are server-rendered; article anchors carry
// the headline in a title attribute: <a href="…/article/348608" title="标题 - 品橙旅游">
function parsePinchain(html, feed) {
  const max = feed.max || DEFAULT_MAX_ITEMS_PER_FEED;
  const items = [];
  const seen = new Set();
  const re = /href="(?:https?:\/\/www\.pinchain\.com)?\/article\/(\d+)"[^>]*title="([^"]{6,150}?)(?:\s*-\s*品橙旅游)?"/g;
  let m;
  while ((m = re.exec(html)) && items.length < max) {
    const link = `https://www.pinchain.com/article/${m[1]}`;
    const title = decodeEntities(m[2]);
    if (seen.has(link) || !title) continue;
    seen.add(link);
    items.push(makeItem(feed, title, link));
  }
  return items;
}

// Dragon Trail's English blog (Chinese-traveler insights) is server-rendered:
// <a href="/resources/blog/slug"><h4>Title</h4></a>
function parseDragonTrail(html, feed) {
  const max = feed.max || DEFAULT_MAX_ITEMS_PER_FEED;
  const items = [];
  const seen = new Set();
  const re = /<a\s+href="(\/resources\/blog\/[^"]+)"[^>]*>\s*<h4>([^<]{6,200})<\/h4>/g;
  let m;
  while ((m = re.exec(html)) && items.length < max) {
    const link = `https://dragontrail.com.cn${m[1]}`;
    const title = decodeEntities(m[2]);
    if (seen.has(link) || !title) continue;
    seen.add(link);
    items.push(makeItem(feed, title, link));
  }
  return items;
}

// NBS English press-release list — links look like
// <a href="./202607/t20260710_1964094.html">1.Consumer Price Index in June 2026</a>.
// The release date is embedded in the filename (tYYYYMMDD_…); only the last 10 days
// are kept, so monthly indicators (retail sales, CPI, PMI) enter the pool while fresh.
function parseNBS(html, feed) {
  const max = feed.max || DEFAULT_MAX_ITEMS_PER_FEED;
  const cutoff = Number(new Date(Date.now() - 10 * 86400e3).toISOString().slice(0, 10).replace(/-/g, ""));
  const items = [];
  const seen = new Set();
  const re = /href="\.\/(\d{6}\/t(\d{8})_\d+\.html)"[^>]*>\s*(?:\d+\.)?\s*([^<]{6,200})/g;
  let m;
  while ((m = re.exec(html)) && items.length < max) {
    if (Number(m[2]) < cutoff) continue;
    const link = `https://www.stats.gov.cn/english/PressRelease/${m[1]}`;
    const title = decodeEntities(m[3]);
    if (seen.has(link) || !title) continue;
    seen.add(link);
    items.push(makeItem(feed, title, link, `${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6)}`));
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const body = await fetchText(feed.url);
    if (!body) return [];
    if (feed.type === "winshang") return parseWinshang(body, feed);
    if (feed.type === "traveldaily") return parseTravelDaily(body, feed);
    if (feed.type === "dtyicai") return parseDTYicai(body, feed);
    if (feed.type === "pinchain") return parsePinchain(body, feed);
    if (feed.type === "dragontrail") return parseDragonTrail(body, feed);
    if (feed.type === "nbs") return parseNBS(body, feed);
    return parseRSS(body, feed);
  } catch (e) {
    console.error(`Feed failed: ${feed.url} — ${e.message}`);
    return [];
  }
}

// ─── Airtable helpers ────────────────────────────────────────────────────────
async function airtable(path, options = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${JSON.stringify(body.error || body)}`);
  return body;
}

async function editionExists(dateStr) {
  const formula = encodeURIComponent(`AND({Published}=1, IS_SAME({Date}, '${dateStr}', 'day'))`);
  const data = await airtable(`${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&maxRecords=1`);
  return data.records.length > 0;
}

// ─── DeepSeek generation ─────────────────────────────────────────────────────
// DeepSeek's JSON mode has no strict schema enforcement, so every call is
// validated and retried once. Writing is split into two batches of 5 articles
// to stay well inside deepseek-chat's 8K output-token limit.
const CATEGORIES = ["Consumer", "Retail", "Policy", "Tech", "Travel"];

const EDITORIAL_SYSTEM = `You are the editorial engine of ChinaPulse (中国脉搏), a daily China business intelligence platform for global executives, investors, and China watchers who don't read Chinese. Your writing style follows Bloomberg/The Economist: precise, analytical, business-focused English.

Compliance rules (strict):
- Every article must be ORIGINAL English editorial writing — a news digest plus business analysis. Never translate source text verbatim.
- Attribute facts: "According to [source], ...". Do not invent specific figures, quotes, or names that are not in the provided material. Where the source material is thin, keep the body analytical and general rather than fabricating detail.
- Chinese-language source items should be handled the same way: write in English, attribute the source.

You always respond with a single valid JSON object and nothing else.`;

async function deepseekCall(userPrompt, maxTokens) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 240000);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EDITORIAL_SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${JSON.stringify(body.error || body).slice(0, 300)}`);
    return body.choices[0].message.content;
  } finally {
    clearTimeout(timer);
  }
}

// Call DeepSeek, parse + validate the JSON, retry once on failure
async function deepseekJSON(userPrompt, maxTokens, validate) {
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = JSON.parse(await deepseekCall(userPrompt, maxTokens));
      validate(data);
      return data;
    } catch (e) {
      lastErr = e;
      console.error(`DeepSeek attempt ${attempt} failed: ${e.message}`);
    }
  }
  throw new Error(`DeepSeek generation failed after 2 attempts: ${lastErr.message}`);
}

async function generateEdition(items, dateStr) {
  const tierLabel = { core: "CORE", secondary: "secondary", fallback: "wire" };
  const itemList = items.map((it, i) =>
    `[${i + 1}] [${tierLabel[it.tier] || "secondary"}] (${it.hint}) ${it.title}\n    source: ${it.sourceEN}${it.sourceZH ? ` / ${it.sourceZH}` : ""} | url: ${it.link}\n    ${it.description || "(no description)"}`
  ).join("\n\n");

  // Step 1: select 10 items, balanced across categories
  const selection = await deepseekJSON(
    `Below are candidate news items collected in the last 48 hours from ChinaPulse's monitored feeds. Many are in Chinese — that is expected; read them in Chinese, the edition is written in English. Today's edition date is ${dateStr}.

${itemList}

Select EXACTLY 10 items for today's edition. Category quotas (assign category by actual content — the (hint) is guidance only):
- Policy: exactly 2 — macro & policy: official data releases (NBS retail sales, CPI, PMI, GDP, trade), macroeconomic shifts, government regulation. If a fresh NBS monthly indicator is in the pool — especially Total Retail Sales of Consumer Goods — it MUST be one of the two.
- Consumer: 2 or 3 — consumer behavior, spending shifts, brand strategy, lifestyle trends. NOT gadget launches or startup funding.
- Retail: exactly 2 — commercial real estate, malls, e-commerce, luxury retail.
- Travel: 2 or 3 — inbound/outbound travel, passenger data, visa policy, hotels, duty free (Hainan policy, airport concessions), and OTA reports (Trip.com/Ctrip, Tuniu, Tongcheng — golden week / CNY season reports get priority when present).
- Tech: exactly 1 — the business of technology only (platform economics, AI commercialization, e-commerce infrastructure). Never product reviews or funding rounds.
(Consumer + Travel must total 5, so the 10 add up.)

Ordering — slots follow category blocks, not raw importance: Policy takes slots 1-2 (slot 1 = the most consequential macro story, is_lead true, all others false), then Consumer, then Retail, then Travel, and the single Tech story is always slot 10.

Source rules:
- SOURCE PRIORITY: items marked [CORE] come from ChinaPulse's flagship sources (虎嗅, 36氪, 华丽志, 赢商网, 环球旅讯, DT商业观察, Jing Daily, 国家统计局/NBS, 品橙旅游, Dragon Trail) — insight global readers cannot get from Western media. When a [CORE] item and another item are of similar relevance, ALWAYS pick the [CORE] one. Target at least 6 of the 10 selections from [CORE] items.
- At most 2 selections total from [wire] items (Reuters), and only for macro/policy stories no [CORE] or [secondary] item covers.
- The Moodie Davitt Report is global: select its items only when relevant to China, Hainan, Chinese travelers, or Asia-Pacific duty free.
- Skip: corporate press releases and PR puff, promotional or membership pages, sports, pure politics, duplicates, and evergreen/undated pieces that don't read as news.
- tag: short label like TREND REPORT, REGULATION, DATA RELEASE, ANALYSIS, MARKET MOVE, DEAL WATCH.

Respond with JSON only, exactly this shape:
{"selections": [{"item": <item number>, "category": "Consumer|Retail|Policy|Tech|Travel", "slot": 1, "is_lead": true, "tag": "TREND REPORT"}, ...10 entries total]}`,
    2000,
    (d) => {
      if (!Array.isArray(d.selections) || d.selections.length !== 10) throw new Error("need exactly 10 selections");
      const counts = {};
      for (const s of d.selections) {
        if (!CATEGORIES.includes(s.category)) throw new Error(`bad category: ${s.category}`);
        if (!items[s.item - 1]) throw new Error(`bad item number: ${s.item}`);
        counts[s.category] = (counts[s.category] || 0) + 1;
      }
      if (counts.Policy !== 2) throw new Error(`need exactly 2 Policy, got ${counts.Policy || 0}`);
      if (counts.Retail !== 2) throw new Error(`need exactly 2 Retail, got ${counts.Retail || 0}`);
      if (counts.Tech !== 1) throw new Error(`need exactly 1 Tech, got ${counts.Tech || 0}`);
      if (!(counts.Consumer >= 2 && counts.Consumer <= 3)) throw new Error(`need 2-3 Consumer, got ${counts.Consumer || 0}`);
      if (!(counts.Travel >= 2 && counts.Travel <= 3)) throw new Error(`need 2-3 Travel, got ${counts.Travel || 0}`);
    },
  );

  // Step 2: write full articles in two batches of 5 (parallel)
  const sorted = [...selection.selections].sort((a, b) => a.slot - b.slot);
  const batches = [sorted.slice(0, 5), sorted.slice(5)];

  const writeBatch = (batch) => {
    const brief = batch.map((s) => {
      const it = items[s.item - 1];
      return `SLOT ${s.slot} | category: ${s.category} | tag: ${s.tag} | is_lead: ${!!s.is_lead}
TITLE: ${it.title}
SOURCE: ${it.sourceEN}${it.sourceZH ? ` / ${it.sourceZH}` : ""}
URL: ${it.link}
NOTES: ${it.description || "(none)"}`;
    }).join("\n\n");

    return deepseekJSON(
      `Write the ChinaPulse article for each of these ${batch.length} selected stories (edition date ${dateStr}):

${brief}

Per-article rules:
- Some TITLEs/NOTES are in Chinese — every article you write is in English (translate names/terms naturally, keep brand names in their common English form).
- headline: punchy, under 15 words, no clickbait.
- summary: 2-3 sentences for the homepage feed.
- body: 250-350 words of original English analysis in 3-4 paragraphs separated by blank lines (\\n\\n). Lead with what happened (attributed), then context, then implications for global business.
- why_it_matters: 2-3 sentences of concrete takeaway for investors/brand leaders.
- source_en / source_zh: the real publisher. For Google News items the real publisher is at the end of the TITLE after " - "; use that name, and use its Chinese name for source_zh if you know it, otherwise repeat the English name.
- original_url: copy the URL exactly as given above. Never modify or shorten it.
- read_time: like "4 min" based on body length.
- Keep slot, category, tag, is_lead exactly as given above.

Respond with JSON only, exactly this shape:
{"articles": [{"slot": 1, "category": "...", "tag": "...", "is_lead": true, "headline": "...", "summary": "...", "body": "...", "why_it_matters": "...", "source_en": "...", "source_zh": "...", "original_url": "...", "read_time": "4 min"}, ...${batch.length} entries]}`,
      8000,
      (d) => {
        if (!Array.isArray(d.articles) || d.articles.length !== batch.length) throw new Error(`need exactly ${batch.length} articles`);
        for (const a of d.articles) {
          for (const f of ["headline", "summary", "body", "why_it_matters", "source_en", "original_url"]) {
            if (typeof a[f] !== "string" || !a[f].trim()) throw new Error(`missing field: ${f}`);
          }
          if (!CATEGORIES.includes(a.category)) throw new Error(`bad category: ${a.category}`);
        }
      },
    );
  };

  const written = await Promise.all(batches.map(writeBatch));
  return written.flatMap((w) => w.articles).sort((a, b) => a.slot - b.slot);
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>; manual runs can use ?key=
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || "";
    const key = new URL(req.url, "http://x").searchParams.get("key");
    if (auth !== `Bearer ${secret}` && key !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  if (!process.env.DEEPSEEK_API_KEY) return res.status(500).json({ error: "DEEPSEEK_API_KEY is not set" });
  if (!process.env.AIRTABLE_TOKEN) return res.status(500).json({ error: "AIRTABLE_TOKEN is not set" });

  const force = new URL(req.url, "http://x").searchParams.get("force") === "1";
  // "today" in Hong Kong time
  const dateStr = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

  try {
    if (!force && await editionExists(dateStr)) {
      return res.status(200).json({ ok: true, skipped: true, message: `Edition for ${dateStr} already published` });
    }

    // 1. Collect news
    const results = await Promise.all(FEEDS.map(fetchFeed));
    const seen = new Set();
    const items = results.flat().filter(it => {
      const k = it.title.toLowerCase().slice(0, 60);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (items.length < 10) throw new Error(`Only ${items.length} feed items collected — not enough to build an edition`);

    // 2. Generate the edition with Claude
    const articles = (await generateEdition(items, dateStr)).slice(0, 10);

    // 3. Publish to Airtable
    const records = articles.map(a => ({
      fields: {
        "Headline":       a.headline,
        "Summary":        a.summary,
        "Body":           a.body,
        "Why It Matters": a.why_it_matters,
        "Category":       a.category,
        "Tag":            a.tag,
        "Source EN":      a.source_en,
        "Source ZH":      a.source_zh || a.source_en,
        "Original URL":   a.original_url,
        "Date":           dateStr,
        "Time":           "06:00",
        "Slot":           a.slot,
        "Is Lead":        !!a.is_lead,
        "Published":      true,
        "Read Time":      a.read_time,
        "Author":         "ChinaPulse Editorial",
      },
    }));
    const created = await airtable(encodeURIComponent(AIRTABLE_TABLE), {
      method: "POST",
      body: JSON.stringify({ records, typecast: true }),
    });

    // 4. Email the daily digest to subscribers (non-fatal if Resend not configured)
    let digest = { sent: 0 };
    try {
      digest = await sendDigest({
        frequency: "Daily",
        subject: `ChinaPulse Daily — ${dateStr}`,
        title: "Today's Edition",
        intro: "The 10 China business stories that matter today, translated and decoded.",
        articles: articles.map(a => ({
          headline: a.headline, summary: a.summary, category: a.category,
          tag: a.tag, url: a.original_url, source: a.source_en,
        })),
      });
    } catch (e) {
      console.error(`daily digest failed: ${e.message}`);
      digest = { error: e.message };
    }

    const itemsBySource = {};
    for (const it of items) itemsBySource[it.sourceEN] = (itemsBySource[it.sourceEN] || 0) + 1;

    return res.status(200).json({
      ok: true,
      date: dateStr,
      itemsCollected: items.length,
      itemsBySource,
      published: created.records.length,
      publishedSources: articles.map(a => a.source_en),
      digest,
      headlines: articles.map(a => a.headline),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, date: dateStr, error: e.message });
  }
}
