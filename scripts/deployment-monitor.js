const https = require('https');

const options = {
    hostname: 'juneteenthtube.vercel.app',
    port: 443,
    path: '/api/transcode-batch',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
};

function checkStatus() {
    console.log('Checking API status...');
    const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log('API is live! Triggering batch transcoding...');
            triggerBatch();
        } else {
            console.log('Deployment not ready. Retrying in 10s...');
            setTimeout(checkStatus, 10000);
        }
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
        setTimeout(checkStatus, 10000);
    });

    req.end();
}

function triggerBatch() {
    const postOptions = { ...options, method: 'POST' };

    const req = https.request(postOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Batch Trigger Response:', data);
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error('Trigger failed:', e);
        process.exit(1);
    });

    req.end();
}

// Start polling
checkStatus();
