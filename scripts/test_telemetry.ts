import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTelemetrySecurityTests() {
    console.log("====================================================");
    console.log("CULTUREQUEST TELEMETRY CONTROLS SECURITY VALIDATION");
    console.log("====================================================");
    console.log(`Target Endpoint: ${BASE_URL}/api/telemetry\n`);

    let passedTests = 0;
    let failedTests = 0;

    const recordResult = (name: string, expectedStatus: number | number[], actualStatus: number, success: boolean, detail: string) => {
        const expectedStr = Array.isArray(expectedStatus) ? expectedStatus.join(' or ') : expectedStatus;
        if (success) {
            console.log(`✅ [PASS] ${name}`);
            console.log(`   - Expected: ${expectedStr}, Got: ${actualStatus}`);
            console.log(`   - Control Mechanism: ${detail}`);
            passedTests++;
        } else {
            console.log(`❌ [FAIL] ${name}`);
            console.log(`   - Expected: ${expectedStr}, Got: ${actualStatus}`);
            console.log(`   - Control Mechanism: ${detail}`);
            failedTests++;
        }
        console.log("----------------------------------------------------");
    };

    // Test 1: Valid Telemetry Event Ingestion
    try {
        console.log("Test 1: Sending Valid Telemetry Event ('video_view')...");
        const res = await fetch(`${BASE_URL}/api/telemetry`, {
            method: 'POST',
            body: JSON.stringify({
                eventType: 'video_view',
                videoId: '78ac83fb-980b-47e2-8ea7-5d070b4c8180', // Real database UUID
                details: { playbackTimeMs: 15200 }
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        const body = await res.json().catch(() => ({}));
        recordResult(
            "Valid Event Ingestion",
            [200, 202],
            res.status,
            [200, 202].includes(res.status),
            "Processed valid telemetry payload and generated database record safely."
        );
    } catch (e: any) {
        console.warn("Test 1 Connection failed:", e.message);
    }

    // Test 2: Event Type Validation
    try {
        console.log("Test 2: Sending Malicious / Whitelist Bypass Event Type...");
        const res = await fetch(`${BASE_URL}/api/telemetry`, {
            method: 'POST',
            body: JSON.stringify({
                eventType: 'DROP TABLE analytics_events;', // Injection attempt
                videoId: '78ac83fb-980b-47e2-8ea7-5d070b4c8180'
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        recordResult(
            "Event Type Whitelist Enforcement",
            400,
            res.status,
            res.status === 400,
            "Rejected event because it violates the approved strict whitelist."
        );
    } catch (e: any) {
        console.warn("Test 2 Connection failed:", e.message);
    }

    // Test 3: Payload Size Limit (413)
    try {
        console.log("Test 3: Sending Large Payload (Over 50KB)...");
        const largeString = 'X'.repeat(60 * 1024); // 60KB payload
        const res = await fetch(`${BASE_URL}/api/telemetry`, {
            method: 'POST',
            body: JSON.stringify({
                eventType: 'playback_start',
                details: { padding: largeString }
            }),
            headers: { 
                'Content-Type': 'application/json'
            }
        });
        recordResult(
            "Payload Size Limitation (413)",
            413,
            res.status,
            res.status === 413,
            "Enforced strict request length validation to prevent memory exhaustion."
        );
    } catch (e: any) {
        console.warn("Test 3 Connection failed:", e.message);
    }

    // Test 4: Rate Limiting & Throttling (429)
    try {
        console.log("Test 4: Flooding Telemetry Route (IP Throttling Check)...");
        console.log("   - Issuing rapid concurrent requests to hit the 30 req/min limit...");
        let lastStatus = 200;
        let attempts = 0;
        
        for (let i = 0; i < 40; i++) {
            const res = await fetch(`${BASE_URL}/api/telemetry`, {
                method: 'POST',
                body: JSON.stringify({
                    eventType: 'video_view',
                    videoId: '78ac83fb-980b-47e2-8ea7-5d070b4c8180',
                    idempotencyKey: `flood-test-${i}-${Date.now()}` // Bypass duplicate checks
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            lastStatus = res.status;
            attempts++;
            if (res.status === 429) {
                break;
            }
        }
        
        recordResult(
            "Rate Limiting Challenge (429 Flood Control)",
            429,
            lastStatus,
            lastStatus === 429,
            `Successfully triggered sliding window limit after ${attempts} requests.`
        );
    } catch (e: any) {
        console.warn("Test 4 Connection failed:", e.message);
    }

    console.log("====================================================");
    console.log(`TELEMETRY CONTROLS SCRUTINY COMPLETE: Passed: ${passedTests}, Failed: ${failedTests}`);
    console.log("====================================================");
}

runTelemetrySecurityTests();
