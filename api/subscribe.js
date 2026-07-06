// Subscription endpoint
// POST { email, freq: "daily" | "weekly" }  → saves to the Airtable Subscribers
//   table (visible to the editor) and sends a welcome email via Resend.
// GET ?action=unsubscribe&email=...&sig=...  → one-click unsubscribe link used
//   in every email footer.

import { airtable, SUBSCRIBERS_TABLE, sendEmail, welcomeHtml, unsubscribeSig } from "./_lib.js";

const EMAIL_RE = /^[^\s'"\\@]+@[^\s'"\\@]+\.[^\s'"\\@]+$/;

async function findSubscriber(email) {
  const formula = encodeURIComponent(`LOWER({Email})='${email.toLowerCase()}'`);
  const data = await airtable(`${encodeURIComponent(SUBSCRIBERS_TABLE)}?filterByFormula=${formula}&maxRecords=1`);
  return data.records[0] || null;
}

export default async function handler(req, res) {
  if (!process.env.AIRTABLE_TOKEN) return res.status(500).json({ error: "AIRTABLE_TOKEN is not set" });

  // ── one-click unsubscribe ──────────────────────────────────────────────────
  if (req.method === "GET") {
    const url = new URL(req.url, "http://x");
    if (url.searchParams.get("action") !== "unsubscribe") return res.status(400).json({ error: "Bad request" });
    const email = (url.searchParams.get("email") || "").trim();
    const sig = url.searchParams.get("sig") || "";
    if (!EMAIL_RE.test(email) || sig !== unsubscribeSig(email)) {
      return res.status(400).send("Invalid unsubscribe link.");
    }
    try {
      const rec = await findSubscriber(email);
      if (rec) {
        await airtable(`${encodeURIComponent(SUBSCRIBERS_TABLE)}/${rec.id}`, {
          method: "PATCH",
          body: JSON.stringify({ fields: { Status: "Unsubscribed" }, typecast: true }),
        });
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(`<html><body style="font-family:Georgia,serif;text-align:center;padding:4rem 1.5rem;background:#FFFFFF;color:#1A1A1A;">
<h2 style="margin-bottom:0.5rem;">You're unsubscribed.</h2>
<p style="color:#4A4A4A;">You won't receive further emails from ChinaPulse. Changed your mind? You can re-subscribe any time at <a href="https://china-pulse-daily.vercel.app" style="color:#C8102E;">china-pulse-daily.vercel.app</a>.</p>
</body></html>`);
    } catch (e) {
      console.error(e);
      return res.status(500).send("Something went wrong — please email info@arcohk.com to unsubscribe.");
    }
  }

  // ── subscribe ──────────────────────────────────────────────────────────────
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email: rawEmail, freq } = req.body || {};
  const email = (rawEmail || "").trim();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Please enter a valid email address" });
  const frequency = freq === "weekly" ? "Weekly" : "Daily";

  try {
    const existing = await findSubscriber(email);
    if (existing) {
      await airtable(`${encodeURIComponent(SUBSCRIBERS_TABLE)}/${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: { Frequency: frequency, Status: "Active" }, typecast: true }),
      });
    } else {
      await airtable(encodeURIComponent(SUBSCRIBERS_TABLE), {
        method: "POST",
        body: JSON.stringify({
          records: [{ fields: { Email: email, Frequency: frequency, Status: "Active" } }],
          typecast: true,
        }),
      });
    }

    // welcome email — non-fatal if Resend isn't configured yet
    let welcomed = false;
    if (process.env.RESEND_API_KEY) {
      try {
        await sendEmail({ to: email, subject: "Welcome to ChinaPulse 中国脉搏", html: welcomeHtml(email, frequency) });
        welcomed = true;
      } catch (e) {
        console.error(`welcome email failed: ${e.message}`);
      }
    }

    return res.status(200).json({ ok: true, frequency, welcomed });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Subscription failed — please try again later" });
  }
}
