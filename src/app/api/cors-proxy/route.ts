import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s limit to stay under Vercel Hobby ceiling

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.pluto.tv/',
        'Origin': 'https://www.pluto.tv',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Provider Status: ${response.status}`);

    const data = await response.text();
    const urlObj = new URL(targetUrl);
    
    // Get the base directory (e.g., https://site.com/live/stream/)
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
    
    /**
     * UNIVERSAL REWRITE LOGIC
     * Handles:
     * 1. Absolute: https://cdn.com/seg.ts -> Proxied
     * 2. Root-Relative: /hls/seg.ts -> Proxied
     * 3. Path-Relative: seg.ts -> Proxied
     */
    const rewrittenData = data.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        let fullUrl;
        if (trimmed.startsWith('http')) {
          fullUrl = trimmed;
        } else if (trimmed.startsWith('/')) {
          fullUrl = urlObj.origin + trimmed;
        } else {
          fullUrl = baseUrl + trimmed;
        }
        return `/api/cors-proxy?url=${encodeURIComponent(fullUrl)}`;
      }
      return line;
    }).join('\n');

    return new NextResponse(rewrittenData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    // Return a 504 status so Video.js triggers its 'error' event immediately
    console.error('Proxy Error:', error.message);
    return new NextResponse('Signal Timeout', { status: 504 });
  }
}
