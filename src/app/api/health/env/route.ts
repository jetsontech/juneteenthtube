import { NextResponse } from "next/server";

export async function GET() {

    return NextResponse.json({

        NEXT_PUBLIC_SUPABASE_URL:
            !!process.env.NEXT_PUBLIC_SUPABASE_URL,

        SUPABASE_SERVICE_ROLE_KEY:
            !!process.env.SUPABASE_SERVICE_ROLE_KEY,

        S3_PUBLIC_DOMAIN:
            !!process.env.S3_PUBLIC_DOMAIN

    });

}
