
const fetch = require('node-fetch'); // unlikely to be available, use native fetch if node 18+

async function test() {
    try {
        const res = await fetch('http://localhost:3008/api/upload-multipart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                filename: 'test.mp4',
                contentType: 'video/mp4'
            })
        });

        if (!res.ok) {
            const text = await res.text();
            console.log('Error:', res.status, text);
        } else {
            const json = await res.json();
            console.log('Success:', json);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

test();
