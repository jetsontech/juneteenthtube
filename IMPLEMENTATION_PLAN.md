# JuneteenthTube Production Implementation Plan

This document outlines the phased engineering roadmap to resolve the identified bottlenecks, security gaps, and performance concerns, preparing the platform for a secure and scalable launch.

---

## Phase 0 (P0) – Core Platform & Security Hardening (Highest Priority)

### 1. Playback Stabilization

* **Target File**: [CustomPlayer.tsx](file:///c:/Juneteenthtube-Master/src/components/video/CustomPlayer.tsx)
* **Change**: Add clean destroy checks in the player source loader.
* **Code Implementation**:

  ```typescript
  if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
  }
  ```

  This ensures that switching videos or video qualities does not trigger multiple memory leaks or overlapping socket calls.

### 2. Mutating API Route Hardening

* **Target Files**:
  * `src/app/api/videos/route.ts` (DELETE)
  * `src/app/api/videos/create/route.ts` (POST)
  * `src/app/api/videos/update/route.ts` (PATCH)
* **Change**: Validate requests using Supabase `supabase.auth.getUser()`.
* **Rules**:
  * Restrict `DELETE` and `PATCH` actions to the original video owner or a verified administrator.
  * Limit `POST` creation routes to logged-in creators or admins. Prevent unauthenticated users from dispatching GitHub transcoding actions.

### 3. Impersonation Guardrails (Likes & Comments)

* **Target Files**:
  * `src/app/api/likes/route.ts`
  * `src/app/api/comments/route.ts`
* **Change**: Retrieve the user's ID directly from their auth session token server-side instead of relying on client-supplied body payloads, protecting user identity and votes.

### 4. VideoContext Catalog Refactoring

* **Target File**: [VideoContext.tsx](file:///c:/Juneteenthtube-Master/src/context/VideoContext.tsx)
* **Change**: Remove the full database catalog pull on initialization. Provide dynamic feed fetching methods.

---

## Phase 1 (P1) – Homepage Feed & Performance Optimizations

### 1. Feed Pagination & Lazy Loading

* **Target File**: [page.tsx](file:///c:/Juneteenthtube-Master/src/app/page.tsx)
* **Change**: Refactor feed rails to load a maximum of 12 items initially, fetching more segments as the user clicks "See All" or scrolls down the page.
* **Benefit**: Reduces the homepage database query volume from thousands of records to only a few precise rows, reducing LCP and TTI.

### 2. Search Database Pagination

* **Target File**: [page.tsx](file:///c:/Juneteenthtube-Master/src/app/explore/page.tsx)
* **Change**: Move exploration searching to the database. Use Supabase `.ilike()` or text search queries instead of filtering the entire video array client-side with JavaScript.

### 3. Creator Studio Upload Validation

* **Target File**: `src/app/creator-studio/page.tsx`
* **Change**: Update the upload page and API checks to allow normal registered creators (not just strict administrators) to upload content to the platform.

---

## Phase 2 (P2) – AI Metadata & Recommendations

### 1. AI Metadata Assistant

* **API Route**: `src/app/api/ai/metadata/route.ts`
* **Features**: Integrate the Gemini API to automatically generate video titles, SEO descriptions, and category tags during the upload process.

### 2. Relational Recommendation Engine

* **Target File**: `src/app/watch/[id]/WatchClient.tsx`
* **Change**: Fetch recommendations from the database based on category matches and trending metrics rather than loading all videos and sorting client-side.
