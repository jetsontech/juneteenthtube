import { supabaseAdmin } from "@/lib/supabase-admin";

/* Minimal route to mark a video as pending and optionally trigger a local worker (non-blocking) */
export async function POST(req: Request) {
  try {
    const bodyRaw = await req.json().catch(() => ({})) as unknown;
    const body = (bodyRaw && typeof bodyRaw === "object") ? (bodyRaw as Record<string, unknown>) : {};
    const id = typeof body.id === "string" ? body.id : undefined;
    const filename = typeof body.filename === "string" ? body.filename : undefined;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.info("[retrigger-transcode] requested id:", id, "filename:", filename);

    try {
      const { error } = await supabaseAdmin.from("videos").update({ transcode_status: "pending" }).eq("id", id);
      if (error) console.warn("failed to mark video transcode pending:", error);
    } catch (err: unknown) {
      console.warn("supabase update failed", err);
    }

    // Attempt to trigger local worker enqueue if present (non-blocking)
    (async () => {
      try {
        const mod = await import("@/app/api/transcode/worker").catch(() => null);
        const worker = mod as unknown as { handleTranscoding?: (...args: unknown[]) => unknown } | null;
        if (worker && typeof worker.handleTranscoding === "function") {
          if (process.env.ALLOW_LOCAL_TRANSCODE === "true") {
            const getSource = async (): Promise<string | null> => {
              try {
                const res = await supabaseAdmin.from("videos").select("video_url,source_key").eq("id", id).single();
                const row = res.data as unknown;
                if (row && typeof row === "object") {
                  const r = row as Record<string, unknown>;
                  return typeof r.source_key === "string" ? r.source_key : (typeof r.video_url === "string" ? r.video_url : null);
                }
                return null;
              } catch {
                return null;
              }
            };
            const sourceKey = await getSource();
            if (sourceKey) {
              const pathModule = await import("path");
              const tmp = pathModule.join(process.cwd(), "tmp", id);
              // Fire and forget
              try {
                worker.handleTranscoding!(sourceKey, id, tmp);
              } catch (err) {
                console.warn("worker.handleTranscoding threw", err);
              }
            }
          }
        }
      } catch (err: unknown) {
        console.warn("transcode worker enqueue failed", err);
      }
    })();

    return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    console.error("[retrigger-transcode] error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}