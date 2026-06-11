import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.pluto.tv/',
        'Origin': 'https://www.pluto.tv'
      }
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.text();
    const urlObj = new URL(targetUrl);
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);

    // Fast Regex: Rewrites any line that doesn't start with '#' and isn't empty
    const rewrittenData = data.replace(/^(?!#)(.+)$/gm, (line) => {
      let fullUrl = line.trim();
      if (!fullUrl) return line;
      
      if (!fullUrl.startsWith('http')) {
        fullUrl = fullUrl.startsWith('/') ? (urlObj.origin + fullUrl) : (baseUrl + fullUrl);
      }
      return `/api/cors-proxy?url=${encodeURIComponent(fullUrl)}`;
    });

    return new NextResponse(rewrittenData, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Proxy Error:', err);
    return new NextResponse('Signal Lost', { status: 504 });
  }
}
