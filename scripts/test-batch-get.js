const https = require('https');

const options = {
    hostname: 'juneteenthtube.vercel.app',
    port: 443,
    path: '/api/transcode-batch',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    console.log(`GET Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            if (data) {
                console.log('Response:', data);
            } else {
                console.log('No data received');
            }
        } catch (e) {
            console.log('Raw Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();
