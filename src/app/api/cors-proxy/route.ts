import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s limit

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.pluto.tv/',
        'Origin': 'https://www.pluto.tv',
        'X-Forwarded-For': '12.34.56.78' // Spoofing a generic US IP
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If the provider blocks Vercel, we need to know
      return NextResponse.json({ error: `Provider Blocked (${response.status})` }, { status: response.status });
    }

    const data = await response.text();
    const urlObj = new URL(targetUrl);
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
    
    /**
     * RECURSIVE REWRITE: 
     * This ensures that relative .m3u8 AND .ts segments are all 
     * pulled through your proxy instead of directly from the provider.
     */
    const rewrittenData = data.replace(/^(?!(#|http|https|data))/gm, (match) => {
        return `/api/cors-proxy?url=${encodeURIComponent(baseUrl + match)}`;
    });

    return new NextResponse(rewrittenData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error("Proxy Timeout:", error.message);
    return NextResponse.json({ error: 'Signal Timeout' }, { status: 504 });
  }
}
