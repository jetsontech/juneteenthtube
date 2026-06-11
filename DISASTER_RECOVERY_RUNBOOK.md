# JuneteenthTube Disaster Recovery Runbook

This runbook outlines the exact emergency procedures for recovering the platform from catastrophic failures or security incidents.

---

## 1. Database Outage (Supabase)

**Symptom:** API endpoints failing with `500` or `504`. Users cannot log in or view dynamic content.
**Recovery Steps:**

1. Check the Supabase Status page (`status.supabase.com`).
2. If the active instance is permanently down/corrupted, initiate Point-in-Time-Recovery (PITR).
3. `npx supabase db restore --db-url <NEW_INSTANCE_URL> --file <LATEST_BACKUP_SQL>`
4. Update `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
5. Trigger an empty commit to Vercel to rebuild and deploy with new environment variables.

## 2. Storage Outage (Cloudflare R2)

**Symptom:** Uploads fail. Video playback returns `404` or `503`. Thumbnails fail to load.
**Recovery Steps:**

1. Check Cloudflare R2 Status.
2. If R2 is globally down, fall back to the AWS S3 hot-standby (if configured).
3. Update `.env.local` / Vercel `S3_ENDPOINT` and `S3_PUBLIC_DOMAIN` to the AWS S3 fallback URIs.
4. If a bucket was accidentally deleted, script a replication from the cold storage archive back into a newly provisioned R2 bucket.

## 3. CDN Outage (Cloudflare)

**Symptom:** Entire site is unreachable, or DNS fails to resolve `juneteenthtube.com`.
**Recovery Steps:**

1. If Cloudflare Proxy is failing, log into the DNS registrar and point the `A`/`CNAME` records directly to the Vercel edge `cname.vercel-dns.com`.
2. Note: This removes WAF and Caching protections, exposing the application to higher load. Immediately scale Vercel compute limits.

## 4. Upload Outage

**Symptom:** Users cannot initiate or complete video uploads.
**Recovery Steps:**

1. Check Vercel Function logs for memory exhaustion or timeout errors during multipart chunking.
2. Verify Cloudflare R2 CORS policies have not been overwritten.
3. If the backend is overwhelmed, temporarily restrict uploads via a feature flag: `NEXT_PUBLIC_UPLOADS_ENABLED=false` to prevent platform-wide degradation while investigating.

## 5. Playback Outage

**Symptom:** `m3u8` or `.ts` chunks are throwing `403` or `404`.
**Recovery Steps:**

1. Verify the Transform Rules in Cloudflare are correctly rewriting the `/media/` path.
2. Clear the Cloudflare Cache entirely for the `/media/*` zone: `Purge Cache -> Custom -> /media/`.
3. Verify video files exist in the bucket using the `aws s3api` or Cloudflare dashboard.

## 6. Security Incident (DDoS or Exploitation)

**Symptom:** Massive traffic spikes, anomalous database deletes, or WAF alerts.
**Recovery Steps:**

1. **Enable Under Attack Mode** in Cloudflare immediately.
2. Activate Super Bot Fight Mode.
3. If an API exploit is found, implement a quick WAF Custom Rule to block the specific URI path or payload signature.
4. Scale up the database connection pool in Supabase.

## 7. Credential Leak

**Symptom:** `SUPABASE_SERVICE_ROLE_KEY`, `S3_SECRET_ACCESS_KEY`, or `VERCEL_OIDC_TOKEN` exposed in a public repository or log.
**Recovery Steps:**

1. Immediately regenerate the exposed secret in its respective dashboard (Supabase / Cloudflare / Vercel).
2. Update the environment variables in the Vercel Production dashboard.
3. Trigger a mandatory redeploy of the application.
4. Search logs for unauthorized use of the leaked credential during the exposure window.

## 8. Production Rollback

**Symptom:** A newly merged PR introduces a catastrophic bug crashing the site.
**Recovery Steps:**

1. Log into Vercel Dashboard -> Project -> Deployments.
2. Locate the last known stable deployment.
3. Click the three dots -> **Promote to Production** (or use CLI: `vercel rollback <DEPLOYMENT_ID>`).
4. Revert the problematic commit in GitHub: `git revert <commit_hash> && git push origin main`.
