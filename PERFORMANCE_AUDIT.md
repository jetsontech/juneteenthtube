# JuneteenthTube Performance Audit

This document presents the performance engineering audit for JuneteenthTube, analyzing homepage load bottlenecks, resource utilization, and detailing the optimization plan to achieve a sub-2 second load time.

---

## 1. Homepage Load Bottlenecks

Currently, loading the home page involves:

1. **Hydration Latency**: Next.js downloads a massive client bundle because of the global `"use client"` context and client-side mappings.
2. **Double Query Cost**: The page mounts, triggers skeleton loaders, sends an unpaginated query to Supabase, maps 48+ records client-side, and then re-renders the rails. This causes layout shifts and high CPU usage.
3. **Regex Search/Sorting**: Sorting trending videos by views runs dynamic regex parses like `v.replace(/,/g, "")` and checks `K/M/B` suffixes *every time* state updates.

---

## 2. Metrics & Targets

| Metric | Current State | Target State | Optimization |
| :--- | :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | ~1.6s | **< 0.6s** | Pre-render rails as Server Components |
| **Time to Interactive (TTI)** | ~2.8s | **< 1.2s** | Reduce client-side bundle & eliminate layout shifts |
| **Speed Index** | ~2.4s | **< 1.0s** | Implement lazy loading for off-screen rails |
| **Catalog Fetch Overhead** | ~48 rows (all) | **12 rows (limited)** | Paginate database queries with dynamic limit parameters |

---

## 3. Caching Strategy

We will utilize a dual-layer caching model:

```
[User Browser]
      ↓
[Edge CDN / Next.js ISR Cache] (Dynamic revalidation: 60s)
      ↓
[Supabase Database Row-Level Cache] (Connection Pooling)
```

1. **Static/Dynamic Segment Caching**: Pre-compile the homepage rails during build-time, using Next.js `revalidate = 60` (Incremental Static Regeneration). The homepage will load instantly from the CDN, updating in the background every 60 seconds.
2. **Media Stream Caching**: Cloudflare R2 provides edge-caching for video chunks (`.ts` segments) through the CDN domain, eliminating outbound database calls during playback.

---

## 4. Image Optimization

* **Custom Cloudflare Image Loader**: Configured correctly in `next.config.ts` and `src/lib/cloudflare-loader.ts`.
* **Issue**: Several elements do not pass dynamic sizes or formatting params.
* **Fix**: Ensure all `<Image>` calls define optimal `sizes` (e.g., `(max-width: 768px) 100vw, 300px`) so that the CDN resizes thumbnails appropriately instead of delivering full-resolution files.

---

## 5. Optimized Bundle Strategy

* **Lucide React Tree Shaking**: Currently imported as standard components. `next.config.ts` already optimizes imports. We should continue to keep imports isolated to avoid bundling unused icons.
* **Component Lazy Imports**: Splitting off dynamic components that are not needed during initial paint:
  * CustomPlayer: Already dynamically imported (excellent!).
  * Upload modals / settings panels: Migrate to lazy loading so they are only fetched when clicked.
* **Virtualization & Pagination**: Add infinite scroll or lazy rendering for category rails. Only render off-screen rows once the user scrolls them into the viewport.
