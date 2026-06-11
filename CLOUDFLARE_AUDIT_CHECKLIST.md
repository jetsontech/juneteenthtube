# Cloudflare Operational Audit & Verification Checklist

This audit checklist enables the deploying engineer to manually verify and sign off on the Cloudflare edge networking, caching, and security topologies for `juneteenthtube.com`.

---

## 1. Domain & DNS Proxied Status Verification

### 1.1 DNS Validation Steps

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select the zone for `juneteenthtube.com`.
3. Navigate to **DNS** -> **Records** in the left sidebar.
4. Verify that the root domain `juneteenthtube.com` and the `www` CNAME are set to **Proxied** (orange cloud status icon).
5. Verify that `media.juneteenthtube.com` resolves directly to the Cloudflare R2 bucket custom domain.

### 1.2 DNS Expected Settings

| Record Type | Name | Content / Target | Proxy Status |
| :--- | :--- | :--- | :--- |
| **A** | `juneteenthtube.com` | Vercel / Origin IP | **Proxied** (Orange) |
| **CNAME** | `www` | `cname.vercel-dns.com` | **Proxied** (Orange) |
| **CNAME** | `media` | Custom R2 Routing | **DNS Only** or **Proxied** |

### 1.3 DNS Verification Screenshot

> **Location:** DNS -> Records
>
> **Upload Here:** Replace this placeholder with the screenshot of the DNS Records list showing the orange proxy clouds.
>
> *File Path:* `assets/cloudflare_zone_dns.png`

---

## 2. Cloudflare R2 Storage & CORS Policies

### 2.1 R2 Validation Steps

1. On the Cloudflare Dashboard homepage, click **R2** in the left navigation panel.
2. Select the bucket named `juneteenthtube`.
3. Click on the **Settings** tab.
4. Verify that the **Custom Domains** section is active and bound to `media.juneteenthtube.com`.
5. Scroll down to **CORS Policy** and verify that the CORS JSON configuration matches the allowed origins.

### 2.2 R2 Expected Settings

- **Custom Domain:** `media.juneteenthtube.com`
- **CORS Rules:**

```json
[
  {
    "AllowedOrigins": ["https://juneteenthtube.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### 2.3 R2 Verification Screenshot

> **Location:** R2 -> Buckets -> `juneteenthtube` -> Settings -> Custom Domains & CORS
>
> **Upload Here:** Replace this placeholder with the screenshot showing the R2 bucket custom domain and CORS rules.
>
> *File Path:* `assets/cloudflare_r2_storage.png`

---

## 3. Edge Caching & Page/Cache Rules

### 3.1 Caching Validation Steps

1. Navigate to **Caching** -> **Cache Rules** under the `juneteenthtube.com` zone.
2. Verify that caching rules are active for static assets and media files.

### 3.2 Caching Expected Settings

#### Rule A: Immutable Media Segments (HLS)

- **Expression:** `(http.request.uri.path wildcard "*.ts" or http.request.uri.path wildcard "*.mp4")`
- **Cache Status:** Eligible for cache (Eligible)
- **Edge TTL:** Override to **1 Year** (31,536,000s)
- **Browser TTL:** Override to **7 Days** (604,800s)

#### Rule B: Creator Assets (Thumbnails/Avatars)

- **Expression:** `(http.request.uri.path starts_with "/thumbnails/" or http.request.uri.path starts_with "/avatars/")`
- **Cache Status:** Eligible for cache
- **Edge TTL:** Override to **7 Days** (604,800s)

### 3.3 Caching Verification Screenshot

> **Location:** Caching -> Cache Rules
>
> **Upload Here:** Replace this placeholder with the screenshot of the active Caching Rules list.
>
> *File Path:* `assets/cloudflare_cache_rules.png`

---

## 4. WAF, Bot Fight Mode & Rate Limiting

### 4.1 Security Validation Steps

1. Navigate to **Security** -> **WAF** under the `juneteenthtube.com` zone.
2. Select the **Rate Limiting Rules** tab and verify the Telemetry API flood protection.
3. Select **Security** -> **Bots** (or settings under WAF) and verify that **Bot Fight Mode** is enabled.

### 4.2 Security Expected Settings

- **Rate Limit Rule (Telemetry API Protection):**
  - **Expression:** `(http.request.uri.path eq "/api/telemetry")`
  - **Threshold:** 30 requests per 1 minute per IP.
  - **Action:** Block or Challenge (HTTP 429).
- **Bot Fight Mode:** **Enabled (ON)**
- **Super Bot Fight Mode (Optional Pro):** **Enabled** for challenge/blocking automated scrapers.

### 4.3 Security Verification Screenshot

> **Location:** Security -> WAF -> Rate Limiting Rules & Security -> Bots
>
> **Upload Here:** Replace this placeholder with the screenshot showing the rate limiting rule and Bot Fight status.
>
> *File Path:* `assets/cloudflare_waf_bots.png`

---

## 5. Transform Rules & URL Rewriting

### 5.1 Transform Validation Steps

1. Navigate to **Rules** -> **Transform Rules** -> **URL Rewrite Rules** under the zone.
2. Verify that rewrites are set up for clean media segment paths if media is served from custom assets.

### 5.2 Transform Expected Settings

- **Transform Rule:** Clean Media URLs Rewrite
- **Expression:** `(http.request.uri.path starts_with "/media/")`
- **Action:** Rewrite to path: `regex_replace(http.request.uri.path, "^/media/", "/")`

### 5.3 Transform Verification Screenshot

> **Location:** Rules -> Transform Rules -> URL Rewrite Rules
>
> **Upload Here:** Replace this placeholder with the screenshot of the Transform Rules.
>
> *File Path:* `assets/cloudflare_transform_rules.png`

---

## 6. Compression & SSL/TLS Configuration

### 6.1 Compression & SSL Validation Steps

1. Navigate to **Speed** -> **Optimization** -> **Content Optimization** and check **Brotli** compression.
2. Navigate to **SSL/TLS** -> **Overview** and verify the encryption mode.

### 6.2 Compression & SSL Expected Settings

- **SSL/TLS Encryption Mode:** **Full** or **Full (Strict)**
- **Brotli Compression:** **Enabled**
- **HTTP/3 (QUIC):** **Enabled**

### 6.3 SSL Verification Screenshot

> **Location:** SSL/TLS -> Overview
>
> **Upload Here:** Replace this placeholder with the screenshot showing the Full/Strict SSL configuration.
>
> *File Path:* `assets/cloudflare_ssl_overview.png`

---

## 🏁 Telemetry Operational Sign-Off

I have verified all the active configurations on the Cloudflare Dashboard according to the expected values listed above:

- **DNS Orange Clouds Proxied:** `[ ] Yes / [ ] No`
- **R2 Bucket Custom Domain & CORS:** `[ ] Yes / [ ] No`
- **Media Cache Rules (1 Year Edge TTL):** `[ ] Yes / [ ] No`
- **WAF Rate Limiter (/api/telemetry):** `[ ] Yes / [ ] No`
- **Bot Fight Mode ON:** `[ ] Yes / [ ] No`
- **SSL/TLS Encryption Full/Strict:** `[ ] Yes / [ ] No`

*Auditor Name:* __________________________  
*Sign-Off Date:* __________________________  
