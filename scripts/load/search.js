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
        http_req_duration: ['p(95)<150'],
    },
} : {
    vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,
    duration: __ENV.DURATION || '15s',
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<150'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const SEARCH_TERMS = [
    'Juneteenth',
    'Civil Rights',
    'Speeches',
    'Music',
    'Parade',
    'History',
    'Heritage',
    'Celebration',
    'Atlanta',
    'Black Cinema',
    'Culture',
    'Speeches and Voices'
];

export default function () {
    // Select a random search term
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    const encodedTerm = encodeURIComponent(term);

    const params = {
        headers: {
            'User-Agent': 'k6-load-test',
        },
    };

    // Simulate Explore Page Server Search matching the ILIKE %term% or category selection
    const searchRes = http.get(`${BASE_URL}/api/videos/feed?limit=20&feed=recent&category=All&search=${encodedTerm}`, params);
    
    check(searchRes, {
        'search query status is 200': (r) => r.status === 200,
        'search query returns videos': (r) => {
            const body = JSON.parse(r.body);
            return body && Array.isArray(body.videos);
        }
    });

    sleep(1);
}
