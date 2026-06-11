# JuneteenthTube Incident Response Runbook

This document reports the launch-ready Incident Response Runbooks for JuneteenthTube, outlining step-by-step detection, triage, containment, recovery, communication, and postmortem processes for critical outages.

---

## Runbook 1: Database Outage (Supabase)

### 1. Detection

* **Trigger**: Sentry alerts report database connection timeouts (`500 Connection Refused`). Uptime monitoring triggers SMS alert.

### 2. Triage

* **Action**: Check the official Supabase Status page. Determine if the issue is a regional AWS outage or database instance CPU exhaustion.

### 3. Containment

* **Action**: Enable static fallback mode. Configure Cloudflare DNS rules to redirect dynamic page requests to a static maintenance page `maintenance.juneteenthtube.com`.

### 4. Recovery

* **Action**: If CPU-exhausted, increase pool limits via Vercel dashboard. If instance is corrupted, execute psql recovery using the target restoration sequence (see `BACKUP_VALIDATION_REPORT.md`).

### 5. Communication Plan

* **Internal**: Notify engineering leads via Slack incident channel `#jtube-incidents`.
* **External**: Update status page (`status.juneteenthtube.com`) and send Creator Dashboard banners.

### 6. Postmortem Process

* Run database audit logs to isolate slow queries that caused locks and optimize Postgres indexes.

---

## Runbook 2: Playback Outage (Video Streaming)

### 1. Detection (Runbook 2)

* **Trigger**: Telemetry table registers a sudden spike in `playback_error` event rates (greater than 5% of play starts).

### 2. Triage (Runbook 2)

* **Action**: Inspect Sentry errors. Determine if the failure resides on Cloudflare CDN routing or corrupted R2 media files.

### 3. Containment (Runbook 2)

* **Action**: Flip player source toggle. Update `src/components/video/CustomPlayer.tsx` fallback parameters to serve H.264 streams directly from backup storage mirrors, bypassing the HLS transcoder.

### 4. Recovery (Runbook 2)

* **Action**: Purge Cloudflare CDN Cache for `*.m3u8` playlists and re-deploy edge transform rules.

### 5. Communication Plan (Runbook 2)

* **External**: Publish alert banner: *"Some video qualities may experience slow buffering while we redirect traffic."*

### 6. Postmortem Process (Runbook 2)

* Validate R2 CORS headers and CDN TTL configurations.

---

## Runbook 3: Creator Upload Outage

### 1. Detection (Runbook 3)

* **Trigger**: Telemetry logs show `upload_error` peaks or R2 presigned signature API timeouts.

### 2. Triage (Runbook 3)

* **Action**: Determine if R2 API tokens have expired or if AWS-SDK multipart boundary limits are exceeded.

### 3. Containment (Runbook 3)

* **Action**: Pause multipart upload pipelines. Set standard single-upload mode globally inside the creator dashboard config.

### 4. Recovery (Runbook 3)

* **Action**: Rotate R2 access keys via Cloudflare Dashboard and deploy updated variables to Vercel.

### 5. Communication Plan (Runbook 3)

* **External**: Display notice in Creator Studio: *"Upload processing is currently running with standard queue rules."*

### 6. Postmortem Process (Runbook 3)

* Review IAM R2 tokens lifecycle settings.

---

## Runbook 4: Cloudflare R2 Storage Outage

### 1. Detection (Runbook 4)

* **Trigger**: Fetch requests to `media.juneteenthtube.com` return `503 Service Unavailable`.

### 2. Triage (Runbook 4)

* **Action**: Confirm Cloudflare system status.

### 3. Containment (Runbook 4)

* **Action**: Re-route media fetches to our secondary AWS S3 storage mirror bucket.

### 4. Recovery (Runbook 4)

* **Action**: Update Next.js `next.config.ts` allowed image and media domains to fallback URLs.

### 5. Communication & Postmortem (Runbook 4)

* Gracefully inform creators of the delay and audit cross-region mirroring tasks.

---

## Runbook 5: Security Breach / Impersonation Attempts

### 1. Detection (Runbook 5)

* **Trigger**: Security verification scripts detect active unauthorized mutations or RLS violations.

### 2. Triage (Runbook 5)

* **Action**: Identify compromised API route.

### 3. Containment (Runbook 5)

* **Action**: Lock the API endpoint immediately using the edge middleware `middleware.ts`, returning `403 Forbidden` for all requests to the target directory.

### 4. Recovery (Runbook 5)

* **Action**: Rotate all JWT secrets, revoking active compromised tokens (see `DISASTER_RECOVERY_REPORT.md`).

### 5. Communication & Postmortem (Runbook 5)

* Notify affected creators and audit endpoint authorization headers.

---

## Runbook 6: Serverless Service Degradation (Next.js / Vercel)

### 1. Detection (Runbook 6)

* **Trigger**: Telemetry dashboard registers P95 server API response latencies exceeding 2 seconds.

### 2. Triage (Runbook 6)

* **Action**: Inspect Vercel log streams to detect infinite loops or slow Supabase joins.

### 3. Containment (Runbook 6)

* **Action**: Enable static page pre-rendering blocks to offload processing loads to Cloudflare.

### 4. Recovery (Runbook 6)

* **Action**: Deploy code hotfixes optimization patches (such as capping rails).

### 5. Communication & Postmortem (Runbook 6)

* Gracefully inform creators and optimize slow database queries.

---

## Runbook 7: Cloudflare CDN Outage

### 1. Detection (Runbook 7)

* **Trigger**: Edge CNAME resolution fails globally (`NXDOMAIN` or DNS timeouts).

### 2. Triage (Runbook 7)

* **Action**: Check Cloudflare Global Network status.

### 3. Containment (Runbook 7)

* **Action**: Temporarily bypass Cloudflare DNS proxy (grey-cloud CNAME target) in registrar settings, sending users directly to the Vercel deployment origin.

### 4. Recovery (Runbook 7)

* **Action**: Re-enable proxying once CDN nodes resume stable operation.

### 5. Communication & Postmortem (Runbook 7)

* Post incident alerts on status channels and audit DNS TTL settings.
