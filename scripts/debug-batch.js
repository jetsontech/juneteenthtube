const https = require('https');

const options = {
    hostname: 'juneteenthtube.vercel.app',
    port: 443,
    path: '/api/transcode-batch',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Summary:', {
                hevcFound: json.hevcFound,
                completed: json.completed,
                failed: json.failed
            });
            if (json.results && json.results.length > 0) {
                console.log('First Error:', JSON.stringify(json.results.find(r => r.status === 'failed'), null, 2));
            }
        } catch (e) {
            console.log('Raw:', data);
        }
    });
});
req.end();
