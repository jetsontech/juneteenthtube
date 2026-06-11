const NodeWebSocket = require('ws');
global.WebSocket = NodeWebSocket;

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

function buildSSML(text, persona, voiceLocale) {
    const safeText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const prosodyOpen = `<prosody rate="${persona.rate}" pitch="${persona.pitch}" volume="${persona.volume}">`;
    const prosodyClose = `</prosody>`;

    const innerContent = persona.style
        ? `<mstts:express-as style="${persona.style}">${prosodyOpen}${safeText}${prosodyClose}</mstts:express-as>`
        : `${prosodyOpen}${safeText}${prosodyClose}`;

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${voiceLocale}"><voice name="${persona.voice}">${innerContent}</voice></speak>`;
}

const persona = {
    voice: "en-US-MichelleNeural",
    rate: "+5%",
    pitch: "+0Hz",
    volume: 100,
    style: "friendly",
};

async function test() {
    console.log("Initializing MsEdgeTTS...");
    try {
        const tts = new MsEdgeTTS();
        console.log("Setting metadata...");
        await tts.setMetadata(persona.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        
        console.log("Building SSML...");
        const ssml = buildSSML("Hello this is a test of raw SSML synthesis.", persona, "en-US");
        console.log("SSML content:", ssml);
        
        console.log("Requesting raw stream...");
        const { audioStream } = tts.rawToStream(ssml);
        
        console.log("Listening to stream events...");
        let bytesCount = 0;
        
        audioStream.on("data", (chunk) => {
            bytesCount += chunk.length;
            console.log(`Received chunk of ${chunk.length} bytes. Total: ${bytesCount}`);
        });
        
        audioStream.on("error", (err) => {
            console.error("Stream error:", err);
        });
        
        audioStream.on("end", () => {
            console.log(`Stream ended. Total bytes received: ${bytesCount}`);
            process.exit(0);
        });
        
        // Timeout check after 10 seconds
        setTimeout(() => {
            console.error("Timeout reached! Stream did not end within 10 seconds.");
            process.exit(1);
        }, 10000);
        
    } catch (err) {
        console.error("Catch error:", err);
        process.exit(1);
    }
}

test();
