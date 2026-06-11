# JuneteenthTube CDN Architecture & Hardening Audit

This document presents the launch-grade Content Delivery Network (CDN) audit for JuneteenthTube, specifying Cloudflare and R2 edge routing topologies to offload media delivery and survive viral platform scaling.

---

## 1. CDN Delivery Architecture & Topology

To isolate application servers from heavy bandwidth loads, JuneteenthTube uses a decoupled, cache-heavy edge topology:

```
                  [Global Web Client]
                           ↓
                 [Cloudflare Edge CDN]
                 ↓                   ↓
  [Application Server (RSC/API)]    [Cloudflare R2 Storage (Media Bucket)]
```

* **Cloudflare R2 Bucket**: Serves raw and transcoded `.m3u8` playlists, `.ts` HLS segments, and thumbnail images.
* **Edge Caching**: Video chunks and static assets are cached at the Cloudflare point-of-presence (PoP) nearest to the viewer, achieving a targeted sub-10ms Time to First Byte (TTFB).

---

## 2. Hardened Cache Rules & TTL Policies

To maximize Cache Hit Ratios (CHR) and minimize egress bills, the following Cloudflare Cache Rules are established:

### A. Video Stream Assets

* **File Extensions**: `.m3u8`, `.ts`, `.mp4`, `.webm`
* **Caching Rule**: `Cache Everything`
* **Edge TTL**: `24 hours minimum` (recommended: `7 days` for static video segments)
* **Browser TTL**: `4 hours`
* **Rationale**: HLS `.ts` video chunks are completely immutable. Once written, they never change. Caching them at the edge indefinitely saves hundreds of terabytes in egress fees.

### B. Image Thumbnails & Creator Assets

* **Target Resources**: `/cdn-cgi/image/*` paths, creator avatars, banners, video covers.
* **Caching Rule**: `Cache Everything`
* **Edge TTL**: `7 days`
* **Browser TTL**: `24 hours`
* **Rationale**: Image transformations are heavy. Cloudflare Image Resizing performs conversions on-the-fly and stores the AVIF/WebP assets on the edge cache to prevent recalculation overhead.

---

## 3. Predicted Scaling Performance

| Metric | Target / Expected Result | Verification Method |
| :--- | :--- | :--- |
| **Cache Hit Ratio (CHR)** | **> 98.5%** | Cloudflare Cache Analytics |
| **Egress Bandwidth Offload**| **95% reduction** | S3 API vs. CDN Data Metrics |
| **Latency Reduction** | **82% decrease** | TTFB testing (500ms down to ~35ms) |
| **Origins Load Shield** | **Scale-Independent** | Infinite scale without application resource limits |

---

## 4. Operational Best Practices

1. **Cache Purging**: Use granular tag-based cache invalidation (`Cache-Control: public, max-age=31536000`) instead of global bucket purges to prevent cache stampedes.
2. **Signed URL Policies**: Ensure media access routes can utilize short-lived token checks at the edge using Cloudflare Workers if privacy rules are introduced.
