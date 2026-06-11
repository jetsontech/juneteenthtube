import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 }, // Ramp up to 500 users over 30s
    { duration: '1m', target: 500 },  // Stay at 500 users for 1m
    { duration: '10s', target: 0 },   // Ramp down to 0
  ],
};

export default function () {
  // Simulate loading the HTML shell
  http.get('http://localhost:3000/');

  // Simulate the 7 concurrent API calls made by the client-side useEffect
  const responses = http.batch([
    ['GET', 'http://localhost:3000/api/videos/feed?feed=trending&limit=20'],
    ['GET', 'http://localhost:3000/api/videos/feed?feed=recent&limit=20'],
    ['GET', 'http://localhost:3000/api/videos/feed?feed=featured&limit=10'],
    ['GET', 'http://localhost:3000/api/videos/feed?category=History&limit=20'],
    ['GET', 'http://localhost:3000/api/videos/feed?category=Music&limit=20'],
    ['GET', 'http://localhost:3000/api/videos/feed?category=Speeches&limit=20'],
    ['GET', 'http://localhost:3000/api/videos/feed?category=Parade&limit=20'],
  ]);

  responses.forEach(res => {
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
