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

const FEEDS = [
  { url: "https://pandaily.com/feed/",  sourceEN: "Pandaily",      sourceZH: "Pandaily",  hint: "tech" },
  { url: "https://technode.com/feed/",  sourceEN: "TechNode",      sourceZH: "动点科技",   hint: "tech" },
  { url: "https://www.sixthtone.com/rss", sourceEN: "Sixth Tone",  sourceZH: "第六声",     hint: "consumer" },
  { url: "https://www.scmp.com/rss/4/feed", sourceEN: "SCMP",      sourceZH: "南华早报",   hint: "policy" },
  { url: "https://www.scmp.com/rss/2/feed", sourceEN: "SCMP Business", sourceZH: "南华早报", hint: "retail" },
  { url: "https://36kr.com/feed",       sourceEN: "36Kr",          sourceZH: "36氪",      hint: "consumer" },
  { url: "https://news.google.com/rss/search?q=china+retail+e-commerce+consumer+when:2d&hl=en-US&gl=US&ceid=US:en", sourceEN: "Google News", sourceZH: "", hint: "retail" },
  { url: "https://news.google.com/rss/search?q=china+luxury+brands+shopping+when:2d&hl=en-US&gl=US&ceid=US:en",     sourceEN: "Google News", sourceZH: "", hint: "consumer" },
  { url: "https://news.google.com/rss/search?q=china+outbound+travel+tourism+visa+hotel+when:2d&hl=en-US&gl=US&ceid=US:en", sourceEN: "Google News", sourceZH: "", hint: "travel" },
  { url: "https://news.google.com/rss/search?q=china+policy+regulation+economy+when:2d&hl=en-US&gl=US&ceid=US:en",  sourceEN: "Google News", sourceZH: "", hint: "policy" },
];

const MAX_ITEMS_PER_FEED = 12;
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

async function fetchFeed(feed) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ChinaPulseBot/1.0)" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const re = /<item[\s>][\s\S]*?<\/item>/gi;
    let m;
    while ((m = re.exec(xml)) && items.length < MAX_ITEMS_PER_FEED) {
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
      items.push({ title, link, pubDate, description: desc, sourceEN: feed.sourceEN, sourceZH: feed.sourceZH, hint: feed.hint });
    }
    return items;
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
  const itemList = items.map((it, i) =>
    `[${i + 1}] (${it.hint}) ${it.title}\n    source: ${it.sourceEN}${it.sourceZH ? ` / ${it.sourceZH}` : ""} | url: ${it.link}\n    ${it.description || "(no description)"}`
  ).join("\n\n");

  // Step 1: select 10 items, balanced across categories
  const selection = await deepseekJSON(
    `Below are candidate news items collected in the last 48 hours from ChinaPulse's monitored feeds. Today's edition date is ${dateStr}.

${itemList}

Select EXACTLY 10 items for today's edition:
- Exactly 2 per category: Consumer, Retail, Policy, Tech, Travel (the (hint) is guidance only — assign category by actual content).
- Choose the most business-relevant, consequential stories. Skip duplicates and pure politics/sports.
- slot 1-10 by importance; the slot-1 story has is_lead true, all others false.
- tag: short label like TREND REPORT, REGULATION, ANALYSIS, MARKET MOVE, DEAL WATCH.

Respond with JSON only, exactly this shape:
{"selections": [{"item": <item number>, "category": "Consumer|Retail|Policy|Tech|Travel", "slot": 1, "is_lead": true, "tag": "TREND REPORT"}, ...10 entries total]}`,
    2000,
    (d) => {
      if (!Array.isArray(d.selections) || d.selections.length !== 10) throw new Error("need exactly 10 selections");
      for (const s of d.selections) {
        if (!CATEGORIES.includes(s.category)) throw new Error(`bad category: ${s.category}`);
        if (!items[s.item - 1]) throw new Error(`bad item number: ${s.item}`);
      }
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

    return res.status(200).json({
      ok: true,
      date: dateStr,
      itemsCollected: items.length,
      published: created.records.length,
      digest,
      headlines: articles.map(a => a.headline),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, date: dateStr, error: e.message });
  }
}
