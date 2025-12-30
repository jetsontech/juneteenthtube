import dotenv from "dotenv";
// import fetch from "node-fetch"; // Enabled by default in Node 18+

dotenv.config({ path: ".env.local" });

async function testUpload() {
    console.log("🚀 Testing Upload Flow...");
    console.log(`Endpoint: http://127.0.0.1:3001/api/upload`);

    try {
        // 1. Request Signed URL
        const start = Date.now();
        console.log("1️⃣  Requesting Presigned URL...");
        const res = await fetch("http://127.0.0.1:3001/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: "test-upload-script.txt",
                contentType: "text/plain"
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API Error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const { signedUrl, publicUrl, key } = data;

        console.log("✅ Got Signed URL!");
        console.log(`   Key: ${key}`);
        console.log(`   Public URL: ${publicUrl}`);
        // console.log(`   Signed URL: ${signedUrl}`); 

        // 2. Upload File to R2
        console.log("2️⃣  Uploading to R2 via Presigned URL...");
        const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": "text/plain" },
            body: "This is a test upload from the verification script."
        });

        if (!uploadRes.ok) {
            const uploadErr = await uploadRes.text();
            throw new Error(`R2 Upload Failed (${uploadRes.status}): ${uploadErr}`);
        }

        console.log("✅ Upload Successful!");
        console.log(`⏱️  Total Time: ${Date.now() - start}ms`);

    } catch (error: unknown) {
        console.error("❌ Test Failed:", (error as Error).message);
        if (error && typeof error === 'object' && 'cause' in error) console.error("Cause:", (error as { cause: unknown }).cause);
    }
}

testUpload();
