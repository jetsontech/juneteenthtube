import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rateLimit';

// Configurable limits via environment variables (with sensible defaults)
const LIMIT_MINUTE = Number(process.env.TELEMETRY_LIMIT_MINUTE || 30);
const LIMIT_HOUR = Number(process.env.TELEMETRY_LIMIT_HOUR || 500);
const LIMIT_DAY = Number(process.env.TELEMETRY_LIMIT_DAY || 5000);

const telemetryLimits = {
  minute: LIMIT_MINUTE,
  hour: LIMIT_HOUR,
  day: LIMIT_DAY
};

export async function POST(req: NextRequest) {
    try {
        // 1. Payload Size Limit check (max 50KB)
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 50 * 1024) {
            return NextResponse.json({ error: 'Payload Too Large' }, { status: 413 });
        }

        // 2. Parse Payload safely
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        const { eventType, videoId, guestId, details, idempotencyKey } = body;

                // 3. Flood Protection / Rate Limiting (by IP, User, and Session/Guest)
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown-ip';
        
        // Check IP-based limit
        const ipLimitOk = await checkRateLimit('telemetry', `ip:${ip}`, telemetryLimits);
        if (!ipLimitOk) {
            return NextResponse.json({ error: 'Too Many Requests (IP)' }, { status: 429 });
        }

        // Authenticate the user session token safely if present
        const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
        let authenticatedUserId = null;
        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                authenticatedUserId = user.id;
            }
        }

        // Check User-based limit
        if (authenticatedUserId) {
            const userLimitOk = await checkRateLimit('telemetry', `user:${authenticatedUserId}`, telemetryLimits);
            if (!userLimitOk) {
                return NextResponse.json({ error: 'Too Many Requests (User)' }, { status: 429 });
            }
        } 
        
        // Check Session-based limit
        const activeGuestId = guestId || ip;
        if (activeGuestId) {
            const guestLimitOk = await checkRateLimit('telemetry', `guest:${activeGuestId}`, telemetryLimits);
            if (!guestLimitOk) {
                return NextResponse.json({ error: 'Too Many Requests (Session)' }, { status: 429 });
            }
        }

        // 4. Malformed Payload Rejection / Event Validation
        const validEventTypes = ['playback_start', 'playback_stop', 'buffering_start', 'buffering_end', 'playback_error', 'quality_change', 'abandonment', 'watch_complete', 'video_view'];
        if (!eventType || !validEventTypes.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid or missing eventType' }, { status: 400 });
        }

        // 5. Replay Protection
        const iKey = idempotencyKey || crypto.createHash('sha256').update(`${ip}-${eventType}-${videoId}-${Date.now()}`).digest('hex');

        // P0 Sprint 4: Remove database pre-read validation.
        // Validate UUID format via RegExp before inserting. Database FK constraint will handle existence checks.
        let resolvedVideoId = null;
        const isValidUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
        
        if (videoId && isValidUuid(videoId)) {
            resolvedVideoId = videoId;
        }

        // Insert event into analytics_events table using service_role bypasses RLS
        const { data, error } = await supabaseAdmin
            .from('analytics_events')
            .insert({
                event_type: eventType,
                video_id: resolvedVideoId,
                user_id: authenticatedUserId,
                guest_id: authenticatedUserId ? null : (guestId || null),
                details: details || {},
                idempotency_key: iKey
            })
            .select()
            .single();

        if (error) {
            // Replay protection hit (unique constraint on idempotency_key)
            if (error.code === '23505') {
                return NextResponse.json({ success: true, warning: 'Duplicate event ignored' }, { status: 202 });
            }
            
            // Catch Foreign Key violation (video does not exist in videos table)
            if (error.code === '23503') {
                return NextResponse.json({ error: 'Referenced video does not exist' }, { status: 400 });
            }

            console.warn('[Telemetry Fallback Ingested] Gracefully logging database insert warning:', error.message);
            return NextResponse.json({ 
                success: true, 
                warning: 'Telemetry fallback logger active',
                details: error.message 
            }, { status: 200 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Telemetry Failure] Graceful fallback on unexpected exception:', msg);
        return NextResponse.json({ 
            success: true, 
            warning: 'Telemetry exception bypass active',
            details: msg 
        }, { status: 200 });
    }
}
