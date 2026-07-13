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

// Cross-edition dedupe: URLs already published in recent editions are removed from
// the candidate pool, so a story is never covered twice — and older data/trend
// reports stay eligible until the day they're actually used.
const normUrl = u => (u || "").replace(/[?#].*$/, "").replace(/\/$/, "");

// Includes unpublished records too — a story that was ever written counts as covered.
async function recentlyCoveredUrls() {
  const params = `?pageSize=100` +
    `&sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=desc` +
    `&fields%5B%5D=${encodeURIComponent("Original URL")}`;
  const data = await airtable(`${encodeURIComponent(AIRTABLE_TABLE)}${params}`);
  return new Set(data.records.map(r => normUrl(r.fields["Original URL"])).filter(Boolean));
}

// A forced re-run publishes a fresh 10 for the same date; the previous same-day
// records must be unpublished or the site shows 20 articles. keepIds = the run
// that stays live.
async function unpublishSameDay(dateStr, keepIds) {
  const formula = encodeURIComponent(`AND({Published}=1, IS_SAME({Date}, '${dateStr}', 'day'))`);
  const data = await airtable(`${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&pageSize=100`);
  const stale = data.records.filter(r => !keepIds.has(r.id));
  for (let i = 0; i < stale.length; i += 10) {
    await airtable(encodeURIComponent(AIRTABLE_TABLE), {
      method: "PATCH",
      body: JSON.stringify({ records: stale.slice(i, i + 10).map(r => ({ id: r.id, fields: { "Published": false } })) }),
    });
  }
  return stale.length;
}

// ─── GitHub static archive ───────────────────────────────────────────────────
// Editions older than ARCHIVE_GRACE_DAYS are frozen as static JSON files in the
// repo (public/archive/YYYY-MM-DD.json, served by Vercel's CDN). Airtable records
// older than AIRTABLE_RETENTION_DAYS are then deleted — but only once their date
// is safely archived — keeping the base permanently under the 1,000-record free cap.
const GITHUB_REPO = process.env.GITHUB_REPO || "giadadeng1203-cloud/chinapulse";
const ARCHIVE_GRACE_DAYS = 7;      // editions younger than this can still be hand-edited in Airtable
const AIRTABLE_RETENTION_DAYS = 60;

async function gh(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "ChinaPulseBot/1.0",
      ...options.headers,
    },
  });
  if (res.status === 404) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${JSON.stringify(body.message || body).slice(0, 200)}`);
  return body;
}

async function ghReadJSON(path) {
  const f = await gh(`contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=main`);
  return f ? { sha: f.sha, data: JSON.parse(Buffer.from(f.content, "base64").toString("utf8")) } : null;
}

async function ghWriteJSON(path, data, message, sha) {
  return gh(`contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(data, null, 1)).toString("base64"),
      branch: "main",
      ...(sha ? { sha } : {}),
    }),
  });
}

async function archiveAndPrune() {
  if (!process.env.GITHUB_TOKEN) return { skipped: "GITHUB_TOKEN not set" };
  const cutoffArchive = new Date(Date.now() - ARCHIVE_GRACE_DAYS * 86400e3).toISOString().slice(0, 10);
  const cutoffDelete = new Date(Date.now() - AIRTABLE_RETENTION_DAYS * 86400e3).toISOString().slice(0, 10);

  const idx = await ghReadJSON("public/archive/index.json");
  const index = idx ? idx.data : { dates: [] };

  // Read the whole table (published + retired records)
  const all = [];
  let offset = "";
  do {
    const page = await airtable(`${encodeURIComponent(AIRTABLE_TABLE)}?pageSize=100${offset ? `&offset=${offset}` : ""}`);
    all.push(...page.records);
    offset = page.offset || "";
  } while (offset);

  // Freeze finished editions that aren't archived yet
  const byDate = {};
  for (const r of all) {
    const d = r.fields["Date"];
    if (d && r.fields["Published"]) (byDate[d] = byDate[d] || []).push(r);
  }
  const archived = [];
  for (const d of Object.keys(byDate).sort()) {
    if (d >= cutoffArchive || index.dates.includes(d)) continue;
    const records = byDate[d]
      .sort((a, b) => (a.fields["Slot"] || 0) - (b.fields["Slot"] || 0))
      .map(r => ({ id: r.id, fields: r.fields }));
    await ghWriteJSON(`public/archive/${d}.json`, { date: d, records }, `Archive edition ${d}`);
    index.dates.push(d);
    archived.push(d);
  }
  if (archived.length) {
    index.dates = [...new Set(index.dates)].sort().reverse();
    await ghWriteJSON("public/archive/index.json", index, `Archive index: add ${archived.join(", ")}`, idx ? idx.sha : undefined);
  }

  // Prune Airtable: past retention AND (archived date OR retired record)
  const doomed = all.filter(r => {
    const d = r.fields["Date"];
    return d && d < cutoffDelete && (index.dates.includes(d) || !r.fields["Published"]);
  });
  for (let i = 0; i < doomed.length; i += 10) {
    const qs = doomed.slice(i, i + 10).map(r => `records[]=${r.id}`).join("&");
    await airtable(`${encodeURIComponent(AIRTABLE_TABLE)}?${qs}`, { method: "DELETE" });
  }
  return { archived, pruned: doomed.length };
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

Select EXACTLY 10 items for today's edition.

CHINA RELEVANCE (hard rule): every selection must have a clear China angle — Chinese consumers, Chinese brands, the China market, Chinese travelers, or Chinese policy. Skip stories that are merely global luxury / sports / entertainment / business with no China connection (a European designer-archive auction, a global sports-rights story, a Western brand executive's general musings, a Chinese brand's minor deal in an unrelated overseas market) — even when they come from [CORE] sources.

Category quotas (assign category by actual content — the (hint) is guidance only):
- Policy: exactly 2 — macro & policy: official data releases (NBS retail sales, CPI, PMI, GDP, trade), macroeconomic shifts, demographics, government regulation. If a fresh NBS monthly indicator is in the pool — especially Total Retail Sales of Consumer Goods — it MUST be one of the two.
- Consumer: 2 or 3 — consumer behavior, spending shifts, brand strategy, lifestyle trends. NOT gadget launches or startup funding.
- Retail: 1 or 2 — commercial real estate, malls, e-commerce, luxury retail, and duty-free/travel-retail concessions.
- Travel: 2 to 4 — inbound/outbound travel, passenger data, visa policy, hotels, duty free (Hainan policy, airport concessions), and OTA reports (Trip.com/Ctrip, Tuniu, Tongcheng — 暑运 / golden week / CNY season reports get priority when present).
- Tech: exactly 1 — the business of technology only (platform economics, AI commercialization, e-commerce infrastructure). Never product reviews or funding rounds.
(Consumer + Retail + Travel must total 7. If high-quality Retail candidates are scarce, do NOT force a weak Retail pick — give the spare slot to a strong Travel or Consumer story instead.)

Editorial priorities (from the editor-in-chief — apply these when choosing between candidates):
- Demographic and structural-shift analyses (population trends, aging, urbanization, city finances, 人口/啃老-type pieces) are flagship material — prefer them over corporate color stories for Policy and Consumer.
- Chinese homegrown brand breakout stories (a Chinese brand going viral or winning young consumers, e.g. gold jewelry, new tea, designer toys) are priority Consumer picks — global readers rarely see these.
- A brand story must carry an actionable lesson for brand leaders (a PR misstep, a positioning shift, a channel change). Brand-adjacent trivia — award shortlists, small franchise or partnership announcements, store-opening roundups — is low value.
- Duty-free and travel-retail wins (Hainan policy moves, airport arrivals concessions) are priority picks, classed as Retail or Travel.
- OTA seasonal/annual reports are must-covers when present. For data/trend REPORTS (anything styled 报告/报表 or a named seasonal report), up to ~4 weeks old is acceptable; ordinary news must still be fresh.

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
      if (!(counts.Retail >= 1 && counts.Retail <= 2)) throw new Error(`need 1-2 Retail, got ${counts.Retail || 0}`);
      if (counts.Tech !== 1) throw new Error(`need exactly 1 Tech, got ${counts.Tech || 0}`);
      if (!(counts.Consumer >= 2 && counts.Consumer <= 3)) throw new Error(`need 2-3 Consumer, got ${counts.Consumer || 0}`);
      if (!(counts.Travel >= 2 && counts.Travel <= 4)) throw new Error(`need 2-4 Travel, got ${counts.Travel || 0}`);
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
- headline: written as a native Bloomberg/FT editor would — natural, idiomatic English. NEVER translate the Chinese title literally or word-for-word; extract what the story is about and write a fresh English headline from scratch. Under 15 words, no clickbait, no Chinglish.
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

  const params = new URL(req.url, "http://x").searchParams;
  const force = params.get("force") === "1";
  // "today" in Hong Kong time
  const dateStr = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

  try {
    // Manual editorial mode: POST { articles: [...], removeSlots: [...] } —
    // publishes editor-supplied, fully written articles into today's edition and
    // retires the published records occupying the removed slots. No DeepSeek call.
    if (params.get("manual") === "1" && req.method === "POST") {
      const body = typeof req.body === "object" && req.body !== null ? req.body : JSON.parse(req.body || "{}");
      const arts = Array.isArray(body.articles) ? body.articles : [];
      const removeSlots = new Set(Array.isArray(body.removeSlots) ? body.removeSlots : []);
      if (!arts.length) return res.status(400).json({ error: "no articles in body" });
      const records = arts.map(a => ({
        fields: {
          "Headline": a.headline, "Summary": a.summary, "Body": a.body,
          "Why It Matters": a.why_it_matters, "Category": a.category, "Tag": a.tag,
          "Source EN": a.source_en, "Source ZH": a.source_zh || a.source_en,
          "Original URL": a.original_url, "Date": dateStr, "Time": "06:00",
          "Slot": a.slot, "Is Lead": !!a.is_lead, "Published": true,
          "Read Time": a.read_time || "4 min", "Author": "ChinaPulse Editorial",
        },
      }));
      const created = await airtable(encodeURIComponent(AIRTABLE_TABLE), {
        method: "POST", body: JSON.stringify({ records, typecast: true }),
      });
      const createdIds = new Set(created.records.map(r => r.id));
      const formula = encodeURIComponent(`AND({Published}=1, IS_SAME({Date}, '${dateStr}', 'day'))`);
      const data = await airtable(`${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&pageSize=100`);
      const stale = data.records.filter(r => !createdIds.has(r.id) && removeSlots.has(r.fields.Slot));
      for (let i = 0; i < stale.length; i += 10) {
        await airtable(encodeURIComponent(AIRTABLE_TABLE), {
          method: "PATCH",
          body: JSON.stringify({ records: stale.slice(i, i + 10).map(r => ({ id: r.id, fields: { "Published": false } })) }),
        });
      }
      return res.status(200).json({ ok: true, manual: true, date: dateStr, published: created.records.length, unpublished: stale.length });
    }

    // Maintenance mode: archive finished editions to GitHub + prune old Airtable
    // records, without generating anything. Free.
    if (params.get("archive") === "1") {
      const result = await archiveAndPrune();
      return res.status(200).json({ ok: true, archiveRun: true, ...result });
    }

    // Maintenance mode: keep only the most recent 10 published records for today,
    // unpublish the rest (repairs duplicate editions left by pre-fix force runs).
    // Free — no article generation happens.
    if (params.get("cleanup") === "1") {
      const formula = encodeURIComponent(`AND({Published}=1, IS_SAME({Date}, '${dateStr}', 'day'))`);
      const data = await airtable(`${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&pageSize=100`);
      const newest = [...data.records].sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime)).slice(0, 10);
      const unpublished = await unpublishSameDay(dateStr, new Set(newest.map(r => r.id)));
      return res.status(200).json({ ok: true, cleanup: true, date: dateStr, kept: newest.length, unpublished });
    }

    if (!force && await editionExists(dateStr)) {
      return res.status(200).json({ ok: true, skipped: true, message: `Edition for ${dateStr} already published` });
    }

    // 1. Collect news
    const results = await Promise.all(FEEDS.map(fetchFeed));
    const seen = new Set();
    let items = results.flat().filter(it => {
      const k = it.title.toLowerCase().slice(0, 60);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Drop anything already published in a recent edition (non-fatal if the lookup fails)
    let alreadyCovered = 0;
    try {
      const covered = await recentlyCoveredUrls();
      const before = items.length;
      items = items.filter(it => !covered.has(normUrl(it.link)));
      alreadyCovered = before - items.length;
    } catch (e) {
      console.error(`covered-urls lookup failed: ${e.message}`);
    }

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

    // On a forced re-run, retire the earlier same-day edition so the site never
    // shows more than 10 articles for one date (non-fatal if it fails).
    let unpublished = 0;
    try {
      unpublished = await unpublishSameDay(dateStr, new Set(created.records.map(r => r.id)));
    } catch (e) {
      console.error(`same-day unpublish failed: ${e.message}`);
    }

    // 4. Freeze old editions into the GitHub archive + prune old Airtable records
    //    (non-fatal; skipped until GITHUB_TOKEN is configured)
    let archive = {};
    try {
      archive = await archiveAndPrune();
    } catch (e) {
      console.error(`archive/prune failed: ${e.message}`);
      archive = { error: e.message };
    }

    // 5. Email the daily digest to subscribers (non-fatal if Resend not configured)
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
      alreadyCovered,
      unpublished,
      archive,
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
