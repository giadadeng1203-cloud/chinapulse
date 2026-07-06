// ChinaPulse weekly summary email
// Runs on a Vercel cron every Sunday 23:00 UTC = Monday 7:00 AM HKT (see
// vercel.json). Collects the past week's published articles, picks the top 10
// (lead stories first, then by slot), and emails all Active "Weekly"
// subscribers via Resend.

import { airtable, ARTICLES_TABLE, sendDigest } from "./_lib.js";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || "";
    const key = new URL(req.url, "http://x").searchParams.get("key");
    if (auth !== `Bearer ${secret}` && key !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  if (!process.env.AIRTABLE_TOKEN) return res.status(500).json({ error: "AIRTABLE_TOKEN is not set" });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY is not set" });

  try {
    // all published articles from the last 7 days
    const formula = encodeURIComponent(`AND({Published}=1, IS_AFTER({Date}, DATEADD(TODAY(), -8, 'days')))`);
    const records = [];
    let offset = "";
    do {
      const data = await airtable(`${ARTICLES_TABLE}?filterByFormula=${formula}&pageSize=100${offset ? `&offset=${offset}` : ""}`);
      records.push(...data.records);
      offset = data.offset || "";
    } while (offset);

    const articles = records.map(r => ({
      headline: r.fields["Headline"] || "",
      summary:  r.fields["Summary"] || "",
      category: r.fields["Category"] || "",
      tag:      r.fields["Tag"] || "",
      url:      r.fields["Original URL"] || "",
      source:   r.fields["Source EN"] || "",
      isLead:   !!r.fields["Is Lead"],
      slot:     r.fields["Slot"] || 99,
    })).filter(a => a.headline);

    // top 10 of the week: lead stories first, then top slots
    const top = articles
      .sort((a, b) => (b.isLead ? 1 : 0) - (a.isLead ? 1 : 0) || a.slot - b.slot)
      .slice(0, 10);

    if (!top.length) return res.status(200).json({ ok: true, skipped: "no articles published this week" });

    const weekOf = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const result = await sendDigest({
      frequency: "Weekly",
      subject: `ChinaPulse Weekly — your China briefing, ${weekOf}`,
      title: "Your Weekly China Briefing",
      intro: "The most important China business stories from the past week, translated and decoded.",
      articles: top,
    });

    return res.status(200).json({ ok: true, articlesInDigest: top.length, ...result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
