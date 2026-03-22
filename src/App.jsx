import { useState } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  red:"#C8102E", bg:"#FFFFFF", bgAlt:"#F7F6F3", bgAlt2:"#FAFAF8",
  border:"#E2E0DB", borderLight:"#EBEBEB",
  text:"#1a1a1a", textSub:"#4a4a4a", textMuted:"#888880",
  serif:"Georgia,'Times New Roman',serif",
  sans:"'Arial',Helvetica,sans-serif",
  mono:"'Courier New',Courier,monospace",
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATS = [
  { id:"all",      label:"All",      color:"#C8102E" },
  { id:"consumer", label:"Consumer", color:"#2E7D52" },
  { id:"retail",   label:"Retail",   color:"#9B6B3E" },
  { id:"policy",   label:"Policy",   color:"#1B5FA8" },
  { id:"tech",     label:"Tech",     color:"#6B3A8A" },
  { id:"travel",   label:"Travel",   color:"#1B7A8A" },
];

// ─── SOURCES ──────────────────────────────────────────────────────────────────
const SOURCES = {
  caixin:      { zh:"财新",          en:"Caixin",                url:"https://www.caixin.com"     },
  huxiu:       { zh:"虎嗅",          en:"Huxiu",                 url:"https://www.huxiu.com"      },
  "36kr":      { zh:"36氪",          en:"36Kr",                  url:"https://36kr.com"           },
  "36kr-fc":   { zh:"36氪未来消费",   en:"36Kr Future Commerce",  url:"https://36kr.com"           },
  winshang:    { zh:"赢商网",         en:"Winshang",              url:"https://www.winshang.com"   },
  hualizhi:    { zh:"华丽志",         en:"Huali Zhi",             url:"https://www.hualizhi.com"   },
  traveldaily: { zh:"环球旅讯",       en:"TravelDaily CN",        url:"https://www.traveldaily.cn" },
  jingdaily:   { zh:"Jing Daily",    en:"Jing Daily",            url:"https://jingdaily.com"      },
  concall:     { zh:"ConCall",       en:"ConCall",               url:"https://www.concall.cn"     },
  ceo:         { zh:"CEO品牌观察",    en:"CEO Brand Watch",       url:"https://mp.weixin.qq.com"   },
  fashionbiz:  { zh:"时尚商业Daily",  en:"Fashion Business Daily",url:"https://mp.weixin.qq.com"   },
  iziretail:   { zh:"iziRetail热点", en:"iziRetail",             url:"https://mp.weixin.qq.com"   },
  dtbiz:       { zh:"DT商业观察",    en:"DT Business",           url:"https://www.dtcj.com"       },
  guangzi:     { zh:"光仔看消费",     en:"Guangzi Consumption",   url:"https://mp.weixin.qq.com"   },
  unicornmall: { zh:"独角Mall",      en:"Unicorn Mall",          url:"https://mp.weixin.qq.com"   },
  tangfashion: { zh:"唐小唐时尚观察", en:"Tang Fashion Watch",    url:"https://mp.weixin.qq.com"   },
  localretail: { zh:"本土零售观察",   en:"Local Retail Watch",    url:"https://mp.weixin.qq.com"   },
  alibaba:     { zh:"阿里研究院",     en:"Alibaba Research",      url:"https://www.aliresearch.com"},
  yaoke:       { zh:"要客研究院",     en:"Yaoke Research",        url:"https://www.yaoke.com"      },
  reuters:     { zh:"Reuters",       en:"Reuters",               url:"https://www.reuters.com"    },
  scmp:        { zh:"南华早报",       en:"SCMP",                  url:"https://www.scmp.com"       },
  luxeco:      { zh:"Luxe.co",       en:"Luxe.co",               url:"https://luxe.co"            },
  pandaily:    { zh:"Pandaily",      en:"Pandaily",              url:"https://pandaily.com"       },
};

// ─── ARTICLES ─────────────────────────────────────────────────────────────────
const ARTICLES = [
  {
    id:1, slot:1, category:"policy", tag:"DATA RELEASE", isLead:true,
    source:"caixin", date:"22 Mar 2026", time:"08:30", readTime:"4 min",
    headline:"China Retail Sales Beat Forecasts in February, Signaling Durable Recovery",
    summary:"China's retail sales rose 4.2% year-on-year in February, reaching ¥1.24 trillion and surpassing analyst expectations of 3.6% growth. The outperformance was broad-based, with catering revenues leading at +6.8% and online physical goods sales growing 5.1%. Government stimulus measures, including the trade-in subsidy program extension through Q3 2026, have driven strong demand in appliances and electric vehicles.",
    body:`China's retail sector delivered a stronger-than-expected performance in February 2026, with total sales rising 4.2% year-on-year to reach ¥1.24 trillion — comfortably ahead of the 3.6% consensus forecast polled by Bloomberg.

The data, released by China's National Bureau of Statistics, signals that consumer confidence is holding up more durably than many economists had feared following the Lunar New Year period, when spending patterns are traditionally volatile.

Breaking down the numbers, catering and food service revenues led the charge with a 6.8% year-on-year gain, reflecting the continued consumer preference for experiential and out-of-home spending that has defined the post-pandemic recovery narrative. Online physical goods sales — a closely watched indicator of e-commerce health — rose 5.1%.

The government's trade-in subsidy program, extended through Q3 2026, has been a material driver of big-ticket consumer durable purchases. Appliance sales were up 11.2% and new energy vehicle retail volumes hit a record 940,000 units in the month.

Goldman Sachs revised its full-year private consumption growth forecast upward to 4.5% from 4.0% following the release, while UBS noted that the data "reduces the tail risk of a consumption stall scenario that some bears had been pricing in."

For businesses, the February numbers reinforce the case that China's consumer recovery — while uneven across income groups and product categories — is sufficiently durable to justify continued investment in the market.`,
    matters:"Consumer confidence is more resilient than feared. Brands with strong in-store and experiential formats are best positioned to capture the recovery. The subsidy extension creates a near-term window for durables and EV-adjacent brands.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://www.caixin.com",
  },
  {
    id:2, slot:2, category:"policy", tag:"REGULATION", isLead:false,
    source:"huxiu", date:"22 Mar 2026", time:"09:15", readTime:"5 min",
    headline:"SAMR Finalises Platform Economy Rules — April 1 Deadline Approaches",
    summary:"China's State Administration for Market Regulation has published its finalised guidelines on platform economy governance, covering data usage, algorithmic pricing transparency, and merchant exclusivity. Effective April 1, the rules prohibit platforms from using internal data to disadvantage third-party sellers. Alibaba, JD.com, and Pinduoduo have acknowledged the notice and begun compliance preparations.",
    body:`China's top market regulator has drawn a line in the sand for the country's platform economy, publishing a comprehensive set of finalised guidelines that will take effect on April 1, 2026 — giving major e-commerce operators less than two weeks to ensure compliance.

The State Administration for Market Regulation (SAMR) rules cover three core areas: data governance, algorithmic pricing transparency, and merchant exclusivity provisions.

On data, platforms are now explicitly prohibited from using proprietary internal data — including behavioural, transactional, and logistical data — to give their own products or affiliated brands a competitive advantage over third-party merchants. This directly targets a practice that smaller sellers have long complained about on Alibaba's Tmall and JD.com's platform.

The algorithmic pricing provisions require platforms to disclose the ranking criteria used in search results and product recommendations to merchants. Platforms with over 50 million monthly active users face enhanced audit requirements and must submit compliance reports to SAMR within 30 days of the rules taking effect.

On exclusivity, the so-called "choose one of two" (二选一) arrangements — where brands are pressured to sell exclusively on one platform — are formally prohibited with specific financial penalties now attached.

Alibaba, JD.com, and Pinduoduo have each acknowledged receipt of the guidelines in official statements. Meituan separately pledged to publish a public compliance disclosure by March 31.

Analysts at Bernstein note that the rules represent a "regulatory maturation moment" rather than a new crackdown cycle, with enforcement likely to be graduated rather than punitive in the near term.`,
    matters:"This is compliance management, not a crackdown. The cost burden falls disproportionately on smaller platforms. Foreign brands selling via these platforms should immediately review data-sharing clauses in their platform agreements.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://www.huxiu.com",
  },
  {
    id:3, slot:3, category:"consumer", tag:"TREND REPORT", isLead:false,
    source:"36kr-fc", date:"22 Mar 2026", time:"10:00", readTime:"6 min",
    headline:"'Situational Consumption' Is Reshaping How Young Chinese Spend in 2026",
    summary:"36Kr Future Commerce's latest research identifies 'situational consumption' as the defining spending pattern among Chinese consumers under 30 in 2026. Rather than product-led purchases, spending is increasingly triggered by a specific moment, mood, or social context. Categories benefiting include premium camping gear (+34% YoY), board game cafes (+22% new outlet growth), and wellness spa (+19%).",
    body:`A new research report from 36Kr Future Commerce, based on analysis of 80 million transaction records across WeChat Pay and Alipay, has identified what it calls 'situational consumption' (场景消费) as the most consequential shift in young Chinese spending behaviour in 2026.

The concept describes a fundamental change in the purchase trigger: rather than a product need or a brand preference driving a transaction, it is the moment, mood, or social situation that comes first — and the product follows.

The practical implications for retailers are significant. A consumer doesn't decide they want a premium thermos flask and then go buy one. They decide they want to go camping with friends this weekend, and everything associated with that experience — including the flask, the tent, the outfit, the snack pack — gets purchased as part of a single situational bundle.

Across the categories 36Kr tracked, the numbers reflect this shift clearly. Premium camping and outdoor equipment grew 34% year-on-year. Board game cafe outlet openings were up 22%, with average spend per session rising 18%. Spa and wellness day visits grew 19%, with weekday bookings — suggesting mood-driven rather than schedule-driven visits — up disproportionately at 31%.

The report's authors note that social media, particularly Xiaohongshu (RED), is the primary engine of situational desire creation. A viral post of a "perfect Sunday morning setup" drives more conversion than a product-specific advertisement.

For brands, the implication is a fundamental rethink of channel strategy. The purchase journey increasingly begins with a lifestyle aspiration on a content platform, not on a shopping platform. Brands that only optimise for Taobao search are missing the first chapter of the consumer decision process.`,
    matters:"Stop thinking in SKUs. Think in situations. If your brand cannot place itself naturally inside a desirable moment or lifestyle context on Xiaohongshu, you are invisible to the generation that will define Chinese consumption for the next decade.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://36kr.com",
  },
  {
    id:4, slot:4, category:"retail", tag:"MARKET DATA", isLead:false,
    source:"winshang", date:"22 Mar 2026", time:"10:45", readTime:"5 min",
    headline:"China Premium Mall Traffic Surpasses 2019 Benchmark for First Time",
    summary:"Winshang's March 2026 mall traffic index reached 108.3 against a 2019 baseline of 100, the first sustained above-baseline reading since the pandemic. The recovery is concentrated in Shanghai's Jing'an and Beijing's Sanlitun districts. Landlords who invested heavily in F&B and entertainment upgrades between 2022 and 2024 are now seeing measurable returns, with average dwell time rising to 97 minutes per visit.",
    body:`China's premium mall sector has crossed a significant threshold. Winshang's monthly traffic index for Tier-1 city premium shopping centres reached 108.3 in March 2026, using 2019 as a baseline of 100. It marks the first sustained above-baseline reading since before the pandemic disrupted shopping patterns from 2020 onwards.

The recovery is geographically concentrated. Shanghai's Jing'an district — home to IAPM, Plaza 66, and Jing'an Kerry Centre — is running at 114.2, while Beijing's Sanlitun area, anchored by Taikoo Li and THE BOX, is at 111.8. By contrast, Tier-2 city premium malls remain at 96.4, suggesting the recovery remains a Tier-1 phenomenon for now.

The landlords who are outperforming share a common strategic thread: all of them significantly restructured their tenant mix between 2022 and 2024, reducing dependence on fashion retail and increasing allocations to food and beverage, beauty experiences, and entertainment concepts.

Data from Winshang shows that malls with F&B ratios above 35% of gross leasable area are delivering traffic indices of 112+ on average. Those below 25% are averaging 94.

Average dwell time — the most watched indicator for mall operators — has risen to 97 minutes per visit, up from 79 minutes in 2023. The operators Winshang surveyed attribute this almost entirely to food, entertainment, and beauty services, which together now account for 68% of total visit time on average.

Luxury anchor tenants including LVMH group and Richemont have both flagged the improvement in recent earnings calls, with LVMH's Asia Pacific president noting that "the Chinese consumer is returning to the physical luxury experience with intent."`,
    matters:"The mall recovery is real but selective. Operators who made the difficult tenant mix decisions during the downturn are now benefiting disproportionately. Brands still anchored in legacy department store formats face a structural disadvantage that traffic data will continue to expose.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://www.winshang.com",
  },
  {
    id:5, slot:5, category:"retail", tag:"LUXURY RESEARCH", isLead:false,
    source:"yaoke", date:"22 Mar 2026", time:"11:20", readTime:"6 min",
    headline:"China's Wealthiest Consumers Are Quietly Abandoning Logo Luxury for Private Experience",
    summary:"Yaoke Research Institute's Q1 2026 study of 3,200 Chinese consumers with net assets above ¥10 million reveals a decisive and accelerating shift away from visible luxury goods toward what researchers term 'invisible luxury' — private club memberships, bespoke wellness retreats, and invitation-only experiences. Hard luxury goods spending declined 8% in the cohort while experiential categories rose 23%.",
    body:`The wealthiest tier of Chinese consumers is undergoing a quiet but consequential transformation in how they spend on luxury, according to a new study from Yaoke Research Institute, one of China's leading high-net-worth consumer research organisations.

The Q1 2026 study, which surveyed 3,200 individuals with documented net assets above ¥10 million (approximately $1.38 million), found that spending on what the researchers classify as "visible luxury" — logo-bearing fashion, watches, and jewelry — declined 8% year-on-year among the cohort. Meanwhile, spending on "invisible luxury" categories rose 23%.

The researchers define invisible luxury as goods and services where the primary value is experiential, exclusive, or relationship-based, and where the status signal is understood only by those within the same social stratum — not by the general public.

Concrete examples from the data include private members' clubs (membership applications up 34% year-on-year), bespoke wellness and longevity programmes (spend up 41%), invitation-only cultural events and art patronage (up 29%), and customised private travel experiences with individual travel designers rather than agencies (up 38%).

When asked why they are shifting spending patterns, 67% of respondents cited "social visibility fatigue" — a sense that public displays of branded luxury have become associated with aspirational rather than established wealth. A further 42% mentioned the desire for experiences that "cannot be replicated or purchased by most people, regardless of income."

The implications for Swiss watchmakers, French fashion houses, and jewellery brands operating in China are significant. Several have already begun responding: Patek Philippe, Vacheron Constantin, and Cartier are all reported to have expanded their private client event programmes in China over the past 12 months.`,
    matters:"If your China luxury strategy is built around retail sell-through and visible logo products, you are measuring the wrong thing. The most valuable Chinese luxury consumers have moved off the shop floor and into private channels. Relationship infrastructure and invitation-only touchpoints are now the competitive moat.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://www.yaoke.com",
  },
  {
    id:6, slot:6, category:"consumer", tag:"ANALYSIS", isLead:false,
    source:"36kr", date:"22 Mar 2026", time:"12:00", readTime:"7 min",
    headline:"Guochao 3.0: Chinese Gen Z Now Demands Performance, Not Just Patriotism",
    summary:"DT Business and 36Kr's joint analysis of three years of social sentiment data across Xiaohongshu, Weibo, and Douyin maps the evolution of the guochao trend into its third and most commercially significant phase. Brands like Anta, Mao Geping, and Chow Tai Fook sub-brands are now winning on measurable product innovation, not national pride packaging alone.",
    body:`The guochao — or 'national chic' — movement has entered a new phase that has significant implications for both domestic Chinese brands and the foreign multinationals competing against them.

A joint analysis by 36Kr and DT Business, drawing on three years of social sentiment data across Xiaohongshu, Weibo, and Douyin covering over 2.4 billion posts, identifies three distinct phases of the trend.

Phase 1 (2018-2020) was characterised by nostalgia and aesthetic nationalism: Li-Ning's "China Li-Ning" runway collection, domestic beauty brands packaging themselves in traditional cultural motifs, food brands reviving regional heritage. The trigger was nationalistic sentiment and a desire to differentiate from Western imports.

Phase 2 (2021-2023) added a layer of social identity. Buying guochao became a statement — it signalled belonging to a generation that was confident, globally aware, and deliberately choosing China. The purchase was performative. Brand quality was secondary to brand positioning.

Phase 3 (2024-present) is fundamentally different. The researchers call it the "credibility threshold." Gen Z consumers now expect domestic brands to compete on objective product performance, clinical efficacy, or technical innovation — not on cultural resonance alone. Patriotism is a necessary but no longer sufficient condition for purchase.

The data bears this out. Anta's sales growth accelerated after it published independent biomechanical testing data for its running shoes. Mao Geping's premium cosmetics line grew 67% year-on-year after launching clinical efficacy studies comparable to international brands. Chow Tai Fook's sub-brand HEARTS ON FIRE gained share after investing in internationally certified diamond grading transparency.

For foreign brands, the implication is stark: the window during which guochao was a soft-sentiment headwind is closing. The new competition is on product terms.`,
    matters:"Foreign brands can no longer take comfort in quality perception premiums that are now being systematically eroded by Chinese competitors investing in verifiable performance. The competitive landscape in China is shifting from brand equity to product proof.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://36kr.com",
  },
  {
    id:7, slot:7, category:"travel", tag:"TRAVEL NEWS", isLead:false,
    source:"traveldaily", date:"22 Mar 2026", time:"13:15", readTime:"4 min",
    headline:"China Adds 12 Visa-Free Destinations — Q2 Outbound Tourism Set for Record",
    summary:"China's National Immigration Administration has confirmed visa-free or visa-on-arrival access for Chinese passport holders to 12 additional countries effective immediately, including Serbia, Kenya, Georgia, and five Pacific island nations. Forward booking data from TravelDaily CN shows April-June 2026 outbound volumes up 38% versus the same period last year. Average trip budgets have risen 14% year-on-year.",
    body:`China's outbound travel sector is heading into its strongest quarter since 2019, supported by a new wave of visa liberalisation that significantly expands the accessible destinations for Chinese passport holders.

The National Immigration Administration confirmed visa-free or visa-on-arrival access to 12 new countries: Serbia, Kenya, Georgia, Trinidad and Tobago, Samoa, Fiji, Vanuatu, Tonga, Papua New Guinea, the Solomon Islands, Kiribati, and Nauru. The additions bring the total number of countries offering visa-free or visa-on-arrival access to Chinese citizens to 87, up from 43 in 2019.

The practical travel impact of these specific additions is modest — none are high-volume leisure destinations. However, the diplomatic signalling is significant: Beijing is actively using visa liberalisation as a foreign policy instrument to deepen relationships across Africa, Eastern Europe, and the Pacific.

Where the volume impact is real and measurable is in forward bookings. TravelDaily CN's data, aggregated from nine major OTAs including Trip.com, Fliggy, and Meituan Travel, shows April-June 2026 outbound bookings running 38% ahead of the same period in 2025. Japan, Thailand, and Singapore remain the top three short-haul destinations. For long-haul, France, Italy, and the United Kingdom lead.

The average outbound trip budget has risen 14% year-on-year, driven by a stronger RMB and pent-up demand for premium travel experiences. Luxury hotel bookings for outbound trips are up 52%, significantly outpacing economy and midscale.

Airlines are responding: Air China, China Eastern, and China Southern have collectively added 847 new international routes for the summer schedule.`,
    matters:"Hospitality, duty-free retail, and luxury operators in key destination markets should prepare for accelerating volumes through H1 2026, particularly at the premium end. The Chinese traveller returning to international markets in 2026 is spending more per trip than in 2019.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://www.traveldaily.cn",
  },
  {
    id:8, slot:8, category:"consumer", tag:"BRAND ANALYSIS", isLead:false,
    source:"concall", date:"22 Mar 2026", time:"14:00", readTime:"6 min",
    headline:"Lululemon's China Crisis Exposes the 8-Hour Rule of Brand Trust",
    summary:"ConCall's brand tracking panel of 15,000 Chinese consumers documents an 11-point drop in Lululemon's brand intimacy score following a product quality controversy on Xiaohongshu. A 5-day corporate response time was the primary driver. Alo Yoga, which responded with a founder video within 8 hours of a similar issue, saw its score rise 7 points in the same period.",
    body:`A product quality controversy that began with a single Xiaohongshu post in late February has delivered a measurable and quantified blow to Lululemon's brand standing in China, according to new data from ConCall's proprietary brand tracking panel.

The incident began when an influential fitness creator with 2.3 million followers posted a video showing stitching defects on a pair of Lululemon leggings purchased at the Shanghai IAPM store. Within 72 hours, the post had accumulated 340,000 likes and spawned a secondary wave of user-generated complaint content.

Lululemon's official Weibo account issued a response on day five — a formal, legalistic statement that offered a returns procedure and a customer service hotline number.

ConCall's panel, which surveys 15,000 Chinese consumers weekly on a standardised "brand intimacy" metric covering trust, aspiration, and community belonging, recorded an 11-point decline in Lululemon's score over the two-week period following the initial post. The score has since partially recovered but remains 6 points below its pre-incident baseline.

The response time was the critical variable. ConCall's analysis of 43 brand crises on Chinese social media over the past three years consistently shows that responses delivered within 8 hours generate a net neutral or positive brand outcome in 71% of cases. Responses delivered after 48 hours generate a net negative outcome in 83% of cases.

The Alo Yoga comparison is instructive. When a similar quality complaint surfaced two weeks later, Alo Yoga's co-founder posted a personal video response on Douyin within 6 hours — in imperfect but genuine Mandarin — acknowledging the issue and offering a direct replacement programme. ConCall recorded a 7-point increase in Alo's brand intimacy score over the same two-week measurement window.

The contrast was widely discussed in Chinese marketing circles, generating its own significant media coverage.`,
    matters:"8 hours. That is the response window that separates brand recovery from brand damage on Chinese social media. This requires pre-authorised crisis protocols and empowered China-based communications teams — not escalation to Western headquarters.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://www.concall.cn",
  },
  {
    id:9, slot:9, category:"tech", tag:"RESEARCH REPORT", isLead:false,
    source:"alibaba", date:"22 Mar 2026", time:"15:00", readTime:"8 min",
    headline:"AI Commerce Will Control 35% of China's Retail GMV by 2028, Alibaba Research Projects",
    summary:"Alibaba Research Institute's annual New Commerce white paper projects that AI-native shopping interfaces will account for 35% of China's total retail GMV by 2028, rising sharply from an estimated 8% in 2025. The dominant architectures are Douyin's shopping graph and Alibaba's Quanzhantui AI ad system. Traditional search-based advertising is projected to decline from 62% to 38% of retail media spend over the same period.",
    body:`Artificial intelligence is reshaping the fundamental architecture of Chinese retail at a pace that is likely to catch many brands and platform operators underprepared, according to Alibaba Research Institute's annual New Commerce white paper, published this week.

The central projection: AI-native shopping interfaces — platforms and experiences where product discovery is primarily driven by large language models and multimodal AI rather than keyword search or algorithmic content feeds — will account for 35% of China's total retail GMV by 2028. The estimate for 2025 is approximately 8%, implying a more than fourfold increase in three years.

The report identifies two architectures as the likely dominant forces in this transition.

The first is Douyin's shopping graph — a system that uses the platform's vast behavioural dataset to model consumer intent at a granular level and surface product recommendations within content without requiring explicit search behaviour. The system has demonstrated a 340% higher conversion rate than traditional keyword advertising in controlled tests published by ByteDance's commerce division.

The second is Alibaba's Quanzhantui, an AI-powered advertising system that automates creative generation, audience targeting, and bid optimisation simultaneously. Merchants using Quanzhantui report average ROI improvements of 67% compared with manual campaign management.

The implication for traditional search advertising is significant. Alibaba Research projects that keyword-based search advertising will decline from its current 62% share of total retail media spend to approximately 38% by 2028 as AI recommendation channels absorb budget.

For brands, the strategic consequence is a fundamental shift in what "digital marketing infrastructure in China" means. Training AI models with rich product and brand data is becoming a core competency, not a technical detail.`,
    matters:"Brands planning China digital marketing budgets beyond 2026 must model a significant reallocation from search to AI-recommendation channels. The brands that invest in building proprietary AI training datasets now will have a compounding advantage over those who wait.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://www.aliresearch.com",
  },
  {
    id:10, slot:10, category:"retail", tag:"DEEP DIVE", isLead:false,
    source:"localretail", date:"22 Mar 2026", time:"16:30", readTime:"5 min",
    headline:"Community Commerce Grows Up: Group Buying Becomes China's Neighbourhood Economy",
    summary:"Local Retail Watch documents the second-generation evolution of community group buying in China's Tier-2 and Tier-3 cities. Meituan Youxuan and Duoduo Maicai have expanded far beyond groceries into appliances, beauty, and household services. Average household order frequency has risen to 4.2 purchases per month, and customer acquisition costs of ¥12 compare favourably to traditional e-commerce platforms at ¥68-120.",
    body:`Community group buying — the model that briefly threatened to transform Chinese grocery retail during the pandemic years — is quietly undergoing a second evolution that has significant implications for brands targeting lower-tier city consumers.

The first generation of community group buying (社区团购) that emerged from 2019 to 2022 was a grocery delivery model: neighbourhood group leaders aggregated orders, the platform fulfilled them, and the group leader earned a small commission. It was efficient, low-cost, and deeply embedded in the social fabric of residential communities.

What Local Retail Watch documents in its latest analysis is a second generation that has expanded the model's scope dramatically. Meituan Youxuan and Duoduo Maicai — the two dominant surviving operators after the consolidation of 2022-2023 — have systematically added new categories over the past 18 months.

Household appliances joined the platform in mid-2024. Beauty and personal care in Q3 2024. Pre-booked household services — cleaning, maintenance, tutoring — in Q1 2025. Fresh produce remains the anchor category, but it now accounts for less than 40% of platform GMV, down from over 80% at launch.

The operational data reflects the model's deepening roots. Average order frequency has risen to 4.2 purchases per household per month, up from 2.8 in 2023. Group leader retention — a proxy for community trust — stands at 78% at the 12-month mark, compared with 41% in the model's first generation.

Most striking for brands considering the channel is the customer acquisition cost differential. Meituan Youxuan's blended CAC across all categories is ¥12 per new customer. Comparable figures for Taobao (¥89) and JD.com (¥120) highlight the structural efficiency advantage of the trust-based community model.`,
    matters:"Lower-tier cities represent 65% of China's population and remain systematically underpenetrated by most international brands. The community commerce infrastructure being built now is the lowest-cost and highest-trust distribution channel available for reaching these consumers. Brands without a Tier-2/3 community commerce strategy are leaving a significant market unaddressed.",
    author:"ChinaPulse Editorial",
    originalUrl:"https://mp.weixin.qq.com",
  },
];

const EXEC = {
  bigPicture:"China's consumer recovery is broadening but bifurcating: premium experiential categories are accelerating while mass goods consumption remains uneven. Policy is shifting from crackdown to compliance management, and AI is beginning to structurally reshape retail media.",
  audiences:[
    { id:"investors", icon:"📈", label:"For Investors", sublabel:"VCs · Analysts · Fund Managers", color:"#1B5FA8", text:"February's retail beat (+4.2% YoY) supports upgrading full-year consumption estimates. Watch Trip.com and Meituan as outbound travel and community commerce volumes accelerate. AI commerce infrastructure plays — ByteDance commerce and Alibaba's AI ad systems — deserve attention ahead of the 2028 GMV shift projection." },
    { id:"brand", icon:"🏢", label:"For Brand Leaders", sublabel:"CMOs · China GMs · Regional VPs", color:"#C8102E", text:"Two urgent actions: (1) audit your crisis response protocol — the Lululemon data shows 5-day response times cause lasting damage, and (2) audit your AI readiness — brands without structured data feeding Douyin's shopping graph and Quanzhantui will systematically underperform from 2026 onwards." },
    { id:"watchers", icon:"🔍", label:"For China Watchers", sublabel:"Advisors · Consultants · Researchers", color:"#2E7D52", text:"The SAMR platform rules mark a transition from regulatory shock to regulatory normalisation — the enforcement architecture is now predictable enough to model. Pair this with the AI commerce white paper data for a comprehensive picture of where platform power is concentrating over the next 24 months." },
  ],
  stat:{ figure:"¥1.24T", context:"China retail sales Feb 2026 — +4.2% YoY, beats +3.6% consensus", source:"National Bureau of Statistics" },
  sentiment:"Cautiously Optimistic",
  sentimentPct:65,
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const catById  = id => CATS.find(c=>c.id===id)||CATS[0];
const srcById  = id => SOURCES[id]||{ zh:id, en:id, url:"#" };

// ─── LEGAL CONTENT ────────────────────────────────────────────────────────────
const LEGAL = {
  privacy:`
**Privacy Policy**
Last updated: 22 March 2026

ChinaPulse ("we", "us", "our") is operated by Giada Deng. This Privacy Policy explains how we collect, use, and protect your personal information when you use chinapulse.vercel.app (the "Site").

**Information We Collect**
We collect your email address when you subscribe to our daily digest. We may collect anonymised usage data (pages visited, time on site) via analytics tools.

**How We Use Your Information**
Your email address is used solely to send you the ChinaPulse daily or weekly digest, as selected at the time of subscription. We do not sell, rent, or share your personal information with third parties for marketing purposes.

**Email Communications**
You may unsubscribe at any time by clicking the unsubscribe link in any email we send, or by contacting us at giadadeng1203@gmail.com.

**Cookies**
We use essential cookies to ensure the Site functions correctly. See our Cookie Policy for details.

**Data Retention**
We retain your email address for as long as you remain subscribed. Upon unsubscription, your data is deleted within 30 days.

**Contact**
For any privacy-related queries, contact giadadeng1203@gmail.com.
  `,
  cookies:`
**Cookie Policy**
Last updated: 22 March 2026

ChinaPulse uses cookies and similar technologies to operate the Site and improve your experience.

**What Are Cookies?**
Cookies are small text files stored on your device when you visit a website. They help us understand how visitors use the Site and ensure it functions correctly.

**Cookies We Use**

*Essential Cookies*
These are required for the Site to function. They include session cookies that keep you logged in and preference cookies that remember your settings (such as selected category filter).

*Analytics Cookies*
We may use anonymised analytics tools to understand aggregate traffic patterns. No personally identifiable information is collected through analytics cookies.

**Third-Party Cookies**
We do not permit third-party advertising cookies on the Site. If you access original source articles via external links, those third-party sites operate under their own cookie policies.

**Managing Cookies**
You can disable cookies in your browser settings. Note that disabling essential cookies may affect Site functionality.

**Contact**
Questions about cookies? Email giadadeng1203@gmail.com.
  `,
  terms:`
**Terms of Use**
Last updated: 22 March 2026

By accessing chinapulse.vercel.app, you agree to the following terms.

**Content and Copyright**
All original editorial content on ChinaPulse — including summaries, translations, analysis, and "Why It Matters" commentary — is the intellectual property of ChinaPulse and may not be reproduced without written permission.

ChinaPulse summarises and translates content from third-party sources for editorial and informational purposes. We link to and credit all original sources. ChinaPulse does not claim ownership of third-party content.

**Not Investment Advice**
Nothing on ChinaPulse constitutes financial, investment, legal, or business advice. All content is provided for informational purposes only. Always conduct your own due diligence before making business or investment decisions.

**Accuracy**
We endeavour to ensure all content is accurate at time of publication. ChinaPulse is not liable for errors, omissions, or changes in information from original sources.

**External Links**
Links to third-party websites are provided for convenience. ChinaPulse is not responsible for the content or privacy practices of external sites.

**Changes to Terms**
We reserve the right to update these terms at any time. Continued use of the Site constitutes acceptance of the updated terms.

**Contact**
giadadeng1203@gmail.com
  `,
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Header({ onNav, activePage, search, setSearch, setShowSources, showSources }) {
  return (
    <header style={{ position:"sticky", top:0, zIndex:90, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(8px)", borderBottom:"2px solid #E2E0DB" }}>
      {/* ticker */}
      <div style={{ background:C.red, padding:"0.3rem 1.5rem", display:"flex", alignItems:"center", gap:"1.2rem" }}>
        <span style={{ fontSize:"11px", fontFamily:C.sans, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.85)", borderRight:"1px solid rgba(255,255,255,0.3)", paddingRight:"1.2rem", whiteSpace:"nowrap" }}>● LIVE</span>
        <div style={{ flex:1, overflow:"hidden", color:"#fff", fontSize:"12px", fontFamily:C.mono }}>
          Feb Retail Sales +4.2% YoY · SAMR Platform Rules April 1 · 12 New Visa-Free Destinations · Premium Mall Index Post-2019 High
        </div>
        <span style={{ fontSize:"11px", fontFamily:C.mono, color:"rgba(255,255,255,0.7)", whiteSpace:"nowrap" }}>22 MAR 2026</span>
      </div>
      {/* masthead */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.85rem 0 0.7rem" }}>
          <div onClick={()=>onNav("home")} style={{ cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"0.65rem" }}>
              <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, letterSpacing:"-0.02em", color:C.text, lineHeight:1 }}>
                China<span style={{ color:C.red }}>Pulse</span>
              </h1>
              <span style={{ fontSize:"13px", color:C.textMuted, fontFamily:C.serif, fontStyle:"italic" }}>中国脉搏</span>
            </div>
            <p style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:600, color:C.textMuted, letterSpacing:"0.09em", marginTop:"0.18rem", textTransform:"uppercase" }}>Daily Intelligence for Global China Watchers</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"0.55rem", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:C.textMuted, pointerEvents:"none" }}>⌕</span>
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", color:C.text, padding:"0.42rem 0.75rem 0.42rem 1.8rem", fontSize:"13px", fontFamily:C.sans, outline:"none", width:145 }} />
            </div>
            <button onClick={()=>setShowSources(!showSources)} style={{ background:showSources?C.red+"10":"#fff", border:`1px solid ${showSources?C.red:C.border}`, color:showSources?C.red:C.textSub, padding:"0.42rem 0.78rem", borderRadius:"2px", cursor:"pointer", fontSize:"11px", fontFamily:C.sans, fontWeight:600, letterSpacing:"0.05em" }}>Sources</button>
            <button onClick={()=>onNav("submit")} style={{ background:C.red, color:"white", border:"none", padding:"0.42rem 0.88rem", borderRadius:"2px", cursor:"pointer", fontSize:"11px", fontFamily:C.sans, fontWeight:700, letterSpacing:"0.05em" }}>+ Submit</button>
          </div>
        </div>
        {/* cat tabs — only on home */}
        {activePage==="home" && (
          <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
            {CATS.map(cat=>{
              const count=cat.id==="all"?ARTICLES.length:ARTICLES.filter(a=>a.category===cat.id).length;
              return (
                <button key={cat.id} onClick={()=>onNav("home",cat.id)}
                  style={{ background:"none", border:"none", borderBottom:`3px solid transparent`, color:C.textMuted, padding:"0.48rem 0.9rem", cursor:"pointer", fontSize:"12px", fontFamily:C.sans, fontWeight:400, letterSpacing:"0.04em", whiteSpace:"nowrap", textTransform:"uppercase", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                  {cat.label}
                  <span style={{ background:C.bgAlt, color:C.textMuted, borderRadius:"10px", padding:"0.03rem 0.38rem", fontSize:"10px" }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

function Footer({ onNav }) {
  return (
    <footer style={{ borderTop:`2px solid ${C.border}`, padding:"1.5rem", background:C.bgAlt, marginTop:"2rem" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1.5rem", marginBottom:"1.2rem" }}>
          <div>
            <div style={{ fontFamily:C.serif, fontSize:"16px", fontWeight:700, color:C.text, marginBottom:"0.25rem" }}>
              China<span style={{ color:C.red }}>Pulse</span>
              <span style={{ color:C.textMuted, fontSize:"13px", marginLeft:"0.45rem", fontStyle:"italic" }}>中国脉搏</span>
            </div>
            <p style={{ fontFamily:C.sans, fontSize:"11px", color:C.textMuted, lineHeight:1.65, maxWidth:280 }}>
              Daily China intelligence for global business leaders. Translated, summarised, and decoded every weekday.
            </p>
          </div>
          <div style={{ display:"flex", gap:"3rem", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Company</div>
              {["about","contact"].map(p=>(
                <div key={p} onClick={()=>onNav(p)} style={{ fontFamily:C.sans, fontSize:"12px", color:C.textSub, cursor:"pointer", marginBottom:"0.35rem", textTransform:"capitalize" }}>{p==="contact"?"Contact Us":p.charAt(0).toUpperCase()+p.slice(1)}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Legal</div>
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

// ─── PAGE: HOME ───────────────────────────────────────────────────────────────
function HomePage({ onNav, activeCat, search }) {
  const filtered = ARTICLES.filter(a=>{
    const matchCat = activeCat==="all" || a.category===activeCat;
    const q = search.toLowerCase();
    const matchSearch = !q || a.headline.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <main style={{ maxWidth:1200, margin:"0 auto", padding:"1.5rem 1.5rem", display:"grid", gridTemplateColumns:"1fr 285px", gap:"1.5rem", alignItems:"start" }}>
      {/* FEED */}
      <div>
        {/* date header */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"1.1rem" }}>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.25rem" }}>Today's Edition</div>
            <h2 style={{ fontFamily:C.serif, fontSize:"21px", fontWeight:700, color:C.text, letterSpacing:"-0.01em" }}>Sunday, March 22, 2026</h2>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:600, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Showing</div>
            <div style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.red, lineHeight:1 }}>{filtered.length}<span style={{ fontSize:"13px", color:C.textMuted }}>/10</span></div>
          </div>
        </div>

        {/* exec briefing — all tab only */}
        {activeCat==="all" && !search && (
          <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.red}`, borderRadius:"2px", marginBottom:"1.4rem", overflow:"hidden" }}>
            <div style={{ padding:"0.82rem 1.3rem", display:"flex", alignItems:"center", gap:"0.85rem", background:"#fff", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ background:C.red, color:"white", padding:"0.15rem 0.55rem", fontSize:"10px", fontFamily:C.sans, letterSpacing:"0.1em", fontWeight:700, borderRadius:"2px" }}>EXEC BRIEFING</span>
              <span style={{ fontFamily:C.sans, fontSize:"13px", color:C.textSub, fontWeight:600 }}>Key Implications — 22 Mar 2026</span>
            </div>
            <div style={{ padding:"1.1rem 1.3rem" }}>
              <p style={{ fontFamily:C.serif, fontSize:"14.5px", lineHeight:"1.75", color:C.text, margin:"0 0 1.1rem", paddingLeft:"1rem", borderLeft:`3px solid ${C.red}`, fontStyle:"italic" }}>{EXEC.bigPicture}</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.85rem", marginBottom:"1.1rem" }}>
                {EXEC.audiences.map(a=>(
                  <div key={a.id} style={{ background:"#fff", border:`1px solid ${C.border}`, borderTop:`3px solid ${a.color}`, borderRadius:"2px", padding:"0.9rem 1rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", marginBottom:"0.15rem" }}>
                      <span style={{ fontSize:"14px" }}>{a.icon}</span>
                      <span style={{ fontFamily:C.sans, fontSize:"10px", color:a.color, fontWeight:700, letterSpacing:"0.04em" }}>{a.label.toUpperCase()}</span>
                    </div>
                    <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginBottom:"0.5rem" }}>{a.sublabel}</div>
                    <p style={{ fontFamily:C.serif, fontSize:"13px", lineHeight:"1.7", color:C.textSub, margin:0 }}>{a.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem" }}>
                <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.9rem" }}>
                  <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.35rem" }}>NUMBER OF THE DAY</div>
                  <div style={{ fontFamily:C.serif, fontSize:"2rem", fontWeight:700, color:C.text, lineHeight:1.1, margin:"0.2rem 0 0.28rem" }}>{EXEC.stat.figure}</div>
                  <div style={{ fontFamily:C.serif, fontSize:"12.5px", color:C.textSub, lineHeight:1.6 }}>{EXEC.stat.context}</div>
                  <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.35rem" }}>SRC: {EXEC.stat.source.toUpperCase()}</div>
                </div>
                <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.9rem" }}>
                  <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.45rem" }}>MARKET SENTIMENT</div>
                  <div style={{ fontFamily:C.serif, fontSize:"1.2rem", fontWeight:700, color:"#2E7D52", marginBottom:"0.65rem" }}>{EXEC.sentiment}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.45rem" }}>
                    <span style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>BEAR</span>
                    <div style={{ flex:1, height:"4px", background:C.borderLight, borderRadius:2, position:"relative" }}>
                      <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${EXEC.sentimentPct}%`, background:"#2E7D52", borderRadius:2 }} />
                    </div>
                    <span style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>BULL</span>
                  </div>
                  <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.42rem" }}>BASED ON TODAY'S 10 ARTICLES</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* article list */}
        {filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"3rem 1rem", color:C.textMuted, fontFamily:C.serif, fontStyle:"italic", border:`1px dashed ${C.border}`, borderRadius:"3px", fontSize:"15px" }}>
            No articles in this category yet today.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
            {filtered.map((a,i)=>(
              <ArticleRow key={a.id} article={a} index={i} onClick={()=>onNav("article",null,a.id)} isLast={i===filtered.length-1} />
            ))}
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem", position:"sticky", top:118 }}>
        <SubscribeWidget />
        <CoverageWidget />
        <ArchiveWidget />
      </div>
    </main>
  );
}

// ─── ARTICLE ROW (main feed card — no expand, click goes to full page) ─────────
function ArticleRow({ article, index, onClick, isLast }) {
  const cat = catById(article.category);
  const src = srcById(article.source);
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{ padding:"1.1rem 1.3rem", borderLeft:`4px solid ${cat.color}`,
        borderBottom: isLast?"none":`1px solid ${C.border}`,
        background: hovered ? C.bgAlt2 : "#fff",
        cursor:"pointer", transition:"background 0.15s ease",
        animation:`fadeUp .4s ease ${index*0.05}s both` }}>

      {/* meta row */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.55rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
        <span style={{ background:cat.color+"15", color:cat.color, border:`1px solid ${cat.color}35`, padding:"0.1rem 0.42rem", borderRadius:"2px", fontSize:"10px", fontFamily:C.sans, letterSpacing:"0.07em", fontWeight:700 }}>{article.tag}</span>
        <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{cat.label.toUpperCase()}</span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.45rem" }}>
          <span style={{ fontSize:"12px", fontFamily:C.sans, fontWeight:600, color:C.textSub, background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.08rem 0.42rem" }}>{article.date}</span>
          <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{article.time} · {article.readTime}</span>
        </div>
      </div>

      {/* headline */}
      <h3 style={{ fontFamily:C.serif, fontSize:article.isLead?"19px":"16px", fontWeight:700, lineHeight:1.35, color: hovered ? C.red : C.text, margin:"0 0 0.55rem", letterSpacing:"-0.01em", transition:"color 0.15s" }}>
        {article.isLead && <span style={{ display:"inline-block", background:C.red, color:"white", fontSize:"10px", padding:"0.1rem 0.38rem", borderRadius:"1px", fontFamily:C.sans, letterSpacing:"0.1em", fontWeight:700, marginRight:"0.48rem", verticalAlign:"middle", position:"relative", top:"-2px" }}>LEAD</span>}
        {article.headline}
      </h3>

      {/* summary — 2 lines teaser */}
      <p style={{ fontFamily:C.serif, fontSize:"14px", lineHeight:"1.72", color:C.textSub, margin:"0 0 0.55rem", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
        {article.summary}
      </p>

      {/* footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:cat.color }} />
          <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.sans }}>{src.zh} · {src.en}</span>
        </div>
        <span style={{ fontSize:"11px", fontFamily:C.sans, fontWeight:600, color:hovered?C.red:C.textMuted, transition:"color 0.15s" }}>Read full article →</span>
      </div>
    </div>
  );
}

// ─── PAGE: FULL ARTICLE ───────────────────────────────────────────────────────
function ArticlePage({ articleId, onNav }) {
  const article = ARTICLES.find(a=>a.id===articleId);
  if (!article) return <div style={{ padding:"3rem", textAlign:"center", fontFamily:C.serif }}>Article not found.</div>;
  const cat = catById(article.category);
  const src = srcById(article.source);

  return (
    <main style={{ maxWidth:780, margin:"0 auto", padding:"2rem 1.5rem" }}>
      {/* back */}
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, letterSpacing:"0.04em", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>
        ← Back to Today's Edition
      </button>

      {/* category + tag */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.85rem", flexWrap:"wrap" }}>
        <span style={{ background:cat.color+"15", color:cat.color, border:`1px solid ${cat.color}35`, padding:"0.12rem 0.5rem", borderRadius:"2px", fontSize:"10px", fontFamily:C.sans, letterSpacing:"0.08em", fontWeight:700 }}>{article.tag}</span>
        <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{cat.label.toUpperCase()}</span>
      </div>

      {/* headline */}
      <h1 style={{ fontFamily:C.serif, fontSize:"28px", fontWeight:700, lineHeight:1.28, color:C.text, margin:"0 0 1rem", letterSpacing:"-0.02em" }}>
        {article.headline}
      </h1>

      {/* byline */}
      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem", paddingBottom:"1.1rem", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.42rem" }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"11px", fontFamily:C.sans, fontWeight:700 }}>CP</div>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"12px", fontWeight:700, color:C.text }}>{article.author}</div>
            <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>ChinaPulse · {article.date} · {article.readTime} read</div>
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.45rem" }}>
          <span style={{ fontSize:"12px", fontFamily:C.sans, fontWeight:600, color:C.textSub, background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.1rem 0.5rem" }}>{article.date}</span>
          <span style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono }}>{article.time}</span>
        </div>
      </div>

      {/* summary box */}
      <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderLeft:`4px solid ${cat.color}`, borderRadius:"2px", padding:"1rem 1.2rem", marginBottom:"1.5rem" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:cat.color, letterSpacing:"0.1em", marginBottom:"0.4rem", textTransform:"uppercase" }}>Summary</div>
        <p style={{ fontFamily:C.serif, fontSize:"15px", lineHeight:"1.75", color:C.textSub, margin:0, fontStyle:"italic" }}>{article.summary}</p>
      </div>

      {/* body */}
      <div style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.text }}>
        {article.body.trim().split("\n\n").map((para,i)=>(
          <p key={i} style={{ margin:"0 0 1.2rem" }}>{para}</p>
        ))}
      </div>

      {/* why it matters */}
      <div style={{ background:cat.color+"0D", border:`1px solid ${cat.color}30`, borderRadius:"2px", padding:"1.1rem 1.3rem", margin:"1.8rem 0" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:cat.color, letterSpacing:"0.1em", marginBottom:"0.4rem", textTransform:"uppercase" }}>Why It Matters</div>
        <p style={{ fontFamily:C.serif, fontSize:"15px", lineHeight:"1.75", color:C.textSub, margin:0 }}>{article.matters}</p>
      </div>

      {/* source credit */}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"1.2rem", marginTop:"1rem" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.55rem", textTransform:"uppercase" }}>Original Source</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.8rem" }}>
          <div>
            <div style={{ fontFamily:C.sans, fontSize:"13px", fontWeight:700, color:C.text }}>{src.en}</div>
            <div style={{ fontFamily:C.mono, fontSize:"11px", color:C.textMuted, marginTop:"0.15rem" }}>{src.zh}</div>
          </div>
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:C.red, color:"white", padding:"0.52rem 1.1rem", borderRadius:"2px", fontSize:"12px", fontFamily:C.sans, fontWeight:700, letterSpacing:"0.05em", textDecoration:"none" }}>
            Read Original Article →
          </a>
        </div>
        <p style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.85rem", lineHeight:1.65 }}>
          This article is an original summary and analysis by ChinaPulse, based on reporting from {src.en}. All intellectual property in the original article belongs to {src.en}. ChinaPulse links to and credits all sources. Not investment advice.
        </p>
      </div>

      {/* related articles */}
      <div style={{ marginTop:"2rem", paddingTop:"1.5rem", borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:C.sans, fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.9rem", textTransform:"uppercase" }}>More from Today's Edition</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          {ARTICLES.filter(a=>a.id!==article.id).slice(0,3).map(a=>(
            <div key={a.id} onClick={()=>onNav("article",null,a.id)}
              style={{ display:"flex", gap:"0.8rem", padding:"0.75rem", background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", cursor:"pointer" }}>
              <div style={{ width:3, background:catById(a.category).color, borderRadius:2, flexShrink:0 }} />
              <div>
                <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginBottom:"0.22rem" }}>{catById(a.category).label.toUpperCase()} · {a.date}</div>
                <div style={{ fontFamily:C.serif, fontSize:"13.5px", fontWeight:700, color:C.text, lineHeight:1.35 }}>{a.headline}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── PAGE: LEGAL (privacy / cookies / terms) ─────────────────────────────────
function LegalPage({ page, onNav }) {
  const content = LEGAL[page] || "";
  const titles = { privacy:"Privacy Policy", cookies:"Cookie Policy", terms:"Terms of Use" };

  return (
    <main style={{ maxWidth:720, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back</button>
      <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.text, margin:"0 0 0.4rem", letterSpacing:"-0.01em" }}>{titles[page]}</h1>
      <div style={{ fontFamily:C.mono, fontSize:"11px", color:C.textMuted, marginBottom:"2rem" }}>Last updated: 22 March 2026</div>
      <div style={{ fontFamily:C.serif, fontSize:"15.5px", lineHeight:"1.82", color:C.textSub }}>
        {content.trim().split("\n\n").map((block,i)=>{
          if (block.startsWith("**") && block.endsWith("**")) {
            return <h2 key={i} style={{ fontFamily:C.serif, fontSize:"18px", fontWeight:700, color:C.text, margin:"1.8rem 0 0.6rem", letterSpacing:"-0.01em" }}>{block.replace(/\*\*/g,"")}</h2>;
          }
          if (block.startsWith("*") && block.endsWith("*")) {
            return <h3 key={i} style={{ fontFamily:C.sans, fontSize:"13px", fontWeight:700, color:C.text, margin:"1.2rem 0 0.4rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>{block.replace(/\*/g,"")}</h3>;
          }
          const parts = block.split(/(\*\*[^*]+\*\*)/g);
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
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back</button>
      <h1 style={{ fontFamily:C.serif, fontSize:"26px", fontWeight:700, color:C.text, margin:"0 0 1.5rem", letterSpacing:"-0.01em" }}>About ChinaPulse</h1>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>
        ChinaPulse is a daily China intelligence platform designed for global business leaders who need to understand what is happening in China — without reading Chinese.
      </p>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>
        Every weekday, we curate 10 articles from the best Chinese and international sources — including WeChat accounts like 虎嗅, 36氪, 赢商网, and 华丽志, alongside international titles like Jing Daily, Luxe.co, Pandaily, and Caixin — translate them into English, and add original business analysis to explain what each story means for investors, brand leaders, and China watchers.
      </p>
      <p style={{ fontFamily:C.serif, fontSize:"16px", lineHeight:"1.82", color:C.textSub, marginBottom:"1.2rem" }}>
        Our audience includes CMOs, commercial VPs, fund managers, and strategy advisors at global companies with exposure to the Chinese market.
      </p>
      <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderLeft:`4px solid ${C.red}`, borderRadius:"2px", padding:"1rem 1.2rem", marginTop:"1.5rem" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.4rem" }}>CONTACT</div>
        <p style={{ fontFamily:C.serif, fontSize:"14px", color:C.textSub, margin:0 }}>For editorial enquiries, partnership proposals, or feedback: <a href="mailto:giadadeng1203@gmail.com" style={{ color:C.red }}>giadadeng1203@gmail.com</a></p>
      </div>
    </main>
  );
}

// ─── PAGE: CONTACT ────────────────────────────────────────────────────────────
function ContactPage({ onNav }) {
  const [form, setForm] = useState({ name:"", email:"", subject:"", message:"" });
  const [sent, setSent] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const iStyle = { width:"100%", background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", color:C.text, padding:"0.65rem 0.9rem", fontSize:"14px", fontFamily:C.serif, outline:"none", display:"block", marginBottom:"0.9rem" };
  const lStyle = { fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", display:"block", marginBottom:"0.35rem", textTransform:"uppercase" };

  if (sent) return (
    <main style={{ maxWidth:600, margin:"0 auto", padding:"3rem 1.5rem", textAlign:"center" }}>
      <div style={{ fontSize:"2rem", marginBottom:"0.8rem" }}>✓</div>
      <h2 style={{ fontFamily:C.serif, fontSize:"22px", fontWeight:700, color:C.text, marginBottom:"0.5rem" }}>Message sent!</h2>
      <p style={{ fontFamily:C.serif, fontSize:"15px", color:C.textSub, marginBottom:"1.5rem" }}>We'll get back to you at giadadeng1203@gmail.com within 48 hours.</p>
      <button onClick={()=>onNav("home")} style={{ background:C.red, color:"white", border:"none", padding:"0.65rem 1.4rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:700 }}>Back to Home</button>
    </main>
  );

  return (
    <main style={{ maxWidth:600, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back</button>
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
        <span style={{ fontFamily:C.mono, fontSize:"11px", color:C.textMuted }}>Replies to: giadadeng1203@gmail.com</span>
        <button onClick={()=>{ if(form.email&&form.message) setSent(true); }} style={{ background:C.red, color:"white", border:"none", padding:"0.65rem 1.4rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:700, letterSpacing:"0.05em" }}>Send Message →</button>
      </div>
    </main>
  );
}

// ─── PAGE: SUBMIT (editor) ────────────────────────────────────────────────────
function SubmitPage({ onNav }) {
  const [step,setStep] = useState(0);
  const [form,setForm] = useState({ sourceKey:"", url:"", category:"", tag:"", slot:"", isLead:false, headline:"", summary:"", body:"", matters:"" });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const steps=["Source","Category","Content","Preview"];
  const cat=catById(form.category);
  const iStyle={ width:"100%", background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", color:C.text, padding:"0.6rem 0.85rem", fontSize:"14px", fontFamily:C.serif, outline:"none", display:"block" };
  const lStyle={ fontSize:"10px", fontFamily:C.sans, fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.35rem", display:"block", textTransform:"uppercase" };

  return (
    <main style={{ maxWidth:680, margin:"0 auto", padding:"2rem 1.5rem" }}>
      <button onClick={()=>onNav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600, color:C.textMuted, marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.38rem", padding:0 }}>← Back to feed</button>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.3rem" }}>EDITOR DASHBOARD</div>
      <h1 style={{ fontFamily:C.serif, fontSize:"22px", fontWeight:700, color:C.text, margin:"0 0 1.5rem" }}>Submit Today's Article</h1>

      {/* progress */}
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.6rem" }}>
        {steps.map((s,i)=>(
          <div key={s} style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:3, background:i<=step?C.red:C.borderLight, borderRadius:2, marginBottom:"0.3rem", transition:"background .3s" }} />
            <span style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:600, color:i<=step?C.red:C.textMuted, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s}</span>
          </div>
        ))}
      </div>

      {step===0&&(
        <div>
          <div style={lStyle}>Select Source</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem", marginBottom:"1rem" }}>
            {Object.entries(SOURCES).map(([k,s])=>(
              <button key={k} onClick={()=>set("sourceKey",k)} style={{ background:form.sourceKey===k?C.red+"10":"#fff", border:`1px solid ${form.sourceKey===k?C.red+"60":C.border}`, borderRadius:"2px", padding:"0.5rem 0.7rem", textAlign:"left", cursor:"pointer" }}>
                <div style={{ fontSize:"12px", fontFamily:C.sans, fontWeight:600, color:form.sourceKey===k?C.red:C.textSub }}>{s.en}</div>
                <div style={{ fontSize:"11px", color:C.textMuted, fontFamily:C.mono, marginTop:"0.1rem" }}>{s.zh}</div>
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
              <button key={c.id} onClick={()=>set("category",c.id)} style={{ background:form.category===c.id?c.color+"12":"#fff", border:`1px solid ${form.category===c.id?c.color+"60":C.border}`, borderRadius:"2px", padding:"0.62rem 0.78rem", cursor:"pointer", textAlign:"left", color:form.category===c.id?C.text:C.textSub, fontSize:"13px", fontFamily:C.serif }}>
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
          <textarea style={{ ...iStyle, height:80, resize:"vertical", lineHeight:1.7, marginBottom:"0.9rem" }} placeholder="2-3 sentence teaser for the main feed..." value={form.summary} onChange={e=>set("summary",e.target.value)} />
          <div style={lStyle}>Full Article Body (shown on article page) *</div>
          <textarea style={{ ...iStyle, height:200, resize:"vertical", lineHeight:1.7, marginBottom:"0.9rem" }} placeholder="Full translated and summarised article (300-500 words)..." value={form.body} onChange={e=>set("body",e.target.value)} />
          <div style={lStyle}>Why It Matters *</div>
          <textarea style={{ ...iStyle, height:80, resize:"vertical", lineHeight:1.7 }} placeholder="2-3 sentences for business readers..." value={form.matters} onChange={e=>set("matters",e.target.value)} />
        </div>
      )}
      {step===3&&(
        <div>
          <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderLeft:`4px solid ${cat.color}`, borderRadius:"2px", padding:"1rem", marginBottom:"0.9rem" }}>
            <div style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:700, color:cat.color, marginBottom:"0.4rem", textTransform:"uppercase" }}>{form.tag} · {cat.label} · SLOT {form.slot}</div>
            <h3 style={{ fontFamily:C.serif, fontSize:"17px", fontWeight:700, color:C.text, margin:"0 0 0.5rem" }}>{form.headline||"Your headline here"}</h3>
            <p style={{ fontFamily:C.serif, fontSize:"13.5px", color:C.textSub, lineHeight:1.7, margin:"0 0 0.7rem" }}>{form.summary||"Your summary here..."}</p>
            {form.matters&&<div style={{ background:cat.color+"0D", border:`1px solid ${cat.color}30`, borderRadius:"2px", padding:"0.65rem 0.85rem" }}><div style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:700, color:cat.color, marginBottom:"0.25rem" }}>WHY IT MATTERS</div><p style={{ fontFamily:C.serif, fontSize:"13px", color:C.textSub, margin:0, lineHeight:1.7 }}>{form.matters}</p></div>}
            <div style={{ marginTop:"0.7rem", fontSize:"11px", fontFamily:C.mono, color:C.textMuted }}>SRC: {SOURCES[form.sourceKey]?.zh} · {form.url||"URL not set"}</div>
          </div>
          <div style={{ background:"#F0FAF4", border:"1px solid #A8D5B8", borderRadius:"2px", padding:"0.8rem 1rem", fontSize:"13px", color:"#2E7D52", fontFamily:C.serif, lineHeight:1.6 }}>
            ✓ Ready to publish. In production, this pushes to Airtable CMS, syncs live to the feed, and queues the email digest.
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"1.4rem", paddingTop:"1rem", borderTop:`1px solid ${C.border}` }}>
        <button onClick={()=>step>0?setStep(step-1):onNav("home")} style={{ background:"#fff", border:`1px solid ${C.border}`, color:C.textSub, padding:"0.56rem 1.05rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:600 }}>{step===0?"Cancel":"← Back"}</button>
        <button onClick={()=>step<3?setStep(step+1):onNav("home")} style={{ background:step===3?"#2E7D52":C.red, color:"white", border:"none", padding:"0.56rem 1.35rem", borderRadius:"2px", cursor:"pointer", fontFamily:C.sans, fontSize:"12px", fontWeight:700, letterSpacing:"0.05em" }}>{step===3?"✓ Publish":"Next →"}</button>
      </div>
    </main>
  );
}

// ─── SIDEBAR WIDGETS ──────────────────────────────────────────────────────────
function SubscribeWidget() {
  const [email,setEmail]=useState("");
  const [freq,setFreq]=useState("daily");
  const [done,setDone]=useState(false);
  const submit=()=>{ if(email.includes("@")) setDone(true); };
  if(done) return (
    <div style={{ background:"#F0FAF4", border:"1px solid #A8D5B8", borderRadius:"2px", padding:"1.2rem", textAlign:"center" }}>
      <div style={{ fontSize:"1.4rem", marginBottom:"0.35rem" }}>✓</div>
      <div style={{ fontFamily:C.serif, fontSize:"14px", color:C.text, fontWeight:700, marginBottom:"0.25rem" }}>You're subscribed!</div>
      <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted }}>First email tomorrow at 7 AM HKT</div>
    </div>
  );
  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.red}`, borderRadius:"2px", padding:"1.15rem" }}>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.42rem", textTransform:"uppercase" }}>Daily Digest</div>
      <h3 style={{ fontFamily:C.serif, fontSize:"14px", fontWeight:700, color:C.text, margin:"0 0 0.3rem" }}>Top 10 China stories in your inbox</h3>
      <p style={{ fontFamily:C.serif, fontSize:"12.5px", color:C.textSub, lineHeight:1.6, margin:"0 0 0.8rem" }}>Translated & decoded — every weekday 7 AM HKT.</p>
      <div style={{ display:"flex", gap:"0.38rem", marginBottom:"0.62rem" }}>
        {["daily","weekly"].map(f=>(
          <button key={f} onClick={()=>setFreq(f)} style={{ background:freq===f?C.red:"#fff", border:`1px solid ${freq===f?C.red:C.border}`, color:freq===f?"#fff":C.textSub, padding:"0.25rem 0.7rem", borderRadius:"2px", fontSize:"10px", fontFamily:C.sans, fontWeight:600, letterSpacing:"0.06em", cursor:"pointer", textTransform:"uppercase" }}>{f}</button>
        ))}
      </div>
      <div style={{ display:"flex" }}>
        <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{ flex:1, background:"#fff", border:`1px solid ${C.border}`, borderRight:"none", borderRadius:"2px 0 0 2px", color:C.text, padding:"0.55rem 0.8rem", fontSize:"13px", fontFamily:C.serif, outline:"none" }} />
        <button onClick={submit} style={{ background:C.red, color:"white", border:"none", padding:"0.55rem 0.88rem", borderRadius:"0 2px 2px 0", fontSize:"10px", fontFamily:C.sans, fontWeight:700, letterSpacing:"0.07em", cursor:"pointer", whiteSpace:"nowrap" }}>JOIN →</button>
      </div>
      <div style={{ fontFamily:C.mono, fontSize:"10px", color:C.textMuted, marginTop:"0.4rem" }}>No spam. Unsubscribe anytime.</div>
    </div>
  );
}

function CoverageWidget() {
  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"1.05rem" }}>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", marginBottom:"0.75rem", textTransform:"uppercase" }}>Today's Coverage</div>
      {CATS.filter(c=>c.id!=="all").map(cat=>{
        const n=ARTICLES.filter(a=>a.category===cat.id).length;
        return (
          <div key={cat.id} style={{ marginBottom:"0.58rem" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.2rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.36rem" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:n>0?cat.color:C.border }} />
                <span style={{ fontSize:"12px", fontFamily:C.sans, color:n>0?C.textSub:C.textMuted }}>{cat.label}</span>
              </div>
              <span style={{ fontSize:"10px", fontFamily:C.mono, color:n>0?cat.color:C.textMuted }}>{n}/2</span>
            </div>
            <div style={{ height:2, background:C.borderLight, borderRadius:2 }}>
              <div style={{ height:"100%", width:`${Math.min(n/2,1)*100}%`, background:cat.color, borderRadius:2, opacity:n>0?1:0 }} />
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:"0.6rem", paddingTop:"0.58rem", borderTop:`1px solid ${C.border}`, fontSize:"10px", fontFamily:C.mono, color:C.textMuted }}>{ARTICLES.length}/10 slots filled today</div>
    </div>
  );
}

function ArchiveWidget() {
  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:"2px", padding:"1.05rem" }}>
      <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem" }}>Recent Editions</div>
      {["21 Mar","20 Mar","19 Mar","18 Mar","17 Mar"].map((d,i,arr)=>(
        <div key={d} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.38rem 0", borderBottom:i<arr.length-1?`1px solid ${C.borderLight}`:"none", cursor:"pointer" }}>
          <span style={{ fontSize:"12.5px", fontFamily:C.serif, color:C.textSub }}>{d} 2026</span>
          <span style={{ fontSize:"10px", fontFamily:C.sans, fontWeight:600, color:C.red }}>10 →</span>
        </div>
      ))}
    </div>
  );
}

// ─── SOURCES DRAWER ───────────────────────────────────────────────────────────
function SourcesDrawer() {
  return (
    <div style={{ background:C.bgAlt, borderBottom:`1px solid ${C.border}`, padding:"0.9rem 1.5rem", animation:"fadeUp .2s ease" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ fontFamily:C.sans, fontSize:"10px", fontWeight:700, color:C.red, letterSpacing:"0.1em", marginBottom:"0.65rem", textTransform:"uppercase" }}>
          Monitored Sources — {Object.keys(SOURCES).length} Feeds
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.38rem" }}>
          {Object.entries(SOURCES).map(([k,s])=>(
            <a key={k} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"2px", padding:"0.28rem 0.62rem", fontSize:"11px", fontFamily:C.sans, textDecoration:"none", display:"inline-flex", gap:"0.38rem", alignItems:"center" }}>
              <span style={{ color:C.text, fontWeight:600 }}>{s.en}</span>
              <span style={{ color:C.textMuted, fontFamily:C.mono, fontSize:"10px" }}>{s.zh}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROUTER / APP ─────────────────────────────────────────────────────────────
export default function ChinaPulse() {
  const [page,    setPage]    = useState("home");
  const [activeCat, setActiveCat] = useState("all");
  const [articleId, setArticleId] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [search, setSearch] = useState("");

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
        body{background:#fff;color:#1a1a1a;-webkit-font-smoothing:antialiased;}
        input,textarea,button{font-family:inherit;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px;}
        button:hover{opacity:0.85;}
        a:hover{opacity:0.8;}
      `}</style>

      <Header
        onNav={navigate}
        activePage={page}
        search={search}
        setSearch={setSearch}
        showSources={showSources}
        setShowSources={setShowSources}
      />

      {showSources && <SourcesDrawer />}

      {page==="home"    && <HomePage    onNav={navigate} activeCat={activeCat} search={search} />}
      {page==="article" && <ArticlePage onNav={navigate} articleId={articleId} />}
      {page==="about"   && <AboutPage   onNav={navigate} />}
      {page==="contact" && <ContactPage onNav={navigate} />}
      {page==="submit"  && <SubmitPage  onNav={navigate} />}
      {(page==="privacy"||page==="cookies"||page==="terms") && <LegalPage page={page} onNav={navigate} />}

      <Footer onNav={navigate} />
    </div>
  );
}
