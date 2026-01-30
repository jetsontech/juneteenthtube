import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
        return new NextResponse("Missing URL parameter", { status: 400 });
    }

    try {
        console.log(`[ArchiveProxy] Fetching: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "cross-site",
                "Upgrade-Insecure-Requests": "1",
                "Referer": "https://www.google.com/", // Mask referer
            },
            redirect: "follow",
        });

        if (!response.ok) {
            console.error(`[ArchiveProxy] Error ${response.status}: ${response.statusText}`);
            return new NextResponse(`Failed to fetch archival resource: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get("content-type");
        let body = await response.text();

        // If it's HTML, we MUST inject a <base> tag and potentially rewrite some links
        if (contentType?.includes("text/html")) {
            const urlObj = new URL(targetUrl);
            const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;

            // Clean up the HTML to ensure base tag works and remove target="_blank" that might break integration
            body = body.replace(/<head\b[^>]*>/i, `$&${baseTag}`);

            // Optional: Remove frame-breaking scripts if found (very basic cleanup)
            body = body.replace(/if\s*\(window\.top\s*!==\s*window\.self\).*?{.*?}/gs, "/* Frame Break Disabled */");
        }

        // Prepare headers for the response to the client
        const clientHeaders = new Headers();
        clientHeaders.set("Content-Type", contentType || "text/html");
        clientHeaders.set("X-Frame-Options", "ALLOWALL");
        clientHeaders.set("Content-Security-Policy", "frame-ancestors *;"); // Allow embedding everywhere
        clientHeaders.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(body, {
            status: 200,
            headers: clientHeaders,
        });
    } catch (error: any) {
        console.error(`[ArchiveProxy] Exception: ${error.message}`);
        return new NextResponse(`Shadow Portal Exception: ${error.message}`, { status: 500 });
    }
}
