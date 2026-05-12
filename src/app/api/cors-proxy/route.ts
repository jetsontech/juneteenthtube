import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });

  try {
    const response = await fetch(targetUrl, {
      next: { revalidate: 0 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.pluto.tv',
        'Referer': 'https://www.pluto.tv/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Connection': 'keep-alive',
      }
    });

    if (!response.ok) throw new Error(`Provider Status: ${response.status}`);

    const data = await response.text();
    const urlObj = new URL(targetUrl);
    
    // Clean base URL calculation
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);

    const rewrittenData = data.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;

      let fullUrl;
      if (trimmed.startsWith('http')) {
        fullUrl = trimmed;
      } else if (trimmed.startsWith('/')) {
        fullUrl = urlObj.origin + trimmed;
      } else {
        fullUrl = baseUrl + trimmed;
      }
      
      return `/api/cors-proxy?url=${encodeURIComponent(fullUrl)}`;
    }).join('\n');

    return new NextResponse(rewrittenData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error: any) {
    console.error('Proxy Engine Error:', error.message);
    return new NextResponse('Signal Timeout', { status: 504 });
  }
}
