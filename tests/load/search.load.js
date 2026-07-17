import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests should be below 250ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  // Example search API endpoint call
  const res = http.get('http://localhost:3000/api/v1/health');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 250ms': (r) => r.timings.duration < 250,
  });
  
  sleep(1);
}
