import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const url = request.nextUrl.clone();
    const host = request.headers.get('host');

    // Redirect juneteenthtube.vercel.app to juneteenthtube.com
    if (host && host.includes('vercel.app')) {
        url.host = 'juneteenthtube.com';
        return NextResponse.redirect(url, 301);
    }

    return NextResponse.next();
}

// Only run proxy on relevant paths
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
