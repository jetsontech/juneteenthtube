import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    telemetry_flood: {
      executor: 'constant-arrival-rate',
      rate: 1000, // 1000 requests per second
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 100,
      maxVUs: 500,
    },
  },
};

export default function () {
  const payload = JSON.stringify({
    eventType: 'playback_start',
    videoId: '123e4567-e89b-12d3-a456-426614174000',
    guestId: 'k6-test-guest',
    details: { time: 0 },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `192.168.1.${__VU % 255}` // Simulate 255 distinct IPs
    },
  };

  const res = http.post('http://localhost:3000/api/telemetry', payload, params);
  
  check(res, {
    'status is 200 (Success)': (r) => r.status === 200,
    'status is 429 (Rate Limited)': (r) => r.status === 429,
  });
}
