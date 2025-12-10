"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugUploadPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState("idle");

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLogs([]);
        setStatus("running");
        addLog(`Started upload for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        try {
            // STEP 1: API Route
            addLog("Step 1: Fetching Signed URL from /api/upload...");
            const apiRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type || "video/mp4",
                }),
            });

            if (!apiRes.ok) {
                const text = await apiRes.text();
                throw new Error(`API Endpoint Failed (${apiRes.status}): ${text}`);
            }

            const { signedUrl, publicUrl, error } = await apiRes.json();
            if (error) throw new Error(`API Error: ${error}`);

            addLog("✅ Step 1 Success. Got Signed URL.");
            addLog(`   Public URL: ${publicUrl}`);

            // STEP 2: R2 Upload
            addLog("Step 2: Uploading to R2 (via XHR with 3 Retries)...");

            const uploadWithRetry = async (retries = 3): Promise<void> => {
                return new Promise((resolve, reject) => {
                    const attempt = (n: number) => {
                        addLog(`   Attempt ${retries - n + 1} of ${retries}...`);
                        const xhr = new XMLHttpRequest();
                        xhr.open("PUT", signedUrl);
                        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable) {
                                const percentComplete = ((event.loaded / event.total) * 100).toFixed(0);
                                // Log every 10%
                                if (+percentComplete % 10 === 0 && +percentComplete > 0) {
                                    addLog(`   Upload Progress: ${percentComplete}%`);
                                }
                            }
                        };

                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve();
                            } else {
                                if (n > 1) {
                                    addLog(`   ⚠️ Failed (${xhr.status}). Retrying in 2s...`);
                                    setTimeout(() => attempt(n - 1), 2000);
                                } else {
                                    reject(new Error(`R2 Upload Failed: ${xhr.status} ${xhr.statusText}`));
                                }
                            }
                        };

                        xhr.onerror = () => {
                            if (n > 1) {
                                addLog(`   ⚠️ Network Error. Retrying in 3s...`);
                                setTimeout(() => attempt(n - 1), 3000);
                            } else {
                                reject(new Error("Network Error during upload (Final Attempt)"));
                            }
                        };

                        xhr.timeout = 0; // No timeout
                        xhr.send(file);
                    };
                    attempt(retries);
                });
            };

            await uploadWithRetry();

            addLog("✅ Step 2 Success. File on R2.");

            // STEP 3: Supabase Insert
            addLog("Step 3: Inserting metadata to Supabase...");
            const { data, error: dbError } = await supabase
                .from('videos')
                .insert([{
                    title: `DEBUG: ${file.name}`,
                    video_url: publicUrl,
                    thumbnail_url: "https://placehold.co/600x400",
                    category: "All"
                }])
                .select()
                .single();

            if (dbError) {
                throw new Error(`Supabase DB Error: ${JSON.stringify(dbError)}`);
            }

            addLog("✅ Step 3 Success. Saved to DB.");
            addLog("🎉 FULL SUCCESS!");
            setStatus("success");

        } catch (err: any) {
            console.error(err);
            addLog(`❌ ERROR: ${err.message}`);
            if (err.cause) addLog(`   Cause: ${JSON.stringify(err.cause)}`);
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-4 text-red-500">Video Upload Debugger</h1>
            <div className="mb-8 p-4 border border-white/20 rounded bg-white/5">
                <label className="block mb-2 font-bold">Select a Video File:</label>
                <input
                    type="file"
                    onChange={handleUpload}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-red-50 file:text-red-700
                        hover:file:bg-red-100"
                />
            </div>

            <div className="mb-8 p-4 border border-blue-500/20 rounded bg-blue-500/10">
                <h3 className="font-bold text-blue-400 mb-2">Diagnostic Tool</h3>
                <button
                    onClick={() => {
                        const blob = new Blob(["This is a connectivity test file."], { type: "text/plain" });
                        const file = new File([blob], "conn-test.txt", { type: "text/plain" });
                        // Create synthetic event
                        const event = { target: { files: [file] } } as any;
                        handleUpload(event);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    Run 1KB Connectivity Test
                </button>
            </div>

            <div className="p-4 bg-gray-900 rounded border border-gray-700 min-h-[300px]">
                <h3 className="text-lg font-bold mb-2 border-b border-gray-700 pb-2">Logs</h3>
                {logs.length === 0 && <p className="text-gray-500 italic">Waiting for input...</p>}
                {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes("ERROR") ? "text-red-400 font-bold" : "text-green-400"}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}
