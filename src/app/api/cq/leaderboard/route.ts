import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("cq_points")
    .select("user_id, points, level")
    .order("points", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ board: [] });
  return NextResponse.json({ board: data ?? [] });
}