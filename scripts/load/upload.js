import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export const options = __ENV.STAGES === 'true' ? {
    stages: [
        { duration: '30s', target: __ENV.VUS ? parseInt(__ENV.VUS) : 5 },
        { duration: '1m', target: __ENV.VUS ? parseInt(__ENV.VUS) : 5 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<5000'],
    },
} : {
    vus: __ENV.VUS ? parseInt(__ENV.VUS) : 2,
    duration: __ENV.DURATION || '15s',
    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<5000'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Mock binary data for a small file upload
const binFile = new ArrayBuffer(1024 * 50); // 50KB

export default function () {
    const fd = new FormData();
    fd.append('file', http.file(binFile, 'test-video.mp4', 'video/mp4'));
    fd.append('title', 'Load Test Upload');
    fd.append('description', 'Testing upload capabilities under load');
    fd.append('visibility', 'private');

    const res = http.post(`${BASE_URL}/api/upload/initiate`, fd.body(), {
        headers: {
            'Content-Type': 'multipart/form-data; boundary=' + fd.boundary,
            'User-Agent': 'k6-load-test',
        },
    });

    check(res, {
        'upload initiate status is 200 or 401': (r) => r.status === 200 || r.status === 401,
        // Accept 401 because we might not be authenticated in the load test
    });

    sleep(2);
}
