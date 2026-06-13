import "./set-env";
import NodeWebSocket from "ws";
// @ts-expect-error - Webpack global stub override
global.WebSocket = NodeWebSocket;

import { NextRequest } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * Maya's Voice Engine — Edge Neural TTS
 * ──────────────────────────────────────
 * Tuned for realistic, expressive, urban delivery.
 * Uses Azure Neural Voice styles + styledegree to push expressiveness.
 *
 * Key tricks for natural/urban sound:
 *   • "chat" style = most conversational, sounds like a real person
 *   • styledegree 1.5–2.0 = exaggerated expression (more animated, less robotic)
 *   • Faster rate (+12–25%) = casual/energetic speech cadence
 *   • Slight pitch lifts = adds personality and sass
 *   • AriaNeural = most expressive Edge voice (supports 15+ styles)
 */

interface PersonaConfig {
    voice: string;
    rate: string;
    pitch: string;
    volume: number;
    /** mstts:express-as style — "chat" is the most natural/conversational */
    style?: string;
    /**
     * 0.01–2.0 — how hard to push the style.
     * 1.0 = default, 1.5 = animated, 2.0 = maximum expression.
     * Only supported on en-US voices with express-as styles.
     */
    styledegree?: number;
}

const PERSONAS: Record<string, PersonaConfig> = {
    // ── Default: Warm, real, conversational ──────────────────────────
    // AriaNeural "chat" style with high styledegree sounds like a real person
    // talking to you across the table — not reading from a script.
    default: {
        voice: "en-US-AriaNeural",
        rate: "+12%",
        pitch: "+2Hz",
        volume: 100,
        style: "chat",
        styledegree: 1.6,
    },

    // ── Sassy: Neck-rolling, side-eye energy ─────────────────────────
    // Excited style cranked to 2.0 with fast rate = animated and punchy.
    // This is Maya when you get the answer wrong and she can't believe it.
    sassy: {
        voice: "en-US-AriaNeural",
        rate: "+20%",
        pitch: "+6Hz",
        volume: 100,
        style: "excited",
        styledegree: 2.0,
    },

    // ── No-Nonsense: Straight talk, no filter ────────────────────────
    // Newscast-casual = direct and authoritative but not stiff.
    // Slightly slower for weight. Like an auntie telling you the truth.
    matteroffact: {
        voice: "en-US-JennyNeural",
        rate: "+5%",
        pitch: "-1Hz",
        volume: 95,
        style: "newscast",
        styledegree: 1.3,
    },

    // ── Comedian: Hype man energy, cookout DJ vibes ──────────────────
    // Cheerful style maxed out with fast rate = sounds like your cousin
    // who's too loud at the cookout but everyone loves them.
    comedian: {
        voice: "en-US-AriaNeural",
        rate: "+25%",
        pitch: "+8Hz",
        volume: 100,
        style: "cheerful",
        styledegree: 2.0,
    },

    // ── Storyteller: Rich, dramatic, griot energy ────────────────────
    // Empathetic style with moderate styledegree = emotional depth.
    // This is Maya when she's dropping historical knowledge.
    storyteller: {
        voice: "en-US-AriaNeural",
        rate: "-3%",
        pitch: "-2Hz",
        volume: 95,
        style: "empathetic",
        styledegree: 1.8,
    },

    // ── Soulful: Warm, rich, Nigerian-inflected ──────────────────────
    // en-NG voice gives authentic African warmth and cadence.
    // No style support on this voice — the accent does the heavy lifting.
    soulful: {
        voice: "en-NG-EzinneNeural",
        rate: "+8%",
        pitch: "+3Hz",
        volume: 100,
        // en-NG voices don't support express-as styles
    },
};

/**
 * Build a full SSML string with express-as style + styledegree.
 *
 * styledegree is the secret sauce — it controls how "hard" the voice
 * leans into the style. At 2.0, "excited" sounds genuinely hyped,
 * "chat" sounds like a real person, "cheerful" sounds like your
 * favorite cousin at the cookout.
 */
function buildSSML(text: string, persona: PersonaConfig, voiceLocale: string): string {
    // Escape XML entities
    const safeText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const prosodyOpen = `<prosody rate="${persona.rate}" pitch="${persona.pitch}" volume="${persona.volume}">`;
    const prosodyClose = `</prosody>`;

    let innerContent: string;

    if (persona.style) {
        // Build express-as with optional styledegree attribute
        const degreeAttr = persona.styledegree
            ? ` styledegree="${persona.styledegree}"`
            : "";
        innerContent =
            `<mstts:express-as style="${persona.style}"${degreeAttr}>` +
            `${prosodyOpen}${safeText}${prosodyClose}` +
            `</mstts:express-as>`;
    } else {
        innerContent = `${prosodyOpen}${safeText}${prosodyClose}`;
    }

    return (
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
        `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${voiceLocale}">` +
        `<voice name="${persona.voice}">${innerContent}</voice></speak>`
    );
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const personalityParam = (searchParams.get("personality") || "default")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    if (!text) {
        return new Response("Missing text parameter", { status: 400 });
    }

    // Resolve persona — default if unknown key
    const persona: PersonaConfig = PERSONAS[personalityParam] ?? PERSONAS.default;

    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(persona.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        // Infer locale from voice name (e.g. "en-US" from "en-US-AriaNeural")
        const localeMatch = persona.voice.match(/^(\w{2}-\w{2,3})/);
        const voiceLocale = localeMatch ? localeMatch[1] : "en-US";

        const ssml = buildSSML(text, persona, voiceLocale);

        // rawToStream sends SSML as-is (no double-wrapping)
        const { audioStream } = tts.rawToStream(ssml);
        const chunks: Buffer[] = [];

        const buffer = await new Promise<Buffer>((resolve, reject) => {
            audioStream.on("data", (chunk: Buffer) => {
                chunks.push(chunk);
            });
            audioStream.on("error", (err: unknown) => {
                reject(err);
            });
            audioStream.on("end", () => {
                resolve(Buffer.concat(chunks));
            });
        });

        if (buffer.length === 0) {
            // Fallback: plain toStream without style if rawToStream yields empty audio
            console.warn("[TTS] rawToStream returned 0 bytes — falling back to toStream");
            const tts2 = new MsEdgeTTS();
            await tts2.setMetadata(persona.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
            const { audioStream: stream2 } = tts2.toStream(text, {
                rate: persona.rate,
                pitch: persona.pitch,
                volume: persona.volume,
            });
            const fallbackChunks: Buffer[] = [];
            const fallbackBuffer = await new Promise<Buffer>((resolve, reject) => {
                stream2.on("data", (c: Buffer) => fallbackChunks.push(c));
                stream2.on("error", reject);
                stream2.on("end", () => resolve(Buffer.concat(fallbackChunks)));
            });
            return new Response(new Uint8Array(fallbackBuffer), {
                headers: {
                    "Content-Type": "audio/mpeg",
                    "Cache-Control": "public, max-age=86400, s-maxage=86400",
                },
            });
        }

        return new Response(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
        });
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("--- TTS Route Handler Error:", errorMsg);
        return new Response(errorMsg || "TTS generation failed", { status: 500 });
    }
}
