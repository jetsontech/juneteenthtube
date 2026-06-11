/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');

const data = JSON.stringify({
    sourceKey: 'example_video.mp4',
    videoId: 'test-id'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/transcode',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('--- TRIGGERING TRANSCODE (EXPECTING IMMEDIATE RESPONSE)...');
const startTime = Date.now();

const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`--- RESPONSE RECEIVED IN ${duration}ms`);
        console.log('--- STATUS:', res.statusCode);
        console.log('--- BODY:', responseBody);

        if (duration < 5000) {
            console.log('SUCCESS: API returned immediately as expected.');
        } else {
            console.log('WARNING: API took longer than expected. Backgrounding might not be working.');
        }
    });
});

req.on('error', (e) => {
    console.error(`--- REQUEST ERROR: ${e.message}`);
});

req.write(data);
req.end();
