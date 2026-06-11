export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("[Diagnostics] Triggering Sentry test exception for Sprint 3 validation...");
    throw new Error("sprint3 sentry validation");
}
