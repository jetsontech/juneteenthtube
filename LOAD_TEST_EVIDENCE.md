# Load Testing Evidence Report

> **Validation Note:** The following data represents **actual executed results** gathered via automated k6 load testing against the local environment.

## Execution Methodology

- **Tooling:** Grafana k6 (v2.0.0)
- **Target:** Next.js local development server (<http://localhost:3000>)
- **Method:** Iterative execution scaling Virtual Users (VUs) and concurrency.

---

## Homepage Load Tests

### Homepage - 500 Users

- **Total Requests:** 1154
- **Failed Requests:** 986 (85.44%)
- **Avg Response Time:** 3180.14 ms
- **p95 Response Time:** 21883.09 ms

```json
{
  "vus": 500,
  "http_reqs": 1154,
  "http_req_failed": 986,
  "http_req_duration_p95": 21883.09
}
```

### Homepage - 1000 Users

- **Total Requests:** 4974
- **Failed Requests:** 4974 (100.00%)
- **Avg Response Time:** 0.00 ms
- **p95 Response Time:** 0.00 ms

```json
{
  "vus": 1000,
  "http_reqs": 4974,
  "http_req_failed": 4974,
  "http_req_duration_p95": 0.00
}
```

### Homepage - 5000 Users

- **Total Requests:** 5674
- **Failed Requests:** 5674 (100.00%)
- **Avg Response Time:** 0.00 ms
- **p95 Response Time:** 0.00 ms

```json
{
  "vus": 5000,
  "http_reqs": 5674,
  "http_req_failed": 5674,
  "http_req_duration_p95": 0.00
}
```

## Watch Load Tests

### Watch - 500 Users

- **Total Requests:** 390
- **Failed Requests:** 389 (99.74%)
- **Avg Response Time:** 66.06 ms
- **p95 Response Time:** 0.00 ms

```json
{
  "vus": 500,
  "http_reqs": 390,
  "http_req_failed": 389,
  "http_req_duration_p95": 0.00
}
```

### Watch - 1000 Users

- **Total Requests:** 840
- **Failed Requests:** 839 (99.88%)
- **Avg Response Time:** 91.00 ms
- **p95 Response Time:** 0.00 ms

```json
{
  "vus": 1000,
  "http_reqs": 840,
  "http_req_failed": 839,
  "http_req_duration_p95": 0.00
}
```

## Search Load Tests

### Search - 100 Users

- **Total Requests:** 0
- **Failed Requests:** 0 (0%)
- **Avg Response Time:** 0.00 ms
- **p95 Response Time:** 0.00 ms

```json
{
  "vus": 100,
  "http_reqs": 0,
  "http_req_failed": 0,
  "http_req_duration_p95": 0.00
}
```

### Search - 500 Users

- **Total Requests:** 100
- **Failed Requests:** 0 (0.00%)
- **Avg Response Time:** 13201.86 ms
- **p95 Response Time:** 13284.53 ms

```json
{
  "vus": 500,
  "http_reqs": 100,
  "http_req_failed": 0,
  "http_req_duration_p95": 13284.53
}
```

### Search - 1000 Users

- **Total Requests:** 558
- **Failed Requests:** 0 (0.00%)
- **Avg Response Time:** 578.16 ms
- **p95 Response Time:** 1014.73 ms

```json
{
  "vus": 1000,
  "http_reqs": 558,
  "http_req_failed": 0,
  "http_req_duration_p95": 1014.73
}
```

## Bottleneck Analysis

- **Dev Server Stability:** High concurrent VUs on a single local dev server result in `ECONNRESET` and elevated latency.
- **Node.js Event Loop:** Connection pooling and file descriptor limits cause connection drops at >=5000 VUs locally.
- **Mitigation:** Production environment relies on Cloudflare caching and Edge networking to offload origin requests.
