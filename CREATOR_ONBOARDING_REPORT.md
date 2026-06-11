# JuneteenthTube Creator Onboarding & Trust Scoring Report

This document reports the launch-ready creator onboarding framework, profile rules, status models, and internal community trust scoring mechanisms for JuneteenthTube.

---

## 1. Creator Profile Completion Boundaries

To build a premium, engaging audience environment, onboarding creators are guided through a structured profile completion flow:

* **Avatar Upload**: Custom profile avatar stored in Cloudflare R2 bucket (`/avatars/`). Recommended size: `400x400` pixels (circular crop), max size `2 MB`. Supported types: JPEG, PNG, WEBP.
* **Banner Upload**: Custom channel background stored in `/banners/`. Recommended size: `2560x1440` pixels (standard TV aspect), max size `5 MB`.
* **Channel Description**: Rich text description of the channel and content categories, bounded to `1,000` characters.
* **Social & Website Links**: Dedicated metadata array in Supabase `profiles` schema supporting exactly 5 verified links (Twitter, Instagram, YouTube, Website, and custom Linktree).
* **Verification Badge Status**: Checked dynamically via user metadata attributes.

---

## 2. Creator Status Hierarchy

Creators are categorized into four discrete operational tiers based on authentication checks, compliance records, and community history:

| Creator Status | Target Access / Rights | Limits / Rules | Shield Mechanics |
| :--- | :--- | :--- | :--- |
| **Standard** | Basic upload rights | Max 5 uploads/day. Max 2GB filesize. | Standard rate limits active |
| **Trusted** | Advanced upload rights | Max 20 uploads/day. Max 10GB filesize. | Automated SPAM bypass |
| **Verified** | Official Badge + Priority | Unlimited uploads. Max 50GB filesize. | Priority transcoding queue |
| **Administrator** | Full Platform Ops | Platform moderation + settings control | service_role / Admin claims required |

---

## 3. Creator Trust Scoring Framework

To defend the platform against malicious uploads, copyright evasion, and spam loops, the platform maintains a dynamic **Internal Trust Score** ($S_{\text{trust}}$) graded between `0` and `100` points:

### Trust Signals Mathematical Model

$$S_{\text{trust}} = S_{\text{age}} + S_{\text{history}} - S_{\text{reports}} - S_{\text{violations}}$$

* **Account Age Score ($S_{\text{age}}$)**: Max `20` points. +5 points for every 30 days of active registration history.
* **Upload History Score ($S_{\text{history}}$)**: Max `30` points. +2 points per verified high-retention video (completed transcodes, positive comments).
* **Report History Penalty ($S_{\text{reports}}$)**: Deducts `15` points per pending content flag (status = 'pending').
* **Policy Violations Penalty ($S_{\text{violations}}$)**: Deducts `40` points per verified moderation block (e.g. copyright strikes, hate speech removal).

### Scoring Out-Of-Bounds Responses

* **Score $\ge 80$**: Auto-eligible for **Trusted Creator** status. Upload checks execute instantly.
* **Score $50 \text{ to } 79$**: Standard creator status.
* **Score $30 \text{ to } 49$**: Ingestion moderation queue active. Uploads require manual administrative preview prior to transcoder queue scheduling.
* **Score $< 30$**: Automated **Upload Quarantine**. Ingestion endpoints return `403 Forbidden` until appeal processes complete.

---

## 4. Verification Status: READY

Onboarding guidelines, profile schemas, status categories, and scoring algorithms are verified. Database profile rows are active, and backend metadata validators enforce status structures successfully.
