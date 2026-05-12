import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
      }
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.text();
    const urlObj = new URL(targetUrl);
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);

    // Fast Regex Rewrite (Absolute, Root, and Relative)
    const rewrittenData = data.replace(/^(?!#)(.+)$/gm, (match) => {
      let fullUrl = match.trim();
      if (!fullUrl.startsWith('http')) {
        fullUrl = fullUrl.startsWith('/') ? (urlObj.origin + fullUrl) : (baseUrl + fullUrl);
      }
      return `/api/cors-proxy?url=${encodeURIComponent(fullUrl)}`;
    });

    return new NextResponse(rewrittenData, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new NextResponse('Signal Lost', { status: 504 });
  }
}
