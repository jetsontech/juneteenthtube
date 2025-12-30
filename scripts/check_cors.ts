import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkCors() {
    // URL to check - using hardcoded R2 URL for testing
    // Also try the S3 API endpoint if possible (usually requires auth for simple fetches, but OPTIONS might work?)
    // S3 endpoints are tricky with fetch. Let's stick to the public endpoint first if it exists.

    const targetUrl = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev/random-file";

    console.log(`🔍 Checking CORS for: ${targetUrl}`);
    console.log(`   Origin: http://localhost:3001`);

    try {
        const res = await fetch(targetUrl, {
            method: "OPTIONS",
            headers: {
                "Origin": "http://localhost:3001",
                "Access-Control-Request-Method": "PUT"
            }
        });

        console.log(`\nResponse Status: ${res.status}`);
        console.log("Response Headers:");
        const allowOrigin = res.headers.get("access-control-allow-origin");
        const allowMethods = res.headers.get("access-control-allow-methods");

        console.log(` - Access-Control-Allow-Origin: ${allowOrigin}`);
        console.log(` - Access-Control-Allow-Methods: ${allowMethods}`);

        if (allowOrigin === "*" || allowOrigin === "http://localhost:3001") {
            console.log("\n✅ SUCCESS: CORS is configured to allow localhost:3001!");
        } else {
            console.log("\n❌ FAILURE: CORS headers missing or incorrect.");
        }

    } catch (err: unknown) {
        console.error("Error making request:", (err as Error).message);
    }
}

checkCors();
