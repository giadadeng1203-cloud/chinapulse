# ChinaPulse — Setup for the Daily Auto-Publish Pipeline

The site now refreshes itself: a Vercel cron job runs every day at **6:00 AM HKT** (`22:00 UTC`),
pulls fresh news from RSS sources, has Claude write 10 original English articles, and publishes
them straight into Airtable. The website always shows the latest edition automatically
(it re-fetches Airtable every 10 minutes and whenever the tab regains focus).

## One-time setup (required)

### 1. Create two new Airtable tokens ⚠️

The old token that was baked into the site is dead — it **no longer has access to base
`appLJfM0uboPvSB0E`** (this is why the live site shows no articles today). It has been
removed from the code; tokens now come only from environment variables.

Go to https://airtable.com/create/tokens and create **two** tokens, both with access to
the ChinaPulse base (`appLJfM0uboPvSB0E`):

1. **Read-only token** — scope `data.records:read` only. Used by the website in the
   browser (it is publicly visible in the page source, so read-only keeps it safe).
2. **Read + write token** — scopes `data.records:read` + `data.records:write`. Used
   only server-side by the daily pipeline; never exposed.

### 2. Add environment variables in Vercel

Vercel → your project (`china-pulse-daily`) → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (https://platform.claude.com) |
| `AIRTABLE_TOKEN` | The **read + write** token (server-side pipeline) |
| `VITE_AIRTABLE_TOKEN` | The **read-only** token (website) |
| `CRON_SECRET` | Any random string, e.g. from https://generate-secret.vercel.app/32 |

Then **redeploy** (Deployments → ⋯ → Redeploy) so the variables take effect.

### 3. Test it

Open in your browser (replace `YOUR_SECRET` with your CRON_SECRET value):

```
https://china-pulse-daily.vercel.app/api/daily-refresh?key=YOUR_SECRET
```

Wait 1–3 minutes; it returns JSON with the 10 published headlines. Refresh the site — today's
edition appears. It will run by itself every morning after this.

To force a re-run for the same day (e.g. for testing): add `&force=1`.

## Airtable fields used

`Headline, Summary, Body, Why It Matters, Category, Tag, Source EN, Source ZH, Original URL,
Date, Time, Slot, Is Lead, Published, Read Time, Author` — same schema as before.
`typecast: true` is used, so new Category select options are created automatically if missing.

## News sources the pipeline monitors

Pandaily, TechNode, Sixth Tone, SCMP (China + Business), 36Kr, plus targeted Google News
queries for retail, luxury/consumer, travel, and policy — filtered to the last 48 hours.
(WeChat 公众号 sources can't be fetched automatically; use the + Submit page / Airtable
directly to add those manually when needed.)

## Notes

- The cron only publishes once per day — if an edition for today already exists it skips
  (so a manual run + the cron won't double-post).
- Older days stay in Airtable and appear in the site's "Editions Archive" sidebar.
- Vercel Hobby plan supports daily crons and up to 300s function duration — both within limits.
