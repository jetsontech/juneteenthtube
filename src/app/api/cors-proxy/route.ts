import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // Shorter 6s timeout

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://www.pluto.tv',
        'Referer': 'https://www.pluto.tv/'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.text();
    const urlObj = new URL(targetUrl);
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
    
    // Improved Rewrite: Ensures segments are forced through the proxy too
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
    return NextResponse.json({ error: 'Signal Timeout', details: error.message }, { status: 504 });
  }
}
