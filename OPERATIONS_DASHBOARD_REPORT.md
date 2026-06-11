# Operations Dashboard Report

This document specifies the metrics and alert thresholds monitored by the SRE/Operations team via our unified Grafana / Cloudflare / Supabase dashboards.

## 1. Platform Dashboards (Business Logic & UX)

These metrics provide real-time insight into the health of the JuneteenthTube application and user engagement.

| Metric | Source | Warning Threshold | Critical Alert |
| :--- | :--- | :--- | :--- |
| **Active Users (Real-time)** | Supabase Realtime / GA4 | N/A | Drops > 50% in 5m |
| **DAU / MAU** | Telemetry Aggregation | N/A | Week-over-Week decline |
| **Uploads (Success Rate)** | S3/R2 Pipeline | < 95% Success | < 90% Success |
| **Views / Minute** | `analytics_events` | Anomaly Detection | Zero for > 2m |
| **Watch Time** | `analytics_events` | N/A | N/A |
| **Errors (Frontend)** | Sentry SDK | > 1% Session error | > 5% Session error |
| **Searches (Zero-Result)** | `analytics_events` | > 20% Zero-result | > 40% Zero-result |

## 2. Infrastructure Dashboards (Systems Health)

These hardware and network-level metrics ensure the platform can scale without degradation.

| Infrastructure Component | Metric Tracked | Warning Threshold | Critical Alert |
| :--- | :--- | :--- | :--- |
| **Node/Vercel Edge** | CPU / Memory | > 75% Sustained | > 90% Sustained |
| **API/Database Latency** | P95 Response Time | > 500ms | > 1000ms |
| **Database (Supabase)** | Connections / Load | > 80% Pool usage | 100% Pool exhaustion |
| **Storage (R2/S3)** | Object Count / Size | Usage spike anomaly | Write Failures |
| **Bandwidth (Egress)** | MB/s Outbound | Cost anomaly detected | N/A |
| **CDN (Cloudflare)** | Cache Hit Ratio | < 80% | < 60% |
| **Playback Failures** | HLS / Video.js Stalls | > 1% Playback error | > 3% Playback error |

## 3. Operational Sign-off

The telemetry infrastructure, Sentry integration, and Cloudflare analytics effectively feed into these unified monitors. The on-call rotation is cleared to utilize these metrics for incident triage.
