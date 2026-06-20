import { NextResponse } from 'next/server';

type ApiHandler = (...args: unknown[]) => Promise<Response> | Response;

export function safeApi(handler: ApiHandler) {
  return async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (e: unknown) {
      console.error('[API SAFE FAIL]', e);

      return NextResponse.json({
        error: 'system degraded',
        fallback: true,
        data: []
      }, { status: 200 });
    }
  };
}
