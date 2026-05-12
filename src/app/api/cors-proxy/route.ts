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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://www.pluto.tv',
        'Referer': 'https://www.pluto.tv/',
      }
    });

    if (!response.ok) throw new Error(`Provider Status: ${response.status}`);

    const data = await response.text();
    const urlObj = new URL(targetUrl);
    
    // Logic to handle relative paths inside the m3u8 file
    const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);

    const rewrittenData = data.split('\n').map(line => {
      const trimmed = line.trim();
      // If it's a link (not a comment/tag), wrap it in our proxy
      if (trimmed && !trimmed.startsWith('#')) {
        const fullUrl = trimmed.startsWith('http') ? trimmed : (baseUrl + trimmed);
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
    console.error('Proxy Error:', error.message);
    return new NextResponse('Signal Timeout', { status: 504 });
  }
}
