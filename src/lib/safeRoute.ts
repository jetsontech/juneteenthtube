import { NextResponse } from 'next/server';

type RouteHandler = (...args: unknown[]) => Promise<Response> | Response;

export function safeRoute(handler: RouteHandler) {
  return async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (err: unknown) {
      console.error('[SAFE ROUTE ERROR]', err);

      // NEVER break frontend
      return NextResponse.json(
        {
          error: 'degraded_mode',
          message: 'system recovered automatically',
          data: [],
          fallback: true,
        },
        { status: 200 }
      );
    }
  };
}
