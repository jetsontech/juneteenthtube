import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("videos")
            .select("id")
            .limit(1);

        return NextResponse.json({
            success: true,
            data,
            error
        });
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}
