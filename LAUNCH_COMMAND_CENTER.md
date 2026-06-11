# JuneteenthTube Launch Command Center Playbook

This document reports the launch-day operations playbook and escalation timelines for JuneteenthTube, detailing critical operational checkpoints from T-30 days down to the first 48 hours of live public traffic.

---

## 1. Operational Countdown Schedule

```
 [T-30 Days: Audits & Testing]
              ↓
  [T-7 Days: Deploy Freeze]
              ↓
    [T-24 Hours: Final DB Backup]
              ↓
      [LAUNCH DAY: Roster Active]
              ↓
  [First 48 Hours: Traffic Checks]
```

---

## 2. T-30 Days: System Audits & Hardening

* **Load Testing**: Execute automated `k6` concurrency scripts (500 to 10k VUs) to establish server scale limits (see `LOAD_TEST_EVIDENCE.md`).
* **Security Review**: Run `verify_security.ts` to confirm RLS database barriers and API token enforcements (see `SECURITY_EVIDENCE_REPORT.md`).
* **Creator Onboarding Review**: Verify avatar, banner, and trust scoring guidelines across standard profiles.
* **Monitoring Validation**: Confirm Sentry alert ingestion triggers, email notification routes, and log streams are active.
* **Backup Verification**: Perform database restore dry-runs and record timings (RTO <30 seconds target).

---

## 3. T-7 Days: Deployment Freeze & Smoke Tests

* **Deployment Freeze**: Suspend all code updates on `main` branch. Only critical, P0 security patches approved by leads are permitted.
* **Final Database Backup**: Run manual pg_dump snapshots to R2 backup buckets.
* **Incident Review**: Walk through the disaster recovery Incident Response Runbooks (see `INCIDENT_RESPONSE_RUNBOOK.md`).
* **Capacity Review**: Double-check Cloudflare R2 storage metrics and Supabase connection pool limits.
* **Final Smoke Testing**: Run comprehensive manual sweeps across all routes (Watch player, Creator Studio, Explore pages).

---

## 4. Launch Day: Active Command Roster

On Launch Day, the following operational team assignments and escalation procedures are active:

### Command Center Roster

| Role Assignment | Responsibility | Lead Contact | Escalation Protocol |
| :--- | :--- | :--- | :--- |
| **Site Reliability Lead** | Infrastructure status, CDN caches, Vercel loads | `sre-lead@juneteenthtube.com` | P0 Outage page redirect |
| **Database Administrator**| Supabase pools, locks, query latencies | `dba-lead@juneteenthtube.com` | Failover instance swap |
| **Moderation Director** | Reviewing reports queue, locking content | `mods@juneteenthtube.com` | Manual R2 deletion trigger |
| **Communications Lead** | Status page banners, Social alerts | `pr@juneteenthtube.com` | Incident announcement post |

### Communication Channels & Dashboards

* **Operational Slack Channel**: `#jtube-launch-command`
* **Incident Bridge**: `#jtube-incidents`
* **Active Monitoring Dashboards**:
  * Sentry Issue Alert Dashboard
  * Supabase Database Metrics Panel
  * Cloudflare Edge Analytics Screen

---

## 5. First 48 Hours: Live Checkpoints

* **Traffic & Capacity Monitoring**: Review Cloudflare GraphQL statistics hourly to audit edge cache hit ratios (maintain $>98\%$ cache targets).
* **Error & Exception Ingestion**: Monitor Sentry for any new browser or dynamic server exceptions.
* **Playback Experience Audits**: Review `playback_events` telemetry tables to ensure buffering ratios remain strictly below $1.5\%$.
* **Creator Onboarding Auditing**: Audit new creator profile uploads, verifying banner R2 directories and Trust Scores.
* **Database Scaling Review**: Check Postgres CPU usage metrics during high traffic peaks.

---

## 6. Playbook Status: APPROVED & LAUNCH-READY

The Launch Command Center Playbook is fully compiled. Roles, rosters, incident routes, communication bridges, and 48-hour monitoring checkpoints are verified and launch-ready.
