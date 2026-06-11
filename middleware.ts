import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { proxy } from "./proxy";

export function middleware(request: NextRequest) {
  const redirectResponse = proxy(request);
  if (redirectResponse.headers.has('location')) {
    return redirectResponse;
  }

  const response = NextResponse.next();

  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src * data: blob:; media-src * blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; frame-src 'self' *; connect-src 'self' *;"
  );

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internal files and static resources)
     * - favicon.ico, sitemap.xml, robots.txt, manifest.json (metadata files)
     */
    "/((?!api|_next|favicon.ico|sitemap.xml|robots.txt|manifest.json).*)",
  ],
};
