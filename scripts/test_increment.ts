async function testIncrement() {
    const videoId = "fe7a1a9a-aca1-4648-9496-8b160bac2b7e"; // DJI video ID
    const url = "http://localhost:3000/api/videos/update";
    
    console.log(`Sending PATCH request to ${url} for video ${videoId}...`);
    try {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: videoId,
                increment_views: true
            })
        });
        
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text}`);
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

testIncrement();
