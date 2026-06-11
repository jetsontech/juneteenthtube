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
        http_req_duration: ['p(95)<300'],
    },
} : {
    vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,
    duration: __ENV.DURATION || '15s',
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<300'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Setup block runs once to retrieve a real, active video ID from the database feed
export function setup() {
    const res = http.get(`${BASE_URL}/api/videos/feed?limit=5`);
    const data = JSON.parse(res.body);
    const videos = data.videos || [];
    if (videos.length === 0) {
        // Fallback to a placeholder UUID if no videos exist
        return { videoId: '00000000-0000-0000-0000-000000000000' };
    }
    return { videoId: videos[0].id };
}

export default function (data) {
    const videoId = data.videoId;
    const params = {
        headers: {
            'User-Agent': 'k6-load-test',
        },
    };

    // 1. Load watch page (Dynamic route SSR)
    const watchRes = http.get(`${BASE_URL}/watch/${videoId}`, params);
    check(watchRes, {
        'watch page status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Fetch comments for this video
    const commentsRes = http.get(`${BASE_URL}/api/comments?videoId=${videoId}`);
    check(commentsRes, {
        'comments lookup status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 3. Dispatch playback_start telemetry event
    const startPayload = JSON.stringify({
        eventType: 'playback_start',
        videoId: videoId,
        guestId: 'k6-test-guest',
        details: { startupTimeMs: 420 }
    });
    const startRes = http.post(`${BASE_URL}/api/telemetry`, startPayload, {
        headers: { 'Content-Type': 'application/json' }
    });
    check(startRes, {
        'playback_start telemetry reports 200': (r) => r.status === 200,
    });

    sleep(3);

    // 4. Dispatch playback_stop telemetry event
    const stopPayload = JSON.stringify({
        eventType: 'playback_stop',
        videoId: videoId,
        guestId: 'k6-test-guest',
        details: { offsetSeconds: 30 }
    });
    const stopRes = http.post(`${BASE_URL}/api/telemetry`, stopPayload, {
        headers: { 'Content-Type': 'application/json' }
    });
    check(stopRes, {
        'playback_stop telemetry reports 200': (r) => r.status === 200,
    });

    sleep(1);
}
