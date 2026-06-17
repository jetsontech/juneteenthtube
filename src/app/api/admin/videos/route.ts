import { NextResponse } from "next/server";
type Video = { id: string; title?: string; videoUrl: string; transcodeStatus?: "pending" | "processing" | "completed" | "failed" | null; };
export async function GET() { const mock: Video[] = [ { id: "demo-1", title: "Demo Video 1", videoUrl: "/videos/demo-1.mp4", transcodeStatus: "completed" }, { id: "demo-2", title: "Demo Video 2", videoUrl: "/videos/demo-2.mp4", transcodeStatus: "failed" } ]; return NextResponse.json({ videos: mock }); }
