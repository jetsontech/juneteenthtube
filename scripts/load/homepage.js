import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Options: Can be overridden by CLI arguments, e.g. --vus 500 --duration 1m
export const options = __ENV.STAGES === 'true' ? {
    stages: [
        { duration: '30s', target: __ENV.VUS ? parseInt(__ENV.VUS) : 50 },
        { duration: '1m', target: __ENV.VUS ? parseInt(__ENV.VUS) : 50 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<200'],
    },
} : {
    vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,
    duration: __ENV.DURATION || '15s',
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<200'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    const params = {
        headers: {
            'User-Agent': 'k6-load-test',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        },
    };

    // 1. Visit homepage (Server Component / Static render)
    const homeRes = http.get(`${BASE_URL}/`, params);
    check(homeRes, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage contains brand': (r) => r.body.includes('CultureQuest') || r.body.includes('culturequest'),
    });

    sleep(1);

    // 2. Fetch paginated trending feed (limit 20)
    const trendRes = http.get(`${BASE_URL}/api/videos/feed?feed=trending&limit=20`, {
        headers: { 'Content-Type': 'application/json' }
    });
    check(trendRes, {
        'trending API status is 200': (r) => r.status === 200,
        'trending API returns list': (r) => {
            const body = JSON.parse(r.body);
            return body && Array.isArray(body.videos);
        }
    });

    sleep(1);

    // 3. Fetch paginated recent feed (limit 20)
    const recentRes = http.get(`${BASE_URL}/api/videos/feed?feed=recent&limit=20`, {
        headers: { 'Content-Type': 'application/json' }
    });
    check(recentRes, {
        'recent API status is 200': (r) => r.status === 200,
    });

    sleep(2);
}
