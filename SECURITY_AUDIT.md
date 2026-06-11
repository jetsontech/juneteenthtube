# JuneteenthTube Security Audit

This document presents the security engineering audit for JuneteenthTube, analyzing open endpoints, authentication flows, and security architectures to secure creator content, user identities, and infrastructure costs.

---

## 1. Vulnerability Log & Security Assessment

### [CRITICAL] VULN-001: Unauthenticated Database Mutation

* **File**: `src/app/api/videos/route.ts` (DELETE)
* **Risk**: High. The route processes deletion queries directly with `supabaseAdmin` (bypassing normal user permissions) without verifying user identity, auth tokens, or cookies.
* **Impact**: Anyone could execute a simple curl command to delete any video, which can result in severe platform defacement.
* **Remediation**: Retrieve the request auth header or cookie, call `supabase.auth.getUser()`, and check if the user is an administrator or the video's original `owner_id`.

### [CRITICAL] VULN-002: Open Creator Upload & Dispatch Abuse

* **File**: `src/app/api/videos/create/route.ts` (POST)
* **Risk**: High. No auth verification is done when creating video metadata in the DB.
* **Impact**: Unauthenticated users can submit entries to the database and trigger real GitHub Actions repository dispatch transcoder actions. Attackers can spam dispatches, exhausting GitHub Actions runner minutes and incurring significant financial overhead.
* **Remediation**: Secure the endpoint by verifying the user's active login token prior to database creation and dispatch triggers.

### [HIGH] VULN-003: Impersonation in Likes & Comments

* **Files**: `src/app/api/likes/route.ts`, `src/app/api/comments/route.ts`
* **Risk**: Medium. These endpoints accept `userId` inside the request body/header and execute Supabase queries blindly trusting this ID.
* **Impact**: A user could impersonate other users by sending their target `userId` in API payloads, creating fake likes or posting comments under other users' names.
* **Remediation**: Validate the authentication state server-side. Do not trust the payload's `userId` unless it matches the session user fetched from `supabase.auth.getUser()`.

---

## 2. Content Security Policy (CSP) & Headers

Our custom `middleware.ts` enforces modern HTTP security headers:

* **X-Frame-Options**: Set to `DENY` to prevent clickjacking attacks.
* **X-Content-Type-Options**: Set to `nosniff` to block MIME sniffing.
* **Referrer-Policy**: Restricts referrer info to protect user privacy.

### Current Gaps

1. **API Exclusion**: The Next.js middleware explicitly excludes all paths under `/api/*` from receiving security headers. While CSP is not strictly required for JSON APIs, cors protections and rate-limiting headers must apply to all API endpoints.
2. **CSP Evaluation**: The CSP `connect-src` and `frame-src` use wildcard domains (`*`). We should restrict these to trusted Cloudflare, Supabase, and Github endpoints to prevent Cross-Site Scripting (XSS) data exfiltration.

---

## 3. Rate Limiting & Abuse Prevention

1. **Endpoint Protection**: No rate limits exist in Next.js routes. Creators and guests could spam the video upload, comments, or likes endpoints.
2. **Github Dispatches**: Transcoder requests should have strict rate limits (e.g., maximum 5 uploads per user per hour) to protect CPU and billing resources.
3. **Database Guardrails**: Apply RLS policies directly in Supabase for tables like `likes` and `comments` as a second defense line, ensuring that authenticated user UUIDs are verified at the DB layer via `auth.uid()`.
