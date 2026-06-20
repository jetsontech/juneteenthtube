import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });

  try {
    const isPlaylist = targetUrl.toLowerCase().includes('.m3u8');

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const contentType = response.headers.get('content-type') || '';

    if (isPlaylist || contentType.includes('mpegurl') || contentType.includes('m3u8')) {
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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Binary streaming for segment files (.ts) or other non-manifest assets
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType || 'video/MP2T',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    console.error('Proxy Error:', err);
    return new NextResponse('Signal Lost', { status: 504 });
  }
}

