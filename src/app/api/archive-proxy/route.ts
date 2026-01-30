import { NextRequest, NextResponse } from "next/server";

/**
 * Shadow Portal Proxy v.03 (Stealth Mode)
 * Bypasses institutional connection blocks by performing a server-side handshake.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
        return new NextResponse("Missing URL parameter", { status: 400 });
    }

    try {
        console.log(`[ShadowPortal] Decrypting: ${targetUrl}`);

        // High-fidelity header stack to bypass Cloudflare/WAF
        const fetchHeaders: Record<string, string> = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="121", "Google Chrome";v="121"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://www.google.com/",
        };

        const response = await fetch(targetUrl, {
            headers: fetchHeaders,
            method: "GET",
            cache: "no-store",
            redirect: "follow",
        });

        if (!response.ok) {
            console.error(`[ShadowPortal] Blocked by Destination: ${response.status}`);
            return new NextResponse(`Archival Handshake Failed (${response.status}): ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get("content-type");
        let body = await response.text();

        // High-fidelity HTML injection and frame-break neutralization
        if (contentType?.includes("text/html")) {
            const urlObj = new URL(targetUrl);
            const baseHref = `${urlObj.origin}${urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1)}`;
            const baseTag = `<base href="${baseHref}">`;

            // Inject base tag
            body = body.replace(/<head\b[^>]*>/i, `$&${baseTag}`);

            // Aggressive frame-break neutralization
            body = body
                .replace(/if\s*\(window\.top\s*!==\s*window\.self\)/gi, "if(false)")
                .replace(/if\s*\(top\s*!==\s*self\)/gi, "if(false)")
                .replace(/self\s*==\s*top/gi, "true")
                .replace(/window\.top\s*=\s*window\.self/gi, "/* neutralized */")
                .replace(/top\.location\.href\s*=\s*/gi, "// blocked: ")
                .replace(/window\.top\.location\s*=\s*/gi, "// blocked: ")
                .replace(/parent\.location\.href\s*=\s*/gi, "// blocked: ");

            // Stealth protection script
            const stealthScript = `
            <script>
                (function() {
                    // Force local scope for top/parent to prevent frame breaking
                    window.top = window;
                    window.parent = window;
                    window.frameElement = null;
                    
                    // Prevent navigation away from the portal
                    window.addEventListener('beforeunload', function(event) {
                        event.stopPropagation();
                    }, true);

                    // Rewrite links to stay in the portal if possible
                    document.addEventListener('click', function(e) {
                        var target = e.target.closest('a');
                        if (target && target.href && target.href.startsWith(window.location.origin)) {
                            // Let regular links work
                        } else if (target && target.href) {
                            // Potential to proxy sub-links here in future
                        }
                    }, true);
                })();
            </script>`;
            body = body.replace(/<\/head>/i, `${stealthScript}</head>`);
        }

        // Return the modified content with zero security restrictions
        const clientHeaders = new Headers();
        clientHeaders.set("Content-Type", contentType || "text/html");
        clientHeaders.set("X-Frame-Options", "ALLOWALL");
        clientHeaders.set("Content-Security-Policy", "frame-ancestors *;");
        clientHeaders.set("Access-Control-Allow-Origin", "*");
        clientHeaders.set("X-Shadow-Portal", "active");

        return new NextResponse(body, {
            status: 200,
            headers: clientHeaders,
        });
    } catch (error: any) {
        console.error(`[ShadowPortal] Critical Handshake Failure: ${error.message}`);
        return new NextResponse(`Shadow Portal Failure: ${error.message}`, { status: 500 });
    }
}
