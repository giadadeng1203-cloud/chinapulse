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
| `DEEPSEEK_API_KEY` | Your DeepSeek API key (https://platform.deepseek.com — top up via Alipay/WeChat Pay; the daily run costs well under ¥0.5) |
| `AIRTABLE_TOKEN` | The **read + write** token (server-side pipeline) |
| `VITE_AIRTABLE_TOKEN` | The **read-only** token (website) |
| `CRON_SECRET` | Any random string, e.g. from https://generate-secret.vercel.app/32 |
| `RESEND_API_KEY` | From https://resend.com (free — 3,000 emails/month) — powers welcome, daily-digest, and weekly-digest emails |
| `EMAIL_FROM` | Optional. Sender address, e.g. `ChinaPulse <news@arcohk.com>` after verifying the arcohk.com domain in Resend; defaults to Resend's test sender |

## Email subscriptions

- Signups on the site call `/api/subscribe`, which stores each subscriber in the Airtable
  **Subscribers** table (fields: Email, Frequency = Daily/Weekly, Status = Active/Unsubscribed,
  Subscribed At) and sends a welcome email.
- Daily subscribers get the digest automatically at the end of each 6 AM pipeline run.
- Weekly subscribers get a top-10-of-the-week digest every **Monday 7 AM HKT**
  (cron `/api/weekly-digest`, manual test: `/api/weekly-digest?key=CRON_SECRET`).
- Every email has a one-click unsubscribe link that flips the subscriber's Status in Airtable.

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

## Edition structure

10 articles daily, ordered macro-first: **Policy/Macro (slots 1-2, slot 1 is the lead) →
Consumer (2-3) → Retail (1-2) → Travel (2-4) → Tech (exactly 1, always slot 10)**.
If quality Retail candidates are thin, the spare slot goes to a strong Travel or Consumer
story instead of forcing a weak pick. The category quotas are validated in code — a run
fails rather than publish a tech-heavy edition. The site nav shows the same order (the
Policy tab is labeled "Macro"; the underlying Airtable category is still `Policy`).

**Editorial rules baked into selection** (from Giada's review of the 2026-07-13 edition):
every pick needs a clear China angle (global luxury/sports stories are out, even from core
sources); demographic/structural analyses are flagship material; Chinese homegrown brand
breakouts are priority Consumer picks; brand stories must carry an actionable lesson (no
award shortlists or minor franchise deals); duty-free concession wins are priority
Retail/Travel; OTA seasonal reports are must-covers and may be up to ~4 weeks old.
Stories already published in a recent edition are automatically excluded from the pool
(URL match against the last ~100 published records).

## News sources the pipeline monitors

**Core sources** (the platform's positioning — the selection step is instructed to draw at
least 6 of the 10 daily articles from these):

| Source | How it's fetched |
|---|---|
| 虎嗅 Huxiu | RSS (`rss.huxiu.com`) |
| 36氪 (incl. 未来消费 coverage) | RSS (`36kr.com/feed`) |
| 华丽志 Luxe.CO | RSS (`luxe.co/feed`) |
| 赢商网 Winshang | HTML scrape of `news.winshang.com` |
| 环球旅讯 TravelDaily | HTML scrape of `traveldaily.cn` (PR/corporate posts skipped) |
| Jing Daily | RSS (Feedburner) |
| DT商业观察 | JSON endpoint on `dt.yicai.com` (free; publishes ~monthly, 14-day window) |
| 国家统计局 NBS (English) | HTML scrape of `stats.gov.cn/english/PressRelease/` — retail sales, CPI, PMI, GDP; 10-day window; a fresh monthly retail-sales release is a mandatory pick |
| 品橙旅游 Pinchain | HTML scrape of 3 category pages: tourism (inbound/outbound), datacenter (pax data), onlinetravel (OTA reports incl. Ctrip/Tuniu/Tongcheng seasonal reports) |
| Dragon Trail 龙途互动 | HTML scrape of `dragontrail.com.cn/resources/blog` (English Chinese-traveler insights) |

**Secondary English sources:** CGTN (Business + Travel), The Moodie Davitt Report
(duty-free/travel retail — the selector only picks its China/Hainan/Asia-Pacific-relevant
items), SCMP (China + Business), Sixth Tone, Pandaily (tech, capped at 4 items).
**Fallback:** Reuters China coverage via a Google News query — at most 2 wire picks per
edition, macro/policy only. Everything is filtered to the last 48 hours where feeds carry
dates.

**Still manual (via the + Submit page):** 要客研究院 (WeChat-only, no feed anywhere),
DT商业观察's WeChat-only pieces, and 亿邦动力 Ebrun (its site blocks automated fetching
and Google barely indexes it — submit its occasional relevant retail/cross-border pieces
by hand).

## Notes

- The cron only publishes once per day — if an edition for today already exists it skips
  (so a manual run + the cron won't double-post).
- Older days stay in Airtable and appear in the site's "Editions Archive" sidebar.
- Vercel Hobby plan supports daily crons and up to 300s function duration — both within limits.
