import { NextRequest, NextResponse } from "next/server";

/**
 * Heritage Gateway Proxy v.05
 * Server-side proxy that fetches external archive sites and serves them
 * from our own domain, stripping X-Frame-Options and CSP headers so they
 * can be embedded in iframes within CultureQuest.
 * 
 * Profile order tested and verified:
 *   1. Googlebot - works for si.edu, nmaahc.si.edu, sova.si.edu, loc.gov/pictures
 *   2. Chrome UA - works for slavevoyages.org, archives.gov
 *   3. Safari UA - fallback
 */

// Ordered by success rate across tested institutional sites
const HEADER_PROFILES: Record<string, string>[] = [
    // Profile 1: Googlebot — verified working for Smithsonian sites
    {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    },
    // Profile 2: Chrome — verified working for slavevoyages.org, archives.gov
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "DNT": "1",
        "Upgrade-Insecure-Requests": "1",
    },
    // Profile 3: Safari — additional fallback
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    },
];

function buildErrorPage(title: string, message: string, targetUrl: string): string {
    return `<!DOCTYPE html>
<html data-proxy-error="true">
<head><meta charset="utf-8"><title>Gateway Error</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;
display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
.card{max-width:480px;text-align:center}
.icon{width:64px;height:64px;margin:0 auto 1.5rem;border-radius:1rem;
background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.2);
display:flex;align-items:center;justify-content:center;font-size:1.5rem}
h1{font-size:1.5rem;font-style:italic;margin-bottom:0.75rem;font-family:Georgia,serif}
p{color:#888;font-size:0.875rem;line-height:1.6;margin-bottom:1.5rem}
.url{font-size:0.7rem;color:#555;word-break:break-all;font-family:monospace}
</style></head>
<body><div class="card">
<div class="icon">🔒</div>
<h1>${title}</h1>
<p>${message}</p>
<p class="url">${targetUrl}</p>
</div></body></html>`;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
        return new NextResponse(
            buildErrorPage("Missing Parameter", "No URL was provided to the gateway.", ""),
            { status: 400, headers: { "Content-Type": "text/html" } }
        );
    }

    try {
        console.log(`[HeritageGateway] Connecting: ${targetUrl}`);

        let response: Response | null = null;
        let lastStatus = 0;

        // Try each header profile until one succeeds
        for (let i = 0; i < HEADER_PROFILES.length; i++) {
            try {
                const profileHeaders = { ...HEADER_PROFILES[i] };

                const attempt = await fetch(targetUrl, {
                    headers: profileHeaders,
                    method: "GET",
                    cache: "no-store",
                    redirect: "follow",
                });

                lastStatus = attempt.status;

                if (attempt.ok) {
                    response = attempt;
                    console.log(`[HeritageGateway] Connected via profile ${i + 1} (${["Googlebot", "Chrome", "Safari"][i]})`);
                    break;
                }

                console.log(`[HeritageGateway] Profile ${i + 1} blocked (${attempt.status})`);
                // Consume body to prevent memory leak
                await attempt.text().catch(() => {});
            } catch (profileError) {
                console.log(`[HeritageGateway] Profile ${i + 1} error: ${profileError}`);
            }
        }

        if (!response) {
            console.error(`[HeritageGateway] All profiles exhausted. Last status: ${lastStatus}`);
            const errorHtml = buildErrorPage(
                "Institutional Firewall Active",
                `This archive's security systems blocked all connection attempts (${lastStatus}). Switching to direct connection mode...`,
                targetUrl
            );
            return new NextResponse(errorHtml, {
                status: 200,
                headers: {
                    "Content-Type": "text/html",
                    "X-Frame-Options": "ALLOWALL",
                    "X-Proxy-Status": "blocked",
                },
            });
        }

        const contentType = response.headers.get("content-type");
        let body = await response.text();

        // Process HTML content
        if (contentType?.includes("text/html")) {
            const urlObj = new URL(targetUrl);
            const baseHref = `${urlObj.origin}${urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1)}`;
            const baseTag = `<base href="${baseHref}" target="_self">`;

            // Inject base tag for relative URL resolution
            if (body.match(/<head\b[^>]*>/i)) {
                body = body.replace(/<head\b[^>]*>/i, `$&${baseTag}`);
            } else {
                body = `<head>${baseTag}</head>` + body;
            }

            // Neutralize frame-breaking scripts
            body = body
                .replace(/if\s*\(window\.top\s*!==\s*window\.self\)/gi, "if(false)")
                .replace(/if\s*\(top\s*!==\s*self\)/gi, "if(false)")
                .replace(/self\s*==\s*top/gi, "true")
                .replace(/window\.top\s*=\s*window\.self/gi, "/* neutralized */")
                .replace(/top\.location\.href\s*=\s*/gi, "// neutralized: ")
                .replace(/window\.top\.location\s*=\s*/gi, "// neutralized: ")
                .replace(/parent\.location\.href\s*=\s*/gi, "// neutralized: ")
                .replace(/top\.location\s*=\s*/gi, "// neutralized: ");

            // Inject portal integration script
            const portalScript = `
            <script>
                (function() {
                    // Prevent frame-breaking
                    try { window.top = window; } catch(e) {}
                    try { window.parent = window; } catch(e) {}
                    try { window.frameElement = null; } catch(e) {}
                    
                    // Intercept navigation
                    window.addEventListener('beforeunload', function(e) {
                        e.stopPropagation();
                    }, true);

                    // Rewrite external links to route through the proxy
                    document.addEventListener('click', function(e) {
                        var link = e.target.closest('a');
                        if (link && link.href) {
                            var href = link.href;
                            if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = '/api/archive-proxy?url=' + encodeURIComponent(href);
                            }
                        }
                    }, true);

                    // Signal successful load
                    window.addEventListener('load', function() {
                        document.body.setAttribute('data-portal-loaded', 'true');
                    });
                })();
            </script>`;
            body = body.replace(/<\/head>/i, `${portalScript}</head>`);
        }

        // Serve with fully permissive headers — strip ALL institutional security
        const clientHeaders = new Headers();
        clientHeaders.set("Content-Type", contentType || "text/html");
        clientHeaders.set("X-Frame-Options", "ALLOWALL");
        // Override any institutional CSP with fully permissive policy
        clientHeaders.set("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *;");
        clientHeaders.set("Access-Control-Allow-Origin", "*");
        clientHeaders.set("X-Proxy-Status", "success");

        return new NextResponse(body, {
            status: 200,
            headers: clientHeaders,
        });
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[HeritageGateway] Critical failure: ${errorMsg}`);
        const errorHtml = buildErrorPage(
            "Connection Failed",
            `The gateway encountered an error: ${errorMsg}`,
            targetUrl
        );
        return new NextResponse(errorHtml, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
                "X-Frame-Options": "ALLOWALL",
                "X-Proxy-Status": "error",
            },
        });
    }
}
