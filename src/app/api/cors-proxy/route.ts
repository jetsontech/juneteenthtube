import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://www.pluto.tv/',
        'Origin': 'https://www.pluto.tv'
      }
    });

    if (!response.ok) throw new Error(`Provider returned ${response.status}`);

    const data = await response.text();

    // Fix: Identify the base directory of the stream
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
    
    // Fix: Rewrite any line that isn't a comment (#) or a full URL (http) 
    // to include the absolute path back to the provider.
    const rewrittenData = data.replace(/^(?!(#|http|https|data))/gm, baseUrl);

    return new NextResponse(rewrittenData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0'
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Proxy Error', details: error.message }, { status: 500 });
  }
}
