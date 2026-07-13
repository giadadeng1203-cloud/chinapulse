// Shared helpers for ChinaPulse serverless functions.
// Underscore-prefixed files in /api are not deployed as endpoints.
import crypto from "node:crypto";

export const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appLJfM0uboPvSB0E";
export const ARTICLES_TABLE = "tblzRNwo2f1hIGpIF"; // "Imported table" — referenced by permanent ID
// Subscribers table referenced by permanent ID (user's table is named "Table 3")
export const SUBSCRIBERS_TABLE = process.env.SUBSCRIBERS_TABLE || "tbllLLiLJrssP7Uov";
export const SITE_URL = process.env.SITE_URL || "https://china-pulse-daily.vercel.app";

const CAT_COLORS = { Consumer: "#1E7F4F", Retail: "#B87A1E", Policy: "#1B5FA8", Tech: "#6B3A8A", Travel: "#1B7A8A" };

export async function airtable(path, options = {}) {
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

// ─── Subscribers ─────────────────────────────────────────────────────────────
export async function getSubscribers(frequency) {
  const formula = encodeURIComponent(`AND({Status}='Active', {Frequency}='${frequency}')`);
  const records = [];
  let offset = "";
  do {
    const data = await airtable(`${encodeURIComponent(SUBSCRIBERS_TABLE)}?filterByFormula=${formula}&pageSize=100${offset ? `&offset=${offset}` : ""}`);
    records.push(...data.records);
    offset = data.offset || "";
  } while (offset);
  return records;
}

export function unsubscribeSig(email) {
  return crypto.createHmac("sha256", process.env.CRON_SECRET || "chinapulse")
    .update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function unsubscribeUrl(email) {
  return `${SITE_URL}/api/subscribe?action=unsubscribe&email=${encodeURIComponent(email)}&sig=${unsubscribeSig(email)}`;
}

// ─── Email via Resend ────────────────────────────────────────────────────────
export async function sendEmail({ to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "ChinaPulse <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

const emailShell = (inner, footer) => `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F4F3EF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3EF;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E2E0DB;">
  <tr><td style="background:#C8102E;padding:14px 24px;">
    <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#FFFFFF;">ChinaPulse</span>
    <span style="font-family:Georgia,serif;font-size:13px;color:rgba(255,255,255,0.85);font-style:italic;">&nbsp;中国脉搏</span>
  </td></tr>
  ${inner}
  <tr><td style="padding:18px 24px;border-top:1px solid #E2E0DB;background:#FAFAF8;">
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#8A8880;line-height:1.7;margin:0;">
      ChinaPulse is part of Arco Consultancy · <a href="mailto:info@arcohk.com" style="color:#C8102E;">info@arcohk.com</a><br/>
      ${footer}<br/>
      Summaries edited for informational purposes. Not investment advice.
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;

export function welcomeHtml(email, frequency) {
  const cadence = frequency === "Weekly"
    ? "every Monday morning (HKT) with the week's most important stories"
    : "every day at 7 AM HKT with the day's 10 most important stories";
  const inner = `
  <tr><td style="padding:28px 24px 8px;">
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A1A1A;margin:0 0 12px;">Welcome to ChinaPulse</h1>
    <p style="font-family:Georgia,serif;font-size:15px;color:#4A4A4A;line-height:1.8;margin:0 0 12px;">
      You're subscribed to the <strong>${frequency}</strong> digest — we'll email you ${cadence}, translated and decoded from China's leading business sources.
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#4A4A4A;line-height:1.8;margin:0 0 20px;">
      In the meantime, today's edition is already live on the site.
    </p>
    <p style="margin:0 0 24px;"><a href="${SITE_URL}" style="background:#C8102E;color:#FFFFFF;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;padding:10px 22px;display:inline-block;">READ TODAY'S EDITION →</a></p>
  </td></tr>`;
  return emailShell(inner, `You're receiving this because you subscribed at china-pulse-daily.vercel.app · Questions? <a href="mailto:info@arcohk.com" style="color:#8A8880;">info@arcohk.com</a> · <a href="${unsubscribeUrl(email)}" style="color:#8A8880;">Unsubscribe</a>`);
}

export function digestHtml({ title, intro, articles, recipientEmail }) {
  const rows = articles.map((a, i) => {
    const color = CAT_COLORS[a.category] || "#C8102E";
    return `
  <tr><td style="padding:${i === 0 ? "20" : "6"}px 24px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${color};background:#FAFAF8;">
      <tr><td style="padding:12px 16px;">
        <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1px;color:${color};margin:0 0 6px;">${(a.category || "").toUpperCase()}${a.tag ? " · " + a.tag : ""}</p>
        <p style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#1A1A1A;line-height:1.4;margin:0 0 6px;">${a.headline}</p>
        <p style="font-family:Georgia,serif;font-size:13px;color:#4A4A4A;line-height:1.7;margin:0 0 8px;">${a.summary}</p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#8A8880;margin:0;">${a.source || ""}${a.url ? ` · <a href="${a.url}" style="color:#C8102E;">Read original →</a>` : ""}</p>
      </td></tr>
    </table>
  </td></tr>`;
  }).join("");

  const inner = `
  <tr><td style="padding:24px 24px 0;">
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A1A1A;margin:0 0 8px;">${title}</h1>
    <p style="font-family:Georgia,serif;font-size:14px;color:#4A4A4A;line-height:1.7;margin:0;">${intro}</p>
  </td></tr>
  ${rows}
  <tr><td style="padding:18px 24px 26px;" align="center">
    <a href="${SITE_URL}" style="background:#C8102E;color:#FFFFFF;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;padding:10px 22px;display:inline-block;">READ THE FULL EDITION →</a>
  </td></tr>`;
  return emailShell(inner, `You're receiving this because you subscribed at china-pulse-daily.vercel.app · Questions? <a href="mailto:info@arcohk.com" style="color:#8A8880;">info@arcohk.com</a> · <a href="${unsubscribeUrl(recipientEmail)}" style="color:#8A8880;">Unsubscribe</a>`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Send a digest to all Active subscribers of the given frequency.
// Sequential with a delay to respect Resend's 2 req/s rate limit.
export async function sendDigest({ frequency, subject, title, intro, articles }) {
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: "RESEND_API_KEY not set" };
  if (!articles.length) return { sent: 0, skipped: "no articles" };
  const subs = await getSubscribers(frequency);
  let sent = 0, failed = 0;
  for (const s of subs) {
    const email = s.fields["Email"];
    if (!email) continue;
    try {
      await sendEmail({ to: email, subject, html: digestHtml({ title, intro, articles, recipientEmail: email }) });
      sent++;
    } catch (e) {
      console.error(`digest → ${email}: ${e.message}`);
      failed++;
    }
    await sleep(600);
  }
  return { sent, failed, total: subs.length };
}
