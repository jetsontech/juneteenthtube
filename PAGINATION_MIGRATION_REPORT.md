# JuneteenthTube Pagination Migration Report

This document reports the pagination engineering plan for JuneteenthTube, designed to remove all unlimited database catalog queries (`select *` patterns) and establish scale-safe paginated feed access.

---

## 1. The Startup Load Bottleneck

### Issue

Previously, components relied on the client-side global `VideoContext` state, which executed a single, un-bounded `.select('*')` query to retrieve the entire video archive at mount.

### Risks

* **Memory Exhaustion**: As the platform grows to thousands of videos, downloading the entire table will exhaust browser heaps and crash lower-end mobile browsers.
* **Network Saturation**: Users incur heavy bandwidth consumption simply loading the home page, even if they only watch a single video.
* **Hydration Lag**: Skeletons block interaction for several seconds while parsing giant JSON structures.

---

## 2. Dynamic Pagination Architecture

To eliminate startup lag, the data delivery pattern is refactored into distinct server-paginated segments:

```
[UI Feeds (Home / Explore)]
          ↓
  [GET /api/videos/feed?limit=20&offset=0]
          ↓
   [Supabase Database] (Executes range select)
```

### Feed Ranges & Limits

1. **Homepage Carousel / Featured**: Limited to `10` items.
2. **Homepage Trending**: Limited to `20` items, sorted by views.
3. **Homepage Recently Added**: Limited to `20` items, sorted by `created_at desc`.
4. **Homepage Category Rails**: Limited to `20` items.
5. **Explore Page Search**: Dynamic **infinite scrolling** querying database range slices (`offset` range blocks of 20) on-demand as the user scrolls.

---

## 3. Paginated API Specifications

The central paginated feed route `/api/videos/feed` takes the following query query parameters:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `limit` | `number` | `20` | Row segment count to return |
| `offset` | `number` | `0` | Starting index in database range |
| `feed` | `string` | `recent` | Feed sort pattern: `recent` \| `trending` \| `featured` |
| `category`| `string` | `null` | Optional category filter |
| `state` | `string` | `GLOBAL` | Localized geographic state segment filter |

---

## 4. UI Hook Migration Plan

1. **State-Level Isolation**: Modify `VideoContext.tsx` to completely remove startup `.select('*')` fetching. Instead, provide client fetching promises for lazy rails:
   `fetchPaginatedFeed(feedType, limit, offset)`.
2. **Infinite Scroll Hook**: Inside `ExplorePage`, integrate `react-intersection-observer` to monitor footer views. When the user scrolls near the page bottom, dynamically fetch the next block of 20 videos and append it to the feed array:

   ```typescript
   const fetchNextPage = () => {
       const nextOffset = dbVideos.length;
       fetchVideosFromApi(nextOffset);
   };
   ```
