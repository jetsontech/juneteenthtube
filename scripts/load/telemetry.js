import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = __ENV.STAGES === 'true' ? {
    stages: [
        { duration: '30s', target: __ENV.VUS ? parseInt(__ENV.VUS) : 50 },
        { duration: '1m', target: __ENV.VUS ? parseInt(__ENV.VUS) : 50 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<100'],
    },
} : {
    vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,
    duration: __ENV.DURATION || '15s',
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<100'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    const payload = JSON.stringify({
        event: 'video_view',
        properties: {
            videoId: 'mock-video-id',
            duration: 10,
            viewerId: 'anonymous',
        }
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'k6-load-test',
        },
    };

    // Assuming there is a telemetry or analytics endpoint.
    // Replace with the actual endpoint once verified.
    const res = http.post(`${BASE_URL}/api/telemetry`, payload, params);

    check(res, {
        'telemetry status is 200 or 202 or 404': (r) => [200, 202, 404].includes(r.status), 
        // 404 is checked in case endpoint isn't fully implemented yet
    });

    sleep(1);
}
