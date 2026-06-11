# JuneteenthTube Disaster Recovery Plan

This document reports the launch-tier disaster recovery (DR) plan for JuneteenthTube, establishing verified RPO (Recovery Point Objective) and RTO (Recovery Time Objective) parameters to survive critical network failures and infrastructure compromises.

---

## 1. Database Backups & Restore Protocols

* **RPO Target**: `< 24 hours` for transactional data, `< 1 hour` for structural schemas.
* **RTO Target**: `< 30 minutes` for complete restoration.

### Backup Strategy (Supabase Postgres)

1. **Daily Automatic Backups**: Managed natively by Supabase (retained for 7 days on Free, 30 days on Pro).
2. **Point-in-Time Recovery (PITR)**: Enables database recovery down to the millisecond, isolating transaction errors dynamically.
3. **Weekly Schema Backups**: Managed via Github actions deploying structural dumps (`.sql` schemas) to a secure, separate R2 backup bucket.

### Recovery Command Pipeline

In the event of database corruption:

```bash
# 1. Pull the target schema and data dump
aws s3 cp s3://jtube-backups/db/daily_dump_latest.sql ./restore.sql --endpoint-url https://bc688d266ed92c11a9a19f4f5a199e29.r2.cloudflarestorage.com

# 2. Re-apply database schema migration files in sequence
psql -h aws-0-us-east-1.pooler.supabase.com -U postgres.fybxhwpkujbodlfoadem -d postgres -f restore.sql
```

---

## 2. Cloudflare R2 Object Store Recovery

Video raw streams and HLS playlists are stored in R2.

* **Durability Target**: `99.999999999%` (11 nines). R2 replicates objects across multiple storage devices within geographic zones automatically.
* **Secondary Mirroring**: Creator upload files are mirrored asynchronously to a secondary AWS S3 backup bucket in `us-east-2` with a lifecycle policy deleting raw assets after 30 days, retaining only transcoded segments.

---

## 3. High-Security Credential Rotation Cycle

To recover from potential developer compromises, we enforce a strict **72-Hour Rotation Protocol** for keys:

1. **Github Actions Secrets**: Rotate the `GITHUB_DISPATCH_TOKEN` dynamically.
2. **Supabase Secrets**:
   * Access Supabase Settings > API.
   * Click **JWT Secret > Change JWT Secret** (Generates a new `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` immediately).
3. **Cloudflare R2 Keys**:
   * Access Cloudflare Dashboard > R2 > Manage R2 API Tokens.
   * Revoke old tokens, create new `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` credentials, and update Vercel dashboard.

---

## 4. Immediate Incident Response Protocol

```
[Operational Outage Detected]
             ↓
[Triage Severity: P0/P1/P2]
             ↓
  ├─► P0: Global Playback Crash ──► Declare outage page, spin up mirrored backup server
  │
  ├─► P1: Creator Upload Failure ──► Bypass active transcoding workers, fall back to native storage
  │
  └─► P2: Telemetry Outage ────► Disable `/api/telemetry` writes, queue log buffers in memory
```

---

## 5. Deployment Rollback Procedures

If a newly deployed Vercel build triggers fatal production runtime exceptions:

1. Access the Vercel Dashboard.
2. Select the target project `juneteenthtube`.
3. Locate the previous successfully compiled deployment (verified via build logs).
4. Click **Instant Rollback**.
5. The edge routers revert DNS routing immediately (transition latency: `<5 seconds`).
