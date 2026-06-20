import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ achievements: [] });
  const { data } = await supabaseAdmin
    .from("cq_achievements")
    .select("achievement, label, icon, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ achievements: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, achievement, label, icon } = await req.json();
    if (!user_id || !achievement)
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    const { error } = await supabaseAdmin.from("cq_achievements").upsert(
      { user_id, achievement, label, icon },
      { onConflict: "user_id,achievement", ignoreDuplicates: true }
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[CQ achievements]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}