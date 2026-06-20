import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ points: 0, level: 1 });
  const { data } = await supabaseAdmin
    .from("cq_points")
    .select("points, level")
    .eq("user_id", userId)
    .single();
  return NextResponse.json(data ?? { points: 0, level: 1 });
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, delta } = await req.json();
    if (!user_id || typeof delta !== "number")
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    const { data, error } = await supabaseAdmin.rpc("upsert_cq_points", {
      p_user_id: user_id,
      p_delta: delta,
    });
    if (error) throw error;
    return NextResponse.json({ points: data });
  } catch (e) {
    console.error("[CQ points]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}