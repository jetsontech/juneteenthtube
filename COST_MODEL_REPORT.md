# JuneteenthTube Cost Model Report

This document reports the launch-tier operational cost model for JuneteenthTube, estimating pricing scales across 5 distinct audience tiers spanning standard hosting, CDN offloading, AI transcription pipelines, and telemetry storage.

---

## 1. Cost Calculations by Infrastructure Category

* **Cloudflare (DNS + Enterprise Security)**: Standard Pro/Business tiers ($20 to $200/mo) with custom caching rules.
* **Cloudflare R2 (Storage + Egress)**:
  * Storage: $0.015 / GB-month.
  * Egress Bandwidth: **$0.00 / GB** (Zero egress pricing model).
  * Class A Operations (Uploads/Writes): $4.50 / million requests.
  * Class B Operations (Reads): $0.36 / million requests.
* **Supabase (Database + Auth + RLS)**:
  * Pro Tier: $25/mo flat (includes 8GB database space).
  * Excess database storage: $0.125 / GB-month.
* **AI pipelines (Whisper + Gemini)**:
  * Whisper Transcriptions: $0.006 / minute.
  * Gemini Metadata Summaries: $0.075 / 100,000 tokens.
* **Sentry (Monitoring & Alerting)**:
  * Developer/Team tier: $26/mo (100k events/mo).

---

## 2. Infrastructure Costs across Scaling Traffic Tiers

Calculations are estimated based on average viewer consumption:

* Average video size: `250 MB` (15-minute H.264 stream).
* Average monthly watch time per active user: `2 hours` (8 videos watched).

### Tier 1: 10,000 Monthly Active Users (MAUs)

* *Profile*: 80,000 videos streamed/month. 20 TB egress (100% cached by Cloudflare = 360 GB origin egress).

| Category | Consumption | Cost / Month |
| :--- | :--- | :--- |
| **Cloudflare Pro** | Base Tier | $20.00 |
| **Cloudflare R2** | 200 GB Storage + Class A/B | $7.20 |
| **Supabase Pro** | 1.2 GB DB size | $25.00 |
| **AI Ingestion** | 50 new videos (750 mins transcode) | $4.60 |
| **Sentry Monitoring**| Base Tier | $0.00 (Free Tier) |
| **Total Cost** | | **$56.80 / month** |

### Tier 2: 50,000 MAUs

* *Profile*: 400,000 videos streamed/month. 100 TB egress.

| Category | Consumption | Cost / Month |
| :--- | :--- | :--- |
| **Cloudflare Pro** | Base Tier | $20.00 |
| **Cloudflare R2** | 1 TB Storage + Class A/B | $22.50 |
| **Supabase Pro** | 6 GB DB size | $25.00 |
| **AI Ingestion** | 200 new videos (3,000 mins) | $18.40 |
| **Sentry Monitoring**| 100k events/mo | $26.00 |
| **Total Cost** | | **$111.90 / month** |

### Tier 3: 100,000 MAUs

* *Profile*: 800,000 videos streamed/month. 200 TB egress.

| Category | Consumption | Cost / Month |
| :--- | :--- | :--- |
| **Cloudflare Business**| Advanced Edge Shields | $200.00 |
| **Cloudflare R2** | 2 TB Storage + Class A/B | $42.00 |
| **Supabase Pro** | 12 GB DB size | $25.50 (Overages applied) |
| **AI Ingestion** | 400 new videos (6,000 mins) | $36.80 |
| **Sentry Monitoring**| 100k events/mo | $26.00 |
| **Total Cost** | | **$330.30 / month** |

### Tier 4: 500,000 MAUs

* *Profile*: 4,000,000 videos streamed/month. 1,000 TB (1 PB) egress.

| Category | Consumption | Cost / Month |
| :--- | :--- | :--- |
| **Cloudflare Business**| Advanced Edge Shields | $200.00 |
| **Cloudflare R2** | 10 TB Storage + Class A/B | $195.00 |
| **Supabase Pro** | 60 GB DB size | $31.50 |
| **AI Ingestion** | 2,000 new videos (30,000 mins) | $184.00 |
| **Sentry Monitoring**| Team Tier (Advanced Events) | $80.00 |
| **Total Cost** | | **$690.50 / month** |

### Tier 5: 1,000,000 MAUs (Launch Target Capacity)

* *Profile*: 8,000,000 videos streamed/month. 2,000 TB (2 PB) egress.

| Category | Consumption | Cost / Month |
| :--- | :--- | :--- |
| **Cloudflare Enterprise**| Custom Edge Pricing | $500.00 |
| **Cloudflare R2** | 20 TB Storage + Class A/B | $385.00 |
| **Supabase Enterprise**| Custom DB scaling constraints | $200.00 |
| **AI Ingestion** | 4,000 new videos (60,000 mins) | $368.00 |
| **Sentry Enterprise** | Custom Events | $150.00 |
| **Total Cost** | | **$1,603.00 / month** |

---

## 3. Operational Financial Strategy

1. **Zero Egress Shield**: By routing HLS streams through Cloudflare R2 rather than AWS S3, JuneteenthTube avoids egress charges that would ordinarily cost **$16,000/mo** at the 1M MAU tier.
2. **Telemetry Log Aging**: Purging telemetry entries older than 30 days keeps database storage charges at the minimum tier even under high concurrency.
3. **AI Pipeline Throttling**: Restricting video transcode inputs to authentic creator uploads protects AI infrastructure budgets.
